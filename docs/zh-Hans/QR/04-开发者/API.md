# QinhRuinsAPI

> 所属：[开发者](./api.md)　·　同组：[事件大全](./events.md) · [词缀脚本](./affix-scripting.md) · [Provider 与桥接](./providers-bridges.md) · [占位符](./placeholders.md) · [数据存储](./data-storage.md)
> 返回：[核心概念](../01-getting-started/core-concepts.md)

本页给插件开发者：如何依赖 QR、入口在哪、对外提供哪些方法。QR 的对外门面是单例 `QinhRuinsAPI`，围绕「锚点（一座世界里真实存在的遗迹实例）」做查询与生成。术语见 [核心概念](../01-getting-started/core-concepts.md)。

---

## 1. 依赖 QR

QR 运行时已装在服务器，你只需 **编译期依赖**（`provided`），别打包进自己的 jar。QR 硬依赖 **QinhCoreLib（QCL）**，部分 API（如钥石物品源）会引用 CoreLib 类型。

### 安装到本地 Maven

```bash
mvn install:install-file -Dfile=QinhRuins-1.1.0.jar -DgroupId=com.qinhuai -DartifactId=QinhRuins -Dversion=1.1.0 -Dpackaging=jar
```

### pom.xml

```xml
<dependency>
  <groupId>com.qinhuai</groupId>
  <artifactId>QinhRuins</artifactId>
  <version>1.1.0</version>
  <scope>provided</scope>
</dependency>
```

> 若编译报 `com.qinhuai.corelib.*` 缺失，把 **QinhCoreLib** 也 install-file + `provided` 引用。

### plugin.yml

```yaml
softdepend: [QinhRuins]
```

用 `softdepend` 保证 QR 先加载；调用前可用 `Bukkit.getPluginManager().getPlugin("QinhRuins")` 判活。

---

## 2. 入口：`QinhRuinsAPI`

```
包名：com.qinhuai.ruins.api
类名：QinhRuinsAPI   （Kotlin object 单例）
```

- **Kotlin** 直接：`QinhRuinsAPI.count()`
- **Java** 带 `.INSTANCE`：`QinhRuinsAPI.INSTANCE.count()`

---

## 3. `RuinInfo` 数据结构

所有查询方法返回的遗迹信息载体（嵌套在 `QinhRuinsAPI` 内）：

```kotlin
data class RuinInfo(
    val anchorId: String,   // 锚点唯一 id
    val templateId: String, // 用的是哪个模板
    val location: Location, // 锚点位置（已 clone，可安全改）
    val cleared: Boolean,   // 是否已通关（CLEARED 或 RECYCLED 状态）
)
```

> `cleared` 在锚点处于 `CLEARED` **或** `RECYCLED` 状态时为 `true`；`DORMANT` / `ACTIVE` 时为 `false`。状态含义见 [核心概念 · 锚点](../01-getting-started/core-concepts.md)。
> `location` 是克隆副本，改它不影响真实锚点。

---

## 4. 方法参考

| 方法 | 签名 | 说明 |
|---|---|---|
| 生成遗迹 | `spawn(templateId: String, location: Location): String?` | 在指定坐标按模板生成一座遗迹，返回新锚点 id；模板不存在或生成失败返回 `null`。坐标会取所在方块的整数坐标。 |
| 锚点总数 | `count(): Int` | 当前世界里所有锚点数量。 |
| 坐标所在遗迹 | `ruinAt(location: Location): RuinInfo?` | 查包含该坐标的遗迹（落在某锚点包围盒内），无则 `null`。 |
| 最近遗迹 | `nearest(location, templateId: String? = null, radius: Double = 12000.0): RuinInfo?` | 找最近的遗迹。给 `templateId` 则只找该模板的最近一座（**忽略 radius**）；不给则在 `radius` 半径内找最近一座。 |
| 列举遗迹 | `list(templateId: String? = null): List<RuinInfo>` | 列出全部锚点；给 `templateId` 则只列该模板的。 |
| 移除遗迹 | `remove(anchorId: String): Boolean` | 回收（消退还原 / 移除）指定锚点，返回是否命中。 |
| 模板 id 列表 | `templateIds(): List<String>` | 所有已加载的遗迹模板 id。 |

