# 📜 Script API (pre_js / post_js)

> Previous: [Placeholders](./placeholders.md)　·　Next: [Diagnostics & Protocol](./diagnostics-protocol.md)

For simple gating, declarative `conditions:` are enough; only **complex logic** needs to drop down to JS. QS provides two script hooks in a skill definition: `pre_js` (pre-cast, can intercept) and `post_js` (side effects after a successful cast). The engine reuses **QinhCoreLib's GraalJS**. This chapter covers the reference format, the injected context, fallback behavior, and gives a complete example. This document targets QS **1.0.22**.

---

## 1. Attaching scripts in a skill definition

```yaml
script:
  pre_js: "qinhskills:demo.js:canCast"    # returns false → intercepts the cast
  post_js: "qinhskills:demo.js:onCast"    # runs after a successful cast (fire-and-forget)
```

### Reference format

```
qinhskills:path.js[:functionName]
```

| Segment | Notes |
|---|---|
| `qinhskills:` | Namespace prefix (QS registers it to the QCL script loader via `registerPluginScripts(plugin, "qinhskills")`) |
| `path.js` | File path relative to the QS script directory |
| `:functionName` | Optional; specifies a function in the file to call. Omit it to run the whole script per QCL's default convention |

Script files are managed uniformly by the **QCL script loader**; QS only registers the namespace.

---

## 2. Semantics of the two hooks

| Hook | When | Return value | Consequence of failure/interception |
|---|---|---|---|
| `pre_js` | Gating stage (before spending resources / entering CD) | `boolean` | Returning `false` → `CONDITION_FAILED`, **no cost, no cooldown** |
| `post_js` | After a successful cast | Ignored (fire-and-forget) | A thrown exception only logs; it doesn't affect the already-successful cast |

> `pre_js` is the **real interception gate**: it decides **before** resources are spent and the cooldown is entered. Returning `false` means this cast never happened (no side effects).

---

## 3. Injected context `ctx`

There's a global `ctx` in the script:

| Call | Returns | Notes |
|---|---|---|
| `ctx.player()` | `Player` | The caster (Bukkit Player) |
| `ctx.get(key)` | value | Reads a context key |
| `ctx.set(key, value)` | — | Writes a context key |
| `ctx.vars()` | Map | All context key-value pairs |

### Readable keys

The source assembles `scriptVars` with `buildMap` (`SkillCastService.executeResolved`); the keys actually injected are:

| Key | Meaning | When present |
|---|---|---|
| `skill` | Skill id (**it's `skill`, not `skillId`**) | Always |
| `level` | The player's level for this skill | Always |
| `mode` | Trigger mode (`default` if none) | Always |
| `source` | Trigger source (`PLAYER` / `EVENT_LISTENER` / `COMMAND` …) | Always |
| `player` | Player name | Always |
| `toggle_state` | `on` / `off` | Only for `toggle` skills |
| `has_target` | `true` | Only when a target is locked |
| `target_type` | Target entity type name | Only when a target is locked |
| `target_uuid` | Target UUID string | Only when a target is locked |
| `var_<name>` | **Skill variables**, e.g. `var_element`, `var_power` | One per `variables:` / `levels.params:` key |

::: warning Caution
⚠️ **Keys that don't exist**: `skillId`, `castMode`, `targetCount`, `slot`, `param_<name>` are all **absent**. Skill variables and level params **uniformly** use the `var_` prefix (not `param_`): YAML's `variables.element` and `levels.N.params.power` → `ctx.get("var_element")`, `ctx.get("var_power")` in the script.

📌 This `ctx` key set applies only to **scripts**. The variables a skill passes through to **MythicMobs** are a different set (`<skill.var.playerName>`, params without the `var_` prefix, and MM can't get `level`); see [Costs, Conditions & Variables](../03-server-guide/cost-conditions-variables.md) and [Integrating MythicMobs](../02-integration/mythicmobs-integration.md).
:::

---

## 4. Injected global `qcl`

From QCL, a unified cross-plugin utility facade:

| Call | Effect |
|---|---|
| `qcl.logInfo(msg)` | Logs info |
| `qcl.itemGive(player, item)` | Gives the player an item |
| `qcl.economy*(...)` | Economy-related (deposit/withdraw/query, etc., depending on the QCL version) |
| `qcl.runSync(runnable)` | Switches the logic back to the main thread (always use it for world/entity operations) |

::: warning Caution
⚠️ Scripts may be invoked in an async context. **Wrap any operation that touches the world/entities in `qcl.runSync { ... }`**, otherwise it may throw a threading exception.
:::

---

## 5. Complete example

`plugins/QinhSkills/scripts/demo.js` (path is illustrative; the QCL script directory is authoritative):

```javascript
// pre_js: returning false intercepts the cast
function canCast(ctx) {
    var player = ctx.player();
    var element = ctx.get("var_element");      // skill variable variables.element
    // Only allow fire-element skills, and not while in lava
    if (element === "fire" && player.getLocation().getBlock().getType().name().indexOf("LAVA") >= 0) {
        player.sendMessage("§cCan't cast fire skills in lava");
        return false;                          // → CONDITION_FAILED, no cost, no CD
    }
    return true;
}

// post_js: runs after a successful cast, fire-and-forget
function onCast(ctx) {
    var player = ctx.player();
    var power = ctx.get("var_power");          // level param levels.N.params.power (uniform var_ prefix)
    qcl.logInfo(player.getName() + " cast " + ctx.get("skill") + " power=" + power);
    // Always switch to the main thread to touch the world/entities
    qcl.runSync(function() {
        player.setFireTicks(20);
    });
}
```

---

## 6. Fallback (when the engine is unavailable)

QS bridges QCL's `QinhScriptBridge` via **reflection** and **safely falls back** on various failures, never wrongly locking a skill just because JS is unavailable:

| Situation | `pre_js` behavior | `post_js` behavior |
|---|---|---|
| GraalJS runtime not ready | **Returns true (no intercept)** | No-op |
| Reflection can't get `QinhScriptBridge.INSTANCE` | Returns true | No-op + warning log |
| The deployed CoreLib has no `execute` method | Returns true | No-op + warning log |

> GraalJS requires the Paper / Purpur runtime to pull in the GraalJS libraries with `javascript.enabled=true`. A typical "runtime not ready" log:
> `[QS-JS] GraalJS runtime not ready: org.graalvm.polyglot.Context not loaded (CoreLib libraries didn't pull GraalJS) or javascript.enabled=false`

**Design principle**: when `pre_js` falls back, it **lets the cast through** (returns true) — better to not intercept than to wrongly kill; when `post_js` falls back, it silently no-ops. Both come with diagnostic logs to help you locate the issue.

---

## 7. When to use JS, when to use conditions

| Need | Use |
|---|---|
| Fixed checks like level / health / world / permission / target type, distance, etc. | `conditions:` (declarative, no engine dependency) |
| Cross-plugin queries, complex branching, giving items, mutating entity state | `pre_js` / `post_js` |

Prefer `conditions` for simple gates — zero engine dependency, never falls back.

---

## Further reading

- [Events](./events.md) — event cancellation is another interception gate beyond scripts
- [API](./api.md) — the `CONDITION_FAILED` / `SCRIPT_BLOCKED` result codes
- [Diagnostics & Protocol](./diagnostics-protocol.md) — see post_js at the `[POST]` stage of the debug trace
