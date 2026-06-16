> Previous: [物品API.md](./item-api.md)　·　Next: [经济API.md](./economy-api.md)
> Related: [API概览.md](./api-overview.md) · [物品API.md](./item-api.md) · [经济API.md](./economy-api.md) · [../02-服主指南/脚本入门.md](../02-server-guide/scripting-intro.md)

# 📜 Script API

QCL ships with a built-in **GraalJS**-based script engine, letting server owners write logic in JavaScript and developers call scripts from the host (Java/Kotlin) and pass values both ways. This page covers the `com.qinhuai.corelib.script` package: the `QinhScriptBridge` facade, the context and result objects, the `qcl` / `ctx` callable from scripts, the reference syntax, return-value mapping, the sandbox, error codes, and how sub-plugins register their own script namespace.

For a server-owner-oriented intro to writing scripts, see [../02-服主指南/脚本入门.md](../02-server-guide/scripting-intro.md).

---

## 🌉 QinhScriptBridge

The script bridge facade (a Kotlin `object`; use `INSTANCE` from Java).

| Method | Signature | Purpose |
| --- | --- | --- |
| `init` | `init(plugin)` | Initialize the engine (usually QCL calls this itself) |
| `reload` | `reload()` | Reload scripts (corresponds to `/qcl reload`) |
| `shutdown` | `shutdown()` | Shut down the engine |
| `isAvailable` | `isAvailable(): Boolean` | Whether GraalJS is ready |
| `loadedScripts` | `loadedScripts()` | List of loaded scripts |
| `execute` | `execute(reference, ScriptContext): ScriptExecutionResult` | Execute a script with a context |
| `execute` | `execute(reference, player, plugin, variables, silent)` | Convenience overload |

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

The execution context. Exposed as `ctx` inside scripts, and used by the host to pass values in.

```
ScriptContext(plugin, player?, variables: MutableMap, silent)
```

| Field | Meaning |
| --- | --- |
| `plugin` | The plugin that triggered the script |
| `player` | The triggering player (nullable) |
| `variables` | A mutable variable map (the host puts values in, the script reads/writes them) |
| `silent` | Silent mode (no prompts output) |

```kotlin
val ctx = ScriptContext(
    plugin = this,
    player = player,
    variables = mutableMapOf("damage" to 50, "target" to "boss"),
    silent = false
)
val r = QinhScriptBridge.execute("global:onHit.js", ctx)
```

Read these variables inside the script:

```javascript
function main() {
    var dmg = ctx.get("damage");   // 50
    ctx.set("result", dmg * 2);    // write back; the host can read it from variables
    return true;
}
```

---

## 🧾 ScriptExecutionResult

```
ScriptExecutionResult(success, value, message, skipped, code, suggestion, traceId)
```

| Field | Meaning |
| --- | --- |
| `success` | Whether it succeeded |
| `value` | The script return value (if it carries one) |
| `message` | Informational text |
| `skipped` | Whether it was skipped (e.g. the script is unavailable) |
| `code` | Error code (see table below) |
| `suggestion` | A fix suggestion |
| `traceId` | Trace ID |

Helper methods:

- `asBoolean(default)`: convert the result to a boolean (for conditional checks); falls back to `default` when there is no explicit value.
- `toDiagnostic(source)`: convert it to a diagnostic object for unified troubleshooting output.

```kotlin
val pass = QinhScriptBridge.execute("global:canEnter.js", ctx).asBoolean(false)
if (pass) openDoor(player)
```

---

## 💉 Injected objects: qcl and ctx

Two global objects are injected at script runtime:

- **`ctx`** — the current `ScriptContext`.
- **`qcl`** — `QinhScriptApi`, the host-capability facade.

### ctx methods

| Method | Effect |
| --- | --- |
| `player()` | The current player (may be null) |
| `pluginName()` | The triggering plugin name |
| `get(key)` | Read a variable |
| `set(key, value)` | Write a variable |
| `vars()` | Get the entire variable map |

### qcl methods (QinhScriptApi)

| Category | Methods |
| --- | --- |
| Logging | `logInfo(msg)`, `logWarn(msg)`, `logError(msg)` |
| Status | `bridgeStatusNames()` |
| Placeholder | `placeholder(text)` — resolve a PlaceholderAPI placeholder |
| Economy | `economyHas(amount, provider?, currency?)`, `economyWithdraw(...)`, `economyDeposit(...)` |
| Item | `itemParse(ref)`, `itemGive(ref, amount)` |
| Scheduling | `runSync(task)`, `runSyncLater(ticks, task)`, `runSyncAndWait(task)` |

```javascript
function main() {
    var player = ctx.player();
    if (player == null) return false;

    // placeholder
    var name = qcl.placeholder("%player_name%");
    qcl.logInfo("Player: " + name);

    // economy: if the balance is enough, withdraw 100
    if (qcl.economyHas(100)) {
        qcl.economyWithdraw(100);
        // item: give a sword
        qcl.itemGive("qinhitems:excalibur", 1);
        return { success: true, message: "Purchase succeeded" };
    }
    return { success: false, message: "Insufficient balance" };
}
```

> **Thread safety**: since scripts are by default not on the main thread, operating on the Bukkit API requires `qcl.runSync(...)`; to wait for a result use `qcl.runSyncAndWait(...)`; for delayed execution use `qcl.runSyncLater(ticks, ...)`.

