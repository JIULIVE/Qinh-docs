# 🧩 QinhSkillsAPI

> 上一页：[graph 与连招](../03-server-guide/graph-combos.md)　·　下一页：[事件](./events.md)

本章给**插件开发者**：如何依赖 QS、入口在哪、`QinhSkillsAPI` 暴露了哪些方法、以及编程式释放技能的路径。本文档对应 QS **1.0.22**。

> QS 只有**一条运行时管线**。所有释放（物品按键 / 命令 / API / 被动）都汇入同一条 `SkillCastPipeline` → `SkillEventGateway`。本章不存在「旧版 / 新版」之分。

---

## 1. 依赖 QS

QS 与 QI 一样：QS 运行时已装在服务器，你只需**编译期依赖**（`provided`），别打包进自己的 jar。

```yaml
# plugin.yml
softdepend: [QinhSkills]
```

::: warning 注意
⚠️ `QinhSkillsAPI` 的部分签名引用了 `QinhCoreLib` 的类型（如事件 `QISkillUseEvent`、`TriggerType`）。编译报 `com.qinhuai.corelib.*` 缺失时，把 **QinhCoreLib** 也 install-file + `provided` 引用。
:::

### 可用性判断（软失败）

QS 缺席时**别调用 API**。靠 `softdepend` 保证加载顺序，并在用之前判活：

```kotlin
val qsReady = Bukkit.getPluginManager().getPlugin("QinhSkills")?.isEnabled == true
if (qsReady) {
    QinhSkillsAPI.cast(player, "fire_wave")
}
```

QS 自身硬依赖 **QinhCoreLib**：CoreLib 未启用时 QS 不启用，因此「QS 启用」即代表 CoreLib 也在。

---

## 2. 入口：`QinhSkillsAPI`

```
包名：com.qinhuai.skills.api
类名：QinhSkillsAPI   （Kotlin object 单例）
```

- **Kotlin** 直接：`QinhSkillsAPI.cast(player, "fire_wave")`
- **Java** 带 `.INSTANCE`：`QinhSkillsAPI.INSTANCE.cast(player, "fire_wave")`

所有方法都接受**技能 id**或 **QI payload**（JSON / 纯串）。内部先用 `resolvePayloadSkillId` 归一成小写技能 id，因此你不必关心传进来的是哪种形式。

---

## 3. 方法总表

| 方法 | 返回 | 作用 |
|---|---|---|
| `resolvePayloadSkillId(payload)` | `String?` | 从 payload 解析技能 id（JSON / 纯串），解析不出返回 `null` |
| `hasSkillDefinition(skillIdOrPayload)` | `Boolean` | 该技能是否已被服务器定义 |
| `isUnlocked(player, skillIdOrPayload)` | `Boolean` | 玩家是否已解锁该技能 |
| `unlock(player, skillId)` | — | 解锁并**立即保存**档案 |
| `lock(player, skillId)` | — | 锁定并**立即保存**档案 |
| `cast(player, payload)` | `Boolean` | 释放技能，`== (castDetailed==SUCCESS)` |
| `castDetailed(player, payload)` | `CastResult` | 释放并返回**详细结果码** |
| `castSkill(player, skillId)` | `CastResult` | 同 `castDetailed`，语义上以技能 id 入参 |
| `setLevel(player, skillId, level)` | — | 设技能等级（下限 1），自动保存 |
| `setSlot(player, slot, skillId?)` | — | 设/清技能槽（`skillId=null` 清槽），自动保存 |
| `silence(player, durationMs)` | — | 沉默/封锁：N 毫秒内放不出任何技能 |
| `isSilenced(player)` | `Boolean` | 当前是否处于沉默/封锁（状态机 LOCKED） |
| `unsilence(player)` | — | 立即解除沉默 |

::: info 说明
📌 `unlock` / `lock` / `setLevel` / `setSlot` 都会**写盘**（`PlayerProfileStore.save`）。批量调用大量玩家时注意频次，详见 [数据存储](./data-storage.md)。
:::

---

## 4. 释放技能

### 最简：成功与否

```kotlin
val ok: Boolean = QinhSkillsAPI.cast(player, "fire_wave")
if (!ok) player.sendMessage("§c放不出来")
```