::: warning 注意
`nearest` 的两条分支语义不同：**传了 `templateId` 时按"该模板的全局最近一座"查，`radius` 参数被忽略**；只有不传 `templateId` 时 `radius` 才生效。
:::

---

## 5. Kotlin 调用示例

```kotlin
import com.qinhuai.ruins.api.QinhRuinsAPI

// 在玩家脚下生成一座遗迹
val anchorId: String? = QinhRuinsAPI.spawn("ancient_tower", player.location)
if (anchorId == null) {
    player.sendMessage("§c生成失败：模板不存在或选址失败")
}

// 玩家是不是站在某座遗迹里？
val here = QinhRuinsAPI.ruinAt(player.location)
if (here != null && !here.cleared) {
    player.sendMessage("§e你正在探索 ${here.templateId}（未通关）")
}

// 找最近的某类遗迹并报距离
val tower = QinhRuinsAPI.nearest(player.location, "ancient_tower")
tower?.let {
    val dist = it.location.distance(player.location)
    player.sendMessage("§a最近的高塔在 ${dist.toInt()} 格外")
}

// 统计 + 列举
player.sendMessage("§7全服共有 ${QinhRuinsAPI.count()} 座遗迹")
QinhRuinsAPI.list("ancient_tower").forEach { /* ... */ }

// 移除一座
QinhRuinsAPI.remove(anchorId ?: return)
```

## 6. Java 调用示例

```java
import com.qinhuai.ruins.api.QinhRuinsAPI;
import com.qinhuai.ruins.api.QinhRuinsAPI.RuinInfo;

String anchorId = QinhRuinsAPI.INSTANCE.spawn("ancient_tower", player.getLocation());
if (anchorId == null) {
    player.sendMessage("§c生成失败");
    return;
}

RuinInfo info = QinhRuinsAPI.INSTANCE.ruinAt(player.getLocation());
if (info != null) {
    player.sendMessage("锚点 " + info.getAnchorId() + " / 模板 " + info.getTemplateId()
        + " / 已通关 " + info.getCleared());
}

// nearest 带默认参数：Java 需传全参，半径默认 12000
RuinInfo nearest = QinhRuinsAPI.INSTANCE.nearest(player.getLocation(), "ancient_tower", 12000.0);

int total = QinhRuinsAPI.INSTANCE.count();
boolean removed = QinhRuinsAPI.INSTANCE.remove(anchorId);
```

> Kotlin 默认参数对 Java 不可见，`nearest` 在 Java 侧需显式传三个参数（`templateId` 可传 `null`、`radius` 传 `12000.0`）。

---

## 7. 线程与空值

- **必须在主线程调用。** `spawn` / `remove` 会改世界方块、读写锚点表，异步调用会抛线程异常或脏数据。若你在异步语境（如数据库回调），先用 `Bukkit.getScheduler().runTask(...)` 切回主线程。
- 所有查询在「模板不存在」「坐标无遗迹」时返回 `null` / 空列表，**务必判空**。
- `spawn` 返回 `null` 有两种原因：模板 id 不存在、或选址 / 粘贴失败（地形不允许等）。
- `RuinInfo.location` 已 clone，可放心改；要操作真实锚点请用 `anchorId` 走对应方法。

---

## 8. 想做的事 → 用什么

| 你想… | 用 |
|---|---|
| 按模板在指定点造一座遗迹 | `spawn` |
| 判断玩家是否在遗迹内 / 取所在遗迹 | `ruinAt` |
| 罗盘 / 指引找最近遗迹 | `nearest` |
| 后台面板列举全部遗迹 | `list` / `count` |
| 监听遗迹生成 / 通关 / 战利品 | [事件大全](./events.md) |
| 在秘境激活时跑自定义逻辑 | [词缀脚本](./affix-scripting.md) |
| 引用钥石物品（掉落 / 商店 / 任务） | [Provider 与桥接 · 钥石物品源](./providers-bridges.md) |
| HUD / 计分板显示遗迹状态 | [PlaceholderAPI 占位符](./placeholders.md) |

---

## 下一步

- [事件大全](./events.md) — 生成 / 通关 / 战利品 / 拦截生成
- [Provider 与桥接](./providers-bridges.md) — 成长度 / 队伍 / 钥石物品源 / Citizens
