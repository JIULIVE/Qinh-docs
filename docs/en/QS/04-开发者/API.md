# 🧩 QinhSkillsAPI

> Previous: [graph & Combos](../03-server-guide/graph-combos.md)　·　Next: [Events](./events.md)

This chapter is for **plugin developers**: how to depend on QS, where the entry point lives, which methods `QinhSkillsAPI` exposes, and how to cast skills programmatically. This document targets QS **1.0.22**.

> QS has only **one runtime pipeline**. Every cast (item keypress / command / API / passive) flows into the same `SkillCastPipeline` → `SkillEventGateway`. There is no "legacy / new" split in this chapter.

---

## 1. Depending on QS

QS works just like QI: the QS runtime is already installed on the server, so you only need a **compile-time dependency** (`provided`) — don't bundle it into your own jar.

```yaml
# plugin.yml
softdepend: [QinhSkills]
```

::: warning Caution
⚠️ Some `QinhSkillsAPI` signatures reference types from `QinhCoreLib` (e.g. the `QISkillUseEvent` event, `TriggerType`). If compilation reports missing `com.qinhuai.corelib.*`, also install-file **QinhCoreLib** and reference it as `provided`.
:::

### Availability check (soft fail)

**Don't call the API** when QS is absent. Rely on `softdepend` for load order, and check liveness before use:

```kotlin
val qsReady = Bukkit.getPluginManager().getPlugin("QinhSkills")?.isEnabled == true
if (qsReady) {
    QinhSkillsAPI.cast(player, "fire_wave")
}
```

QS itself hard-depends on **QinhCoreLib**: if CoreLib isn't enabled, QS doesn't enable, so "QS enabled" implies CoreLib is present too.

---

## 2. Entry point: `QinhSkillsAPI`

```
Package: com.qinhuai.skills.api
Class:   QinhSkillsAPI   (Kotlin object singleton)
```

- **Kotlin** direct: `QinhSkillsAPI.cast(player, "fire_wave")`
- **Java** with `.INSTANCE`: `QinhSkillsAPI.INSTANCE.cast(player, "fire_wave")`

Every method accepts either a **skill id** or a **QI payload** (JSON / plain string). Internally it first normalizes the input to a lowercase skill id via `resolvePayloadSkillId`, so you don't have to care which form you pass in.

---

## 3. Method overview

| Method | Returns | Effect |
|---|---|---|
| `resolvePayloadSkillId(payload)` | `String?` | Resolves the skill id from a payload (JSON / plain string); returns `null` if it can't be parsed |
| `hasSkillDefinition(skillIdOrPayload)` | `Boolean` | Whether the skill is defined on the server |
| `isUnlocked(player, skillIdOrPayload)` | `Boolean` | Whether the player has unlocked the skill |
| `unlock(player, skillId)` | — | Unlocks and **saves the profile immediately** |
| `lock(player, skillId)` | — | Locks and **saves the profile immediately** |
| `cast(player, payload)` | `Boolean` | Casts the skill; `== (castDetailed==SUCCESS)` |
| `castDetailed(player, payload)` | `CastResult` | Casts and returns a **detailed result code** |
| `castSkill(player, skillId)` | `CastResult` | Same as `castDetailed`, semantically takes a skill id as input |
| `setLevel(player, skillId, level)` | — | Sets the skill level (floor 1), saves automatically |
| `setSlot(player, slot, skillId?)` | — | Sets/clears a skill slot (`skillId=null` clears it), saves automatically |
| `silence(player, durationMs)` | — | Silence/lockout: no skills can be cast for N milliseconds |
| `isSilenced(player)` | `Boolean` | Whether currently silenced/locked out (state machine LOCKED) |
| `unsilence(player)` | — | Lifts silence immediately |

::: info Note
📌 `unlock` / `lock` / `setLevel` / `setSlot` all **write to disk** (`PlayerProfileStore.save`). Watch the frequency when batch-calling across many players; see [Data Storage](./data-storage.md).
:::

---

## 4. Casting skills

### Simplest: success or not

```kotlin
val ok: Boolean = QinhSkillsAPI.cast(player, "fire_wave")
if (!ok) player.sendMessage("§cCan't cast that")
```

