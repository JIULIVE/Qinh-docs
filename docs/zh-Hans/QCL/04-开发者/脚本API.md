> 上一页：[物品API.md](./item-api.md)　·　下一页：[经济API.md](./economy-api.md)
> 相关：[API概览.md](./api-overview.md) · [物品API.md](./item-api.md) · [经济API.md](./economy-api.md) · [../02-服主指南/脚本入门.md](../02-server-guide/scripting-intro.md)

# 📜 脚本 API

QCL 内置基于 **GraalJS** 的脚本引擎，让服主用 JavaScript 写逻辑、让开发者从宿主（Java/Kotlin）调用脚本并双向传值。本页讲 `com.qinhuai.corelib.script` 包：`QinhScriptBridge` 门面、上下文与结果对象、脚本里能调的 `qcl` / `ctx`、引用语法、返回值映射、沙箱、错误码，以及子插件如何注册自己的脚本命名空间。

服主向的脚本写法入门见 [../02-服主指南/脚本入门.md](../02-server-guide/scripting-intro.md)。

---

## 🌉 QinhScriptBridge

脚本桥门面（Kotlin object，Java 用 `INSTANCE`）。

| 方法 | 签名 | 用途 |
| --- | --- | --- |
| `init` | `init(plugin)` | 初始化引擎（通常 QCL 自己调） |
| `reload` | `reload()` | 重载脚本（对应 `/qcl reload`） |
| `shutdown` | `shutdown()` | 关闭引擎 |
| `isAvailable` | `isAvailable(): Boolean` | GraalJS 是否就绪 |
| `loadedScripts` | `loadedScripts()` | 已加载脚本清单 |
| `execute` | `execute(reference, ScriptContext): ScriptExecutionResult` | 用上下文执行脚本 |
| `execute` | `execute(reference, player, plugin, variables, silent)` | 便捷重载 |

```kotlin
val result = QinhScriptBridge.execute(
    "global:checkLevel.js:main",
    player, this, mutableMapOf("min" to 10), false
)
if (result.success) { /* ... */ }
```

```java
var result = QinhScriptBridge.INSTANCE.execute(
    "global:checkLevel.js:main", player, this,
    new HashMap<>(Map.of("min", 10)), false
);
```

---

## 🧱 ScriptContext

执行上下文。脚本里以 `ctx` 暴露，宿主侧用来传入。

```
ScriptContext(plugin, player?, variables: MutableMap, silent)
```

| 字段 | 含义 |
| --- | --- |
| `plugin` | 触发脚本的插件 |
| `player` | 触发玩家（可空） |
| `variables` | 可变变量表（宿主放进去、脚本读写） |
| `silent` | 静默模式（不输出提示） |

```kotlin
val ctx = ScriptContext(
    plugin = this,
    player = player,
    variables = mutableMapOf("damage" to 50, "target" to "boss"),
    silent = false
)
val r = QinhScriptBridge.execute("global:onHit.js", ctx)
```

脚本里读这些变量：

```javascript
function main() {
    var dmg = ctx.get("damage");   // 50
    ctx.set("result", dmg * 2);    // 写回，宿主可从 variables 读
    return true;
}
```

---

## 🧾 ScriptExecutionResult

```
ScriptExecutionResult(success, value, message, skipped, code, suggestion, traceId)
```

| 字段 | 含义 |
| --- | --- |
| `success` | 是否成功 |
| `value` | 脚本返回值（如带值） |
| `message` | 信息文本 |
| `skipped` | 是否被跳过（如脚本不可用） |
| `code` | 错误码（见下表） |
| `suggestion` | 修复建议 |
| `traceId` | 追踪 ID |

辅助方法：

- `asBoolean(default)`：把结果转成布尔（用于条件判断），无明确值时用 `default`。
- `toDiagnostic(source)`：转成诊断对象，便于统一排错输出。

```kotlin
val pass = QinhScriptBridge.execute("global:canEnter.js", ctx).asBoolean(false)
if (pass) openDoor(player)
```

---

## 💉 注入对象：qcl 与 ctx

脚本运行时被注入两个全局对象：

- **`ctx`** —— 当前 `ScriptContext`。
- **`qcl`** —— `QinhScriptApi`，宿主能力门面。

### ctx 方法

| 方法 | 作用 |
| --- | --- |
| `player()` | 当前玩家（可能为 null） |
| `pluginName()` | 触发插件名 |
| `get(key)` | 读变量 |
| `set(key, value)` | 写变量 |
| `vars()` | 取整个变量表 |

### qcl 方法（QinhScriptApi）

| 分类 | 方法 |
| --- | --- |
| 日志 | `logInfo(msg)`、`logWarn(msg)`、`logError(msg)` |
| 状态 | `bridgeStatusNames()` |
| 占位符 | `placeholder(text)` —— 解析 PlaceholderAPI 占位符 |
| 经济 | `economyHas(amount, provider?, currency?)`、`economyWithdraw(...)`、`economyDeposit(...)` |
| 物品 | `itemParse(ref)`、`itemGive(ref, amount)` |
| 调度 | `runSync(任务)`、`runSyncLater(ticks, 任务)`、`runSyncAndWait(任务)` |

```javascript
function main() {
    var player = ctx.player();
    if (player == null) return false;

    // 占位符
    var name = qcl.placeholder("%player_name%");
    qcl.logInfo("玩家：" + name);

    // 经济：余额够就扣 100
    if (qcl.economyHas(100)) {
        qcl.economyWithdraw(100);
        // 物品：发一把剑
        qcl.itemGive("qinhitems:excalibur", 1);
        return { success: true, message: "购买成功" };
    }
    return { success: false, message: "余额不足" };
}
```