### 拿到原因码

```kotlin
when (val r = QinhSkillsAPI.castDetailed(player, "fire_wave")) {
    CastResult.SUCCESS -> {}
    CastResult.ON_COOLDOWN -> player.sendMessage("§7冷却中")
    CastResult.NOT_UNLOCKED -> player.sendMessage("§7尚未解锁")
    CastResult.INSUFFICIENT_RESOURCE -> player.sendMessage("§9法力不足")
    CastResult.SILENCED -> player.sendMessage("§c技能被封锁")
    else -> player.sendMessage("§c释放失败：$r")
}
```

### `CastResult` 全部取值

| 结果码 | 含义 |
|---|---|
| `SUCCESS` | 成功（已转交 MM 执行） |
| `SKILL_NOT_FOUND` | 技能未定义 |
| `INVALID_PAYLOAD` | payload 解析不出技能 id |
| `NOT_UNLOCKED` | 玩家未解锁 |
| `ON_COOLDOWN` | 冷却中（含冷却组、充能耗尽） |
| `INSUFFICIENT_RESOURCE` | 资源不足（如 mana） |
| `CONFLICT` | 命中互斥组 |
| `CAST_MODE_BLOCKED` | 施法模式不允许（如 toggle 状态冲突） |
| `CONDITION_FAILED` | 声明式条件 / `pre_js` 未过 |
| `MYTHIC_FAILED` | MM 执行阶段失败（或事件未被处理） |
| `SCRIPT_BLOCKED` | 监听方取消了事件 |
| `CHANNELING` | 正在吟唱读条，不可重入 |
| `NO_TARGET` | 索敌 `required:true` 但没锁到目标 |
| `SILENCED` | 处于沉默/封锁 |

---

## 5. 编程式释放路径

`QinhSkillsAPI.castDetailed` 内部走的是统一入口：

```
QinhSkillsAPI.castDetailed
  └─ SkillCastPipeline.executeViaGateway(player, payload, trigger="api")
       └─ SkillEventGateway.dispatch(plugin, player, payload, trigger)
            ├─ 构造 QISkillUseEvent 并 callEvent（其他插件可监听/取消）
            ├─ 被取消         → SCRIPT_BLOCKED
            ├─ skillHandled   → castResult（默认 SUCCESS）
            └─ 未处理         → castResult（默认 MYTHIC_FAILED）
```

要点：

- **每次释放都会发一个 `QISkillUseEvent`**。这意味着别的插件可以监听并**取消**你的程序式释放，或读取 `castResult`。详见 [事件](./events.md)。
- `trigger` 字符串会被 `TriggerType.fromLegacy(trigger)` 归一成枚举。API 路径固定传 `"api"`。
- 不要绕过 `QinhSkillsAPI` 去自己合成第二个事件——网关已经替你发了，重复 callEvent 会双重计费/双重门控。

> 想自定义 `trigger` 标签（例如让被动逻辑区分来源），可直接调底层 `SkillCastPipeline.executeViaGateway(player, payload, "你的标签")`，但绝大多数场景用 `QinhSkillsAPI` 即可。

---

## 6. 解析 payload 拿技能 id

物品插件常把整段 JSON payload 透传给你。要从中取出 QS 技能 id：

```kotlin
val skillId: String? = QinhSkillsAPI.resolvePayloadSkillId(rawPayload)
// 解析不出返回 null（不是 QS payload）
if (skillId != null && QinhSkillsAPI.hasSkillDefinition(skillId)) {
    // 确认是已定义的 QS 技能
}
```

`resolvePayloadSkillId` 同时接受纯字符串技能 id 和 JSON 形式，返回值**统一小写**。

---

## 继续阅读

- [事件](./events.md) — `QISkillUseEvent` 字段与监听示例
- [占位符](./placeholders.md) — PlaceholderAPI 暴露的运行时数据
- [脚本 API](./script-api.md) — `pre_js` / `post_js` 注入上下文
- [诊断与协议](./diagnostics-protocol.md) — `/qs protocol`、`/qs bridge`、协议层
- [数据存储](./data-storage.md) — `PlayerSkillProfile` 落盘结构
