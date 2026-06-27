# Provider 与桥接

> 所属：[开发者](./api.md)　·　同组：[QinhRuinsAPI](./api.md) · [词缀脚本](./affix-scripting.md) · [数据存储](./data-storage.md)
> 相关：[组队与会话](../02-server-guide/party-sessions.md) · [秘境与钥石](../02-server-guide/realms-keystones.md)

QR 不想硬绑某个职业 / 队伍插件，于是把这些「外部能力」抽成 **可插拔来源桥（Provider）**：启动时自动探测装了哪些插件、择优接入，没装就 **降级** 到原版 / 内置实现。本页讲四类桥的接口、降级链、自动探测逻辑。包名 `com.qinhuai.ruins.integration`。

---

## 自动探测总控：ProviderBridges

启动时 `ProviderBridges.register()`（在 `onEnable` 调用）按优先级探测并接入各桥，把成功接入的成长度来源名返回打印到控制台：

```
成长度来源已接入：QinhClass
```

它做两件事：

1. **成长度（GrowthProvider）**：`QinhClass` 优先 → 否则 `MMOCore` → 否则保持原版默认。
2. **队伍（PartyProvider）**：装了 `MMOCore` 则接 MMOCore 队伍 → 否则保持内置队伍。

「装了且可用」的判定 = 该插件已启用 **且** 对应 Provider 的 `isAvailable()`（反射能拿到目标类）为真。第三方插件只要满足类名约定即被自动接入，**无需在 QR 里改代码**。

---

## 1. GrowthProvider —— 成长度来源

「成长度」是 QR 用来缩放战利品 / 难度的玩家强度指标（详见 [战利品系统](../02-server-guide/loot-tables.md)）。接口：

```kotlin
interface GrowthProvider {
    val id: String
    fun isAvailable(): Boolean
    fun getGrowth(player: Player): Double          // 成长度数值
    fun hasClass(player: Player, classId: String): Boolean  // 是否为某职业
}
```

降级链（`GrowthProviders.active()` 取当前生效的那个）：

| 优先级 | 实现 | 取值来源 |
|---|---|---|
| 1 | `QinhClassGrowthProvider`（id=`qinhclass`） | 反射 `com.qinhuai.clazz.api.QinhClassAPI` 的 `getLevel` / `isClass` |
| 2 | `MMOCoreGrowthProvider`（id=`mmocore`） | 反射 `net.Indyuce.mmocore.api.player.PlayerData` 的 `getLevel` / `getProfess` |
| 兜底 | `VanillaGrowthProvider`（id=`vanilla`） | 原版玩家经验等级 `player.level`；`hasClass` 恒 `false` |

> 兜底永远可用（`isAvailable()` 恒真），所以 QR **永远有成长度可读**，不会因为没装职业插件而崩。

---

## 2. PartyProvider —— 队伍来源

组队共享进度 / 战利品归属要知道「谁和谁一队」。接口：

```kotlin
data class RuinParty(val leader: UUID, val members: List<Player>)

interface PartyProvider {
    val id: String
    fun isAvailable(): Boolean
    fun getParty(player: Player): RuinParty
}
```

降级链（`PartyProviders.active()`）：

| 优先级 | 实现 | 队伍来源 |
|---|---|---|
| 1 | `MMOCorePartyProvider`（id=`mmocore`） | 反射 MMOCore `PlayerData.getParty().getOnlineMembers()` |
| 兜底 | `BuiltinPartyProvider`（id=`builtin`） | QR 内置队伍 `BuiltinParties`（`/qr party` 等命令组的运行时队伍） |

> 单人（无队伍）时返回只含自己的 `RuinParty`。内置队伍配法见 [组队与会话](../02-server-guide/party-sessions.md)。

---

## 3. KeystoneItemSource —— 向 QCL 注册钥石物品源

QR 把钥石 / 向导物注册成 **QCL 的物品源（`ItemSource`，id=`qinhruins`）**，于是任何认 QCL 物品引用的系统（掉落表、商店、任务、GUI）都能用 `qinhruins:<...>` 拿到钥石，**无需依赖 QR 的 API**。

注册（`onEnable`）：

```kotlin
ItemManagerAPI.instance.register(KeystoneItemSource, "qinhruins", "qr-keystone")
```

→ 同时挂上别名 `qinhruins` 与 `qr-keystone`。

引用语法（`KeystoneItemSource.getItem(id, amount)`）：

| 引用 | 产出 |
|---|---|
| `qinhruins:<层数>` | 对应层数的钥石，如 `qinhruins:3` = T3 钥石（层数须在 `1..maxTier` 内） |
| `qinhruins:guide_<模板id>` | 该模板的向导指引物 |

跨插件用法（其它插件 / YAML 里直接写引用串）：

```yaml
# 例：某掉落表 / 商店里给一枚 T5 钥石
item: "qinhruins:5"
# 例：发一个指向 ancient_tower 的向导物
item: "qinhruins:guide_ancient_tower"
```

> 这是 QR 和生态的主要物品交接缝 —— **钥石不是 QR 私有物品类型，而是 QCL 物品源里的一条**，统一走 CoreLib 的 `ItemManagerAPI.getHookItem(ref)` 解析。

---

## 4. CitizensBridge —— 机关 NPC

机关动作可以生成 Citizens NPC（看守 / 向导 / 触发点）。装了 Citizens 才生效，否则相关机关动作静默跳过。`CitizensBridge`（反射调用，不硬依赖 Citizens）：

```kotlin
fun isAvailable(): Boolean                         // Citizens 是否启用
fun spawnFor(anchorId, location, name, skin?): Int? // 为锚点生成一个 NPC，返回 NPC id
fun despawnAnchor(anchorId: String)                 // 该锚点的 NPC 全部移除
```

要点：

- NPC 按 **锚点** 归组：同一锚点内 **名字去重**（同名只生成一次）。
- 锚点被回收时 `despawnAnchor` 清理它名下所有 NPC，不留孤儿。
- `skin` 可选；提供则通过 `SkinTrait` 设置皮肤。
- 全程反射，未装 Citizens 时 `spawnFor` 直接返回 `null`，不报错。

机关里如何挂 NPC 动作见 [机关系统](../02-server-guide/mechanisms.md)。

---

## 5. 第三方如何被自动接入

QR 不提供「注册我自己的 Provider」的公开 API —— 接入是 **按类名约定自动探测** 的：

| 你要被当作… | 需满足 |
|---|---|
| 成长度来源 | 你的插件提供 `com.qinhuai.clazz.api.QinhClassAPI`（QinhClass 路径）或被 QR 识别的 `MMOCore PlayerData`；并保持对应方法签名 |
| 队伍来源 | 提供 MMOCore 风格的 `PlayerData.getParty()` |
| 钥石消费方 | 不用接入 QR，直接用 `qinhruins:<层数>` 引用串走 QCL 物品源 |
| NPC 后端 | 装 Citizens 即可（QR 反射调用其 API） |

> 当前成长度 / 队伍桥是 **针对 QinhClass / MMOCore 写死的探测**（非开放注册表）。若要接别的职业插件，需在 QR 侧加一个对应 `GrowthProvider` 实现并纳入 `ProviderBridges.register()` 的探测链。

---

## 下一步

- [战利品系统](../02-server-guide/loot-tables.md) — 成长度如何缩放产出
- [组队与会话](../02-server-guide/party-sessions.md) — 队伍共享进度
- [数据存储](./data-storage.md) — 钥石 / 图鉴的持久化
