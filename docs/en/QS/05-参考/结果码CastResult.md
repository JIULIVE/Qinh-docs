# CastResult Result Codes

> Previous: [Message Copy Quick Reference](./messages.md)　·　Next: [Built-in Skills and Examples](./bundled-skills-examples.md)

`CastResult` is the **final verdict** of every skill cast. It surfaces in three places:

1. The echo of `/qs cast <skill>` — `§6[QS] §7cast {id} §7→ §e{result}`;
2. The `castResult` field of the `QISkillUseEvent` / corresponding event object (read by developers);
3. Indirectly, through the `%qinhskills_..%` placeholders and the gate hints a player receives.

The enum has **14 values**. The table below covers the meaning, what the player sees, and how to handle it.

---

## 📋 All result codes

| Result code | Meaning | Player text | What to do |
|---|---|---|---|
| `SUCCESS` | Skill cast successfully | (skill effect / placeholder message) | Normal ✅ |
| `SKILL_NOT_FOUND` | Skill id does not exist | `§cUnknown skill` | Check id spelling, whether `/qs reload` loaded it |
| `INVALID_PAYLOAD` | Trigger payload invalid / missing field | — (usually an internal / command-bridge construction error) | Check command-bridge arguments, whether the handler passes the payload correctly |
| `NOT_UNLOCKED` | Skill not unlocked | `§cSkill not unlocked` | `/qs unlock` or configure `starter_skills` / `default_all` |
| `ON_COOLDOWN` | On cooldown (incl. cooldown group / charges not full) | `§cSkill on cooldown §7{t} remaining` / `§cCharges {a}/{m}` | Wait out the cooldown; lower `cooldown.base` or add `charges` |
| `INSUFFICIENT_RESOURCE` | Insufficient resource (placeholder resources like `resource.mana`) | `§cInsufficient resource` | Wait for resource regen; the resource pool will ultimately belong to QC — currently a temporary placeholder |
| `CONFLICT` | Hit a conflict group, same-group skills briefly mutually exclusive | `§cSkill conflict` | Wait out the conflict window; check the `conflict_groups` config |
| `CAST_MODE_BLOCKED` | Cannot cast under the current cast mode | `§cThe current cast mode is unavailable` | Check `cast_mode` (toggle state / channel in progress) |
| `CONDITION_FAILED` | Declarative `conditions` not fully met | `§cCast conditions not met` | Check the skill's `conditions:` (level / health / target, etc.) |
| `MYTHIC_FAILED` | Failed when handed to MM for execution | `§cSkill cast failed` | MM same-named skill misconfigured / missing; `/mm reload`, check MM logs |
| `SCRIPT_BLOCKED` | `pre_js` script returned false and blocked | — (script-defined hint) | Check the `script.pre_js` logic |
| `CHANNELING` | Currently channeling a cast bar, cannot start again | — (channel progress bar in progress) | Wait for the bar to finish / be interrupted, then cast |
| `NO_TARGET` | Targeting `required: true` but no target locked | `§cNo usable target` | Aim at a target; loosen `range` / `filter` or set `required: false` |
| `SILENCED` | Silenced by `/qs silence` or the API | `§cSkill silenced, cannot cast` | Wait for the silence to end or release with `/qs silence 0 player` |

> ⚠️ The 14 values in the table match the source `CastResult.kt` strictly, including order. The source is authoritative for the text — if a hint you see doesn't match here, first confirm the plugin version is **1.0.22**.

---

## 🔍 Grouped by "who stopped it"

| Stage | Related result codes |
|---|---|
| **Parse / input** | `SKILL_NOT_FOUND` `INVALID_PAYLOAD` |
| **Gate** | `NOT_UNLOCKED` `ON_COOLDOWN` `INSUFFICIENT_RESOURCE` `CONFLICT` `CAST_MODE_BLOCKED` `CONDITION_FAILED` `NO_TARGET` `SILENCED` |
| **Script exit** | `SCRIPT_BLOCKED` |
| **Channel state** | `CHANNELING` |
| **Execution (MM)** | `MYTHIC_FAILED` |
| **Success** | `SUCCESS` |

> Gates are validated one by one in a fixed order, returning the code of the first one that fails — so a single cast yields exactly **one** result code.

---

## 🧪 Self-testing with /qs cast

`/qs cast` is the most direct result-code probe: it skips items / keys, runs the full pipeline, and prints the result code back to chat.

```bash
/qs cast fire_wave
# §6[QS] §7cast fire_wave §7→ §e SUCCESS         skill side all clear
# §6[QS] §7cast fire_wave §7→ §e NOT_UNLOCKED    not unlocked → /qs unlock
# §6[QS] §7cast fire_wave §7→ §e MYTHIC_FAILED   QS clear, error on the MM side
```

> To see a finer per-stage trace (whether it's stuck at parse / route / gate / execution), enable `debug: true` on the skill. See [Diagnostics and Troubleshooting](./troubleshooting.md).

---

## Read next

- [Diagnostics and Troubleshooting](./troubleshooting.md) — The decision tree to follow once you have a result code
- [Message Copy Quick Reference](./messages.md) — The player text matching each result code
- [Commands and Permissions](./commands-permissions.md) — `/qs cast` usage