> **线程安全**：脚本默认不在主线程时，要操作 Bukkit API 须用 `qcl.runSync(...)`；需要等结果用 `qcl.runSyncAndWait(...)`；延迟执行用 `qcl.runSyncLater(ticks, ...)`。

---

## 🔤 引用语法

```
命名空间:路径.js[:函数名]
```

| 段 | 默认值 | 说明 |
| --- | --- | --- |
| 命名空间 | `global` | 不写默认 `global` |
| 路径.js | （必填） | 相对脚本目录的文件路径 |
| 函数名 | config `javascript.default-function`（即 `main`） | 不写默认 `main` |

示例：

- `checkLevel.js` → 命名空间 `global`，函数 `main`
- `myaddon:combat/onHit.js:apply` → 命名空间 `myaddon`，文件 `combat/onHit.js`，函数 `apply`

---

## 🔁 返回值映射

脚本函数的返回值会被映射成 `ScriptExecutionResult`：

| 脚本返回 | 结果 |
| --- | --- |
| `null` / `undefined` / `true` | 成功 |
| `false` | 失败 |
| 字符串 / 数字 | 成功，带 `value` |
| 对象 `{success, message}` | 按 `success` 字段判定，`message` 作为信息 |

```javascript
return true;                                   // 成功
return false;                                  // 失败
return 42;                                     // 成功，value=42
return "ok";                                   // 成功，value="ok"
return { success: false, message: "条件不满足" }; // 失败 + 信息
```

---

## 🔒 沙箱

GraalJS 在受限沙箱里运行：

- **允许**：`allowHostAccess`——只能调被显式导出的宿主方法（即 `qcl` / `ctx` 上的方法）。
- **禁止**：起线程、文件 IO、任意反射、网络访问。

> 想让脚本做 Bukkit 操作、经济、取物，**只能通过 `qcl` 提供的方法**。脚本无法 `import`/`require` 任意 Java 类，也不能开线程或读写磁盘。这是安全边界，别绕。

---

## 🚦 错误码

| code | 含义 |
| --- | --- |
| `SCRIPT_UNAVAILABLE` | 引擎不可用（GraalJS 未就绪） |
| `SCRIPT_PARSE_FAILED` | 脚本语法解析失败 |
| `SCRIPT_NOT_FOUND` | 找不到脚本文件 |
| `SCRIPT_FUNCTION_MISSING` | 找不到指定函数 |
| `SCRIPT_FAILED` | 脚本执行时抛错 |

```kotlin
val r = QinhScriptBridge.execute("global:foo.js", ctx)
if (!r.success) {
    when (r.code) {
        "SCRIPT_NOT_FOUND" -> logger.warning("脚本不存在：${r.suggestion}")
        "SCRIPT_FUNCTION_MISSING" -> logger.warning("函数缺失")
        else -> logger.warning("[${r.code}] ${r.message} (trace=${r.traceId})")
    }
}
```

---

## 🧩 从宿主调脚本传变量（完整示例）

**JS（`plugins/QinhCoreLib/scripts/global/applyBuff.js`）：**

```javascript
function main() {
    var player = ctx.player();
    var power = ctx.get("power");        // 宿主传入
    qcl.logInfo(player.getName() + " 获得强度 " + power);
    ctx.set("applied", true);            // 写回宿主
    return { success: true, message: "已施加" };
}
```

**Kotlin 宿主：**

```kotlin
val vars = mutableMapOf<String, Any>("power" to 3)
val result = QinhScriptBridge.execute("global:applyBuff.js", player, this, vars, false)

if (result.success) {
    val applied = vars["applied"]   // true，脚本写回的
    logger.info("脚本回报：${result.message}")
}
```

**Java 宿主：**

```java
Map<String, Object> vars = new HashMap<>();
vars.put("power", 3);
var result = QinhScriptBridge.INSTANCE.execute("global:applyBuff.js", player, this, vars, false);
if (result.getSuccess()) {
    Object applied = vars.get("applied");
}
```

---

## 🗂️ 子插件注册自己的脚本命名空间

`QinhScriptBridge` 允许子插件注册自己的脚本目录，映射成独立命名空间，避免与 `global` 或其它插件撞车：

```
plugins/<插件名>/scripts  →  命名空间 <你指定的名字>
```

注册后，引用 `<命名空间>:xxx.js` 就会去你的插件目录找脚本。这样你的插件可以自带脚本资源，服主也能在你的目录里覆盖/扩展。

> 通常在 `onEnable` 里完成注册，`onDisable` 不必特意注销（随插件卸载失效）。具体注册入口以 `QinhScriptBridge` 当前版本提供的方法为准。

---

## 🐞 调试

- `QinhScriptBridge.isAvailable()` 先确认引擎就绪；不就绪时所有 `execute` 会以 `SCRIPT_UNAVAILABLE` / `skipped=true` 返回。
- `loadedScripts()` 看脚本是否真的被加载。
- 改脚本后 `/qcl reload` 热重载。
- 出错时用 `result.code` + `result.traceId` 在日志里定位；`qcl.logInfo/logWarn/logError` 在脚本内打点。
- `result.toDiagnostic(source)` 可把脚本结果并入统一诊断输出。

---

## 📚 继续阅读

- [经济API.md](./economy-api.md) —— 脚本里 `qcl.economyHas/Withdraw/Deposit` 背后的完整经济门面。
- [物品API.md](./item-api.md) —— `qcl.itemParse/itemGive` 背后的物品门面。
- [../02-服主指南/脚本入门.md](../02-server-guide/scripting-intro.md) —— 服主向脚本写法。
