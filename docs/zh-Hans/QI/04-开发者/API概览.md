# API 概览与接入

> 所属：[开发者](./api-overview.md)　·　子页：[API 参考](./api-reference.md) · [事件](./events.md) · [动作处理器开发](./handler-development.md)

本章给插件开发者：如何依赖 QI、入口在哪、API 怎么分层。完整方法签名见 [API 参考](./api-reference.md)。

---

## 1. 依赖 QI

QI 运行时已装在服务器，你只需**编译期依赖**（`provided`），别打包进自己的 jar。

### 安装到本地 Maven

```bash
mvn install:install-file -Dfile=QinhItems-1.1.0.jar -DgroupId=com.qinhuai -DartifactId=QinhItems -Dversion=1.1.0 -Dpackaging=jar
```

### pom.xml

```xml
<dependency>
  <groupId>com.qinhuai</groupId>
  <artifactId>QinhItems</artifactId>
  <version>1.1.0</version>
  <scope>provided</scope>
</dependency>
```

### plugin.yml

```yaml
softdepend: [QinhItems]
```

> 若编译报 `com.qinhuai.corelib.*` 缺失，把 **QinhCoreLib** 也 install-file + provided 引用（QI 的 API 个别成员引用了 CoreLib 类型）。

---

## 2. 入口：`QinhItemsAPI`

```
包名：com.qinhuai.items.api
类名：QinhItemsAPI   （Kotlin object 单例）
```

- **Java** 调用带 `.INSTANCE`：`QinhItemsAPI.INSTANCE.isQinhItem(stack)`
- **Kotlin** 直接：`QinhItemsAPI.isQinhItem(stack)`

API 版本常量：`QinhItemsAPI.API_VERSION = 1`。

---

## 3. 分层门面

QI 的 API 分成几个门面（facade），按职责拿：

| 门面 | 取法 | 管什么 |
|---|---|---|
| 基础 | `QinhItemsAPI.xxx` | 识别物品、取定义、灵魂绑定、canUse、取 providers |
| 装配 | `QinhItemsAPI.assembly()` | 造物品、重建、层补丁 |
| 变量 | `QinhItemsAPI.variables()` | 取 / 设 / 锁变量、溯源、刷新 |
| 动作 | `QinhItemsAPI.actions()` | 注册处理器、动作表、派发、payload schema |
| 层 | `QinhItemsAPI.layers()` | 读层状态与值 |
| 桥 | `QinhItemsAPI.bridge()` | 注册 / 查 Provider 桥 |
| 战斗 | `QinhItemsAPI.combat()` | 战斗 / 属性刷新（= `QinhCombatAPI`） |

完整签名见 [API 参考](./api-reference.md)。

---

## 4. 最常用四件事

### 造一个物品

```java
ItemStack item = QinhItemsAPI.INSTANCE.assembly().build("物品ID", 数量);
// ID 不存在返回 null
```

### 判断是不是 QI 物品 / 取 ID

```java
boolean isQi = QinhItemsAPI.INSTANCE.isQinhItem(stack);
String id    = QinhItemsAPI.INSTANCE.getItemId(stack);   // 非 QI 返回 null
```

### 检查灵魂绑定（市场 / 邮件必看）

```java
boolean bound = QinhItemsAPI.INSTANCE.isSoulbound(stack);
java.util.UUID owner = QinhItemsAPI.INSTANCE.getSoulboundOwner(stack);
```

### 注册一个动作处理器

```kotlin
QinhItemsAPI.actions().registerHandler(object : QinhActionHandler {
    override val handlerId = "myplugin:hello"
    override fun dispatch(ctx: QinhActionContext): ActionDispatchResult {
        ctx.player.sendMessage("payload=${ctx.payload}")
        return ActionDispatchResult.HANDLED
    }
})
```

---

## 5. 可用性与空值

- 所有生成 / 读取在「ID 不存在」「不是 QI 物品」时返回 `null`，务必判空。
- QI 未启用时别调用：用 `Bukkit.getPluginManager().getPlugin("QinhItems")` 判活，或靠 `softdepend` 加载顺序。
- 物品识别 / 反查（item → id）**只在 QI 的 API**，CoreLib 没有。

---

## 6. 接入路线选择

| 你想… | 用 | 章节 |
|---|---|---|
| 按 ID 造物品、反查物品归属 | QI `assembly()` / `isQinhItem` | [API 参考](./api-reference.md) |
| 用 `qi:id` / `qinhitems:id` 前缀解析物品 | CoreLib `ItemManagerAPI.getHookItem(ref)` | [集成](./integration.md) |
| 给物品挂外部系统数据 | Provider + Bridge | [Provider 与桥](./providers-bridges.md) |
| 自定义触发后的逻辑 | 动作处理器 | [动作处理器开发](./handler-development.md) |
| 监听物品生命周期 | 事件 | [事件](./events.md) |
| 打孔 / 镶嵌 / 强化（改物品后状态） | 层 API | [层与装配](./layers-assembly.md) |
| 市场 / 邮件 / 抽奖 / 强化等成品代码 | — | [API 配方集](./api-recipes.md) |
| 接 AP / QinhSkills / 宝石后端 | — | [集成实操](./integration-howto.md) |

---

## 下一步

- [API 完整参考](./api-reference.md)
- [事件大全](./events.md)