### Getting the reason code

```kotlin
when (val r = QinhSkillsAPI.castDetailed(player, "fire_wave")) {
    CastResult.SUCCESS -> {}
    CastResult.ON_COOLDOWN -> player.sendMessage("§7On cooldown")
    CastResult.NOT_UNLOCKED -> player.sendMessage("§7Not unlocked yet")
    CastResult.INSUFFICIENT_RESOURCE -> player.sendMessage("§9Not enough mana")
    CastResult.SILENCED -> player.sendMessage("§cSkills are locked")
    else -> player.sendMessage("§cCast failed: $r")
}
```

### All `CastResult` values

| Result code | Meaning |
|---|---|
| `SUCCESS` | Success (handed off to MM for execution) |
| `SKILL_NOT_FOUND` | Skill not defined |
| `INVALID_PAYLOAD` | Could not parse a skill id from the payload |
| `NOT_UNLOCKED` | Player has not unlocked it |
| `ON_COOLDOWN` | On cooldown (including cooldown groups, charges exhausted) |
| `INSUFFICIENT_RESOURCE` | Insufficient resource (e.g. mana) |
| `CONFLICT` | Hit a mutex group |
| `CAST_MODE_BLOCKED` | Cast mode not allowed (e.g. toggle state conflict) |
| `CONDITION_FAILED` | Declarative condition / `pre_js` didn't pass |
| `MYTHIC_FAILED` | MM execution stage failed (or the event went unhandled) |
| `SCRIPT_BLOCKED` | A listener cancelled the event |
| `CHANNELING` | A channel cast bar is in progress; cannot re-enter |
| `NO_TARGET` | Targeting was `required:true` but no target was locked |
| `SILENCED` | Silenced/locked out |

---

## 5. The programmatic cast path

`QinhSkillsAPI.castDetailed` internally goes through the unified entry point:

```
QinhSkillsAPI.castDetailed
  └─ SkillCastPipeline.executeViaGateway(player, payload, trigger="api")
       └─ SkillEventGateway.dispatch(plugin, player, payload, trigger)
            ├─ Builds QISkillUseEvent and callEvent (other plugins can listen/cancel)
            ├─ Cancelled        → SCRIPT_BLOCKED
            ├─ skillHandled     → castResult (default SUCCESS)
            └─ Unhandled        → castResult (default MYTHIC_FAILED)
```

Key points:

- **Every cast fires a `QISkillUseEvent`.** This means other plugins can listen and **cancel** your programmatic cast, or read `castResult`. See [Events](./events.md).
- The `trigger` string is normalized into an enum by `TriggerType.fromLegacy(trigger)`. The API path always passes `"api"`.
- Don't bypass `QinhSkillsAPI` to synthesize a second event yourself — the gateway has already fired one for you, and a duplicate callEvent would double-charge / double-gate.

> If you want a custom `trigger` tag (e.g. to let passive logic distinguish the source), you can call the lower-level `SkillCastPipeline.executeViaGateway(player, payload, "your tag")` directly, but for the vast majority of cases `QinhSkillsAPI` is enough.

---

## 6. Resolving a skill id from a payload

Item plugins often pass an entire JSON payload through to you. To extract the QS skill id from it:

```kotlin
val skillId: String? = QinhSkillsAPI.resolvePayloadSkillId(rawPayload)
// Returns null if it can't be parsed (not a QS payload)
if (skillId != null && QinhSkillsAPI.hasSkillDefinition(skillId)) {
    // Confirmed to be a defined QS skill
}
```

`resolvePayloadSkillId` accepts both a plain string skill id and a JSON form, and the return value is **always lowercase**.

---

## Further reading

- [Events](./events.md) — `QISkillUseEvent` fields and listener examples
- [Placeholders](./placeholders.md) — runtime data exposed via PlaceholderAPI
- [Script API](./script-api.md) — `pre_js` / `post_js` injected context
- [Diagnostics & Protocol](./diagnostics-protocol.md) — `/qs protocol`, `/qs bridge`, the protocol layer
- [Data Storage](./data-storage.md) — the `PlayerSkillProfile` on-disk structure