---

## 🔤 Reference syntax

```
namespace:path.js[:functionName]
```

| Segment | Default | Description |
| --- | --- | --- |
| namespace | `global` | Defaults to `global` if omitted |
| path.js | (required) | File path relative to the scripts directory |
| functionName | config `javascript.default-function` (i.e. `main`) | Defaults to `main` if omitted |

Examples:

- `checkLevel.js` → namespace `global`, function `main`
- `myaddon:combat/onHit.js:apply` → namespace `myaddon`, file `combat/onHit.js`, function `apply`

---

## 🔁 Return-value mapping

A script function's return value is mapped to a `ScriptExecutionResult`:

| Script returns | Result |
| --- | --- |
| `null` / `undefined` / `true` | Success |
| `false` | Failure |
| String / number | Success, with `value` |
| Object `{success, message}` | Judged by the `success` field, with `message` as the info text |

```javascript
return true;                                   // success
return false;                                  // failure
return 42;                                     // success, value=42
return "ok";                                   // success, value="ok"
return { success: false, message: "Condition not met" }; // failure + info
```

---

## 🔒 Sandbox

GraalJS runs in a restricted sandbox:

- **Allowed**: `allowHostAccess` — only explicitly exported host methods can be called (i.e. the methods on `qcl` / `ctx`).
- **Forbidden**: starting threads, file IO, arbitrary reflection, network access.

> To have a script perform Bukkit operations, economy, or item retrieval, **the only way is through the methods provided by `qcl`**. A script cannot `import`/`require` arbitrary Java classes, nor start threads or read/write disk. This is a security boundary — don't bypass it.

---

## 🚦 Error codes

| code | Meaning |
| --- | --- |
| `SCRIPT_UNAVAILABLE` | Engine unavailable (GraalJS not ready) |
| `SCRIPT_PARSE_FAILED` | Script syntax parsing failed |
| `SCRIPT_NOT_FOUND` | Script file not found |
| `SCRIPT_FUNCTION_MISSING` | Specified function not found |
| `SCRIPT_FAILED` | The script threw during execution |

```kotlin
val r = QinhScriptBridge.execute("global:foo.js", ctx)
if (!r.success) {
    when (r.code) {
        "SCRIPT_NOT_FOUND" -> logger.warning("Script does not exist: ${r.suggestion}")
        "SCRIPT_FUNCTION_MISSING" -> logger.warning("Function missing")
        else -> logger.warning("[${r.code}] ${r.message} (trace=${r.traceId})")
    }
}
```

---

## 🧩 Calling a script from the host and passing variables (full example)

**JS (`plugins/QinhCoreLib/scripts/global/applyBuff.js`):**

```javascript
function main() {
    var player = ctx.player();
    var power = ctx.get("power");        // passed in by the host
    qcl.logInfo(player.getName() + " gained power " + power);
    ctx.set("applied", true);            // write back to the host
    return { success: true, message: "Applied" };
}
```

**Kotlin host:**

```kotlin
val vars = mutableMapOf<String, Any>("power" to 3)
val result = QinhScriptBridge.execute("global:applyBuff.js", player, this, vars, false)

if (result.success) {
    val applied = vars["applied"]   // true, written back by the script
    logger.info("Script reported: ${result.message}")
}
```

**Java host:**

```java
Map<String, Object> vars = new HashMap<>();
vars.put("power", 3);
var result = QinhScriptBridge.INSTANCE.execute("global:applyBuff.js", player, this, vars, false);
if (result.getSuccess()) {
    Object applied = vars.get("applied");
}
```

---

## 🗂️ Sub-plugins registering their own script namespace

`QinhScriptBridge` lets a sub-plugin register its own scripts directory, mapped to an independent namespace, to avoid clashing with `global` or other plugins:

```
plugins/<pluginName>/scripts  →  namespace <the name you specify>
```

Once registered, referencing `<namespace>:xxx.js` looks for the script in your plugin's directory. This way your plugin can ship its own script resources, and server owners can override/extend them inside your directory.

> Registration is usually done in `onEnable`; there's no need to explicitly unregister in `onDisable` (it goes invalid when the plugin unloads). For the exact registration entry point, refer to the methods provided by the current version of `QinhScriptBridge`.

---

## 🐞 Debugging

- Use `QinhScriptBridge.isAvailable()` first to confirm the engine is ready; when it isn't, every `execute` returns with `SCRIPT_UNAVAILABLE` / `skipped=true`.
- Use `loadedScripts()` to check whether a script was actually loaded.
- After editing a script, `/qcl reload` hot-reloads it.
- On errors, use `result.code` + `result.traceId` to locate them in the logs; `qcl.logInfo/logWarn/logError` add trace points inside scripts.
- `result.toDiagnostic(source)` can fold the script result into unified diagnostic output.

---

## 📚 Further reading

- [经济API.md](./economy-api.md) — the full economy facade behind `qcl.economyHas/Withdraw/Deposit` in scripts.
- [物品API.md](./item-api.md) — the item facade behind `qcl.itemParse/itemGive`.
- [../02-服主指南/脚本入门.md](../02-server-guide/scripting-intro.md) — server-owner-oriented script writing.
