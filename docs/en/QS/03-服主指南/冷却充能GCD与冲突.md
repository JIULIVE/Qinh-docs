# Cooldowns, Charges, GCD & Conflicts

> Previous: [Targeting & Target Selection](./targeting.md)　·　Next: [Costs, Conditions & Variables](./cost-conditions-variables.md)

---

There are many reasons a skill "won't fire." This page makes clear the **5 time-based gates**—they look alike, but each handles its own thing:

| # | Mechanism | In one sentence |
|---|---|---|
| 1 | **Base cooldown** | How long after casting a single skill before you can cast it again |
| 2 | **Cooldown group** | A group of skills sharing one cooldown |
| 3 | **Charges** | The skill stores several charges; each cast spends one |
| 4 | **GCD (Global Cooldown)** | After casting any skill, all skills are briefly locked out |
| 5 | **Conflict group** | A short "just-cast" lock; same-group skills are mutually exclusive for a brief moment |

> 🖼️ **[Image placeholder]** A flowchart of the "full cast pipeline: silence→id resolution→target ‖ unlock→cooldown→cooldown group→GCD→resource→health→conflict→condition ‖ pre_js→validation→execution"　·　suggested `assets/gate-pipeline.png`

---

## 1. Base Cooldown (cooldown.base)

The simplest "binary cooldown": after casting it goes on CD, and you can't cast it while on CD.

```yaml
cooldown:
  base: 2500                     # cooldown 2500 ms = 2.5 seconds (can also be written as top-level cooldown_ms)
```

---

## 2. Cooldown Group (cooldown.group)

Multiple skills **share one cooldown**: casting any skill in the group puts the whole group on CD. Under the hood it's tracked with the `cdgroup:<group name>` key.

```yaml
cooldown:
  base: 3000
  group: fire                    # skills with the same group:fire share a cooldown (can also be written as top-level cooldown_group)
```

> Check logic: when casting, take the **maximum of the two remaining values**—"the skill's own cooldown" and "the cooldown of the group it belongs to". Whichever isn't ready yet is the one that governs.

Good for designs where "a set of skills can't be chained," e.g. three fire skills sharing `group: fire`.

---

## 3. Charges (cooldown.charges)

Charges **replace the binary cooldown**: the skill stores several charges, each cast spends 1, and they recover one at a time per `base`. Enabled when `charges > 1`.

```yaml
cooldown:
  base: 4000                     # each charge recovers in 4 seconds
  charges: 3                     # stores 3 charges; each cast spends 1, recovers 1 after 4 seconds (can also be written as top-level charges)
```

Key points:

- Charges are an **in-memory design**: `ChargeTracker` records charge counts in an in-memory `Map` and **does not persist to disk**, so when a player logs back in (relog) the charges **reset** to full.
- **This is a design trade-off, not a bug**: by contrast, **cooldowns are persisted to disk** (to stop players from clearing cooldowns by relogging); charges are deliberately kept in memory only, and resetting to full on relog is an acceptable cost (charges are inherently "burst you can stockpile a few times," and unlike a hard cooldown they don't need to strictly guard against relog abuse).
- Placeholders: `%qinhskills_<skill>_charges%` (current charges), `%qinhskills_<skill>_max_charges%` (cap).
- ⚠️ Charge-based skills **do not support** `ready_notify` (ready notification)—that's exclusive to binary cooldowns.

---

## 4. GCD — Global Cooldown (gcd.triggers_ms)

GCD = after casting this skill, **all skills on the whole character** are briefly locked out for a short period (to prevent casting multiple skills in a single frame). Under the hood it uses the `gcd:global` key.

```yaml
gcd:
  triggers_ms: 800               # after casting this skill, all skills are locked out for 0.8 seconds (0 = no GCD triggered, can also be written as top-level gcd_ms)
  ignore: false                  # true = this skill is "exempt" from GCD (can also be written as top-level ignore_gcd)
```

The purpose of `gcd.ignore: true`: let certain skills **ignore the GCD left by others** and cast directly—instant blinks and interrupts are often set this way, guaranteeing that pressing the key at a critical moment always works.

---

## 5. Conflict Groups (conflict_groups)

A conflict group is a **short "just-cast" lock**, different from a cooldown: after casting, **other** skills in the same group can't be cast for a short window, and the lock **clears automatically** when it expires. The window length is controlled by config.yml:

```yaml
# config.yml
gate:
  conflict_window_ms: 1000       # conflict exclusion window, default 1000 ms
```

```yaml
# in the skill
conflict_groups:
  - melee_burst                  # within 1 second after casting, other skills in the same group can't be cast
```

> **The difference between cooldown and conflict group**: a cooldown locks "this skill itself" for a long time; a conflict group locks "other skills in the same group" for just a brief moment. Conflict groups solve "don't let another skill squeeze in the instant you just cast."

---

## 6. Comparison Table of All Five

| Mechanism | Scope | Typical use | Config key | What the player feels |
|---|---|---|---|---|
| Base cooldown | A single skill | Control the frequency of one skill | `cooldown.base` / `cooldown_ms` | "This skill is still on CD" |
| Cooldown group | A group of skills | A set of skills can't be chained | `cooldown.group` / `cooldown_group` | "I cast A, and B C went on CD too" |
| Charges | A single skill | Stockpilable burst/blink | `cooldown.charges` / `charges` | "2 charges left, I can cast twice more" |
| GCD (Global Cooldown) | All skills on the whole character | Prevent same-frame casting | `gcd.triggers_ms` / `gcd_ms` | "Just cast, all skills stutter briefly" |
| Conflict group | Other skills in the same group | Exclusion window | `conflict_groups` | "Right at the moment of casting, other same-group skills can't fire" |

---

## 7. The Full Cast Pipeline (any failed gate blocks it)

Casting a skill must pass through three sections of checks: **the three gates before the gate check** (in `SkillCastService`) → **the eight gates inside the `gate.check` gate** (fixed order) → **the three gates after the gate check** (script / validation / execution). Failing any single gate blocks the cast, gives the player a notice, and returns the corresponding `CastResult`.

```
【Before the gate · SkillCastService】
  silence lock → skill id resolution → target.required no target
        │            │                 │
   SILENCED   SKILL_NOT_FOUND       NO_TARGET
        ▼
【Inside the gate · gate.check (fixed order)】
  unlock → charges/base cooldown → cooldown group → GCD → resource → health/hunger → conflict group → condition
        ▼
【After the gate】
  pre_js → request validation → execution(MM)
     │        │          │
 CONDITION  SCRIPT_     MYTHIC_
 _FAILED    BLOCKED     FAILED
```

### The three gates before `gate.check`

| Gate | Meaning | Result code on failure |
|---|---|---|
| silence lock | Player is silenced / skill is locked | `SILENCED` |
| skill id resolution | The given skill id resolves to no matching skill | `SKILL_NOT_FOUND` |
| target (required) | `target.required: true` but no target was locked | `NO_TARGET` |

### The eight gates inside `gate.check` (fixed order)

| Gate | Result code on failure (CastResult) |
|---|---|
| unlock | `NOT_UNLOCKED` |
| charges / base cooldown | `ON_COOLDOWN` |
| cooldown group | `ON_COOLDOWN` |
| GCD (unless this skill has `gcd.ignore`) | `ON_COOLDOWN` |
| resource | `INSUFFICIENT_RESOURCE` |
| health / hunger | `INSUFFICIENT_RESOURCE` |
| conflict group | `CONFLICT` |
| condition | `CONDITION_FAILED` |

### The three gates after the gate check

| Gate | Meaning | Result code on failure |
|---|---|---|
| `pre_js` | Pre-cast script returned false | `CONDITION_FAILED` |
| request validation | Request legitimacy validation failed | `SCRIPT_BLOCKED` |
| execution (MM) | MythicMobs skill returned `false` | `MYTHIC_FAILED` |

::: tip Tip
💡 The order means: silence / resolution / target are checked first, and MM execution is the final fallback. So a silenced player won't even have unlock or cooldown calculated; an unlocked skill won't even have its cooldown calculated. The GCD gate is inside `gate.check`, but if this skill has `gcd.ignore: true` it's skipped.
:::

> ⚙ **Exact rules for the health / hunger gate** (blood-sacrifice / hunger-sacrifice costs):
> - **Health**: when `player.health <= healthCost`, the skill **can't be cast**—meaning even health **exactly equal to** the cost value fails (using `<=`), to avoid killing yourself.
> - **Hunger**: when `foodLevel < hungerCost`, it can't be cast (using `<`, blocked only when strictly less than).
>
> If either is insufficient, it returns `INSUFFICIENT_RESOURCE`.

---

## 8. Ready Notification (ready_notify)

At **the exact moment** the cooldown ends, send the player an actionbar + sound. ⚠️ **Only works for binary-cooldown skills; not supported for charge-based skills.**

```yaml
ready_notify:
  enabled: true
  sound: block.note_block.pling           # sound id (dots or underscores both work)
  message: "&7{skill} &f已就绪"            # {skill} is replaced with the display name
```

---

## 9. Player-Facing Notice (ON_COOLDOWN)

When blocked by `ON_COOLDOWN`, QS actually sends only **one** `cooldownInfo()` message, choosing **one of two** based on skill type:

| Skill type | Message | Notes |
|---|---|---|
| **Normal cooldown** (binary cooldown) | `§c技能冷却中 §7还需 {time}` | `{time}` takes the **maximum remaining of the three**—"the skill's own cooldown / cooldown group / GCD" |
| **Charge-based skill** | `§c充能 §e{avail}§7/§e{max}` | Shows charge count; **when not full it appends** ` §7(下一层 {time})`, omitted when full |

::: tip Tip
💡 Don't think of it as three separate messages—under the hood there are only two: one for normal cooldowns, one for charge-based skills (the charge one differs only in the trailing "next charge" suffix between full / not-full). For normal cooldowns the three cooldown sources (skill / cooldown group / GCD) are merged by taking the max remaining and shown on a single line.
:::

---

## 10. Reproduction: the relevant section of blade_slash (the standard example)

From the bundled example `skills/combat/blade_slash.yml`, combining cooldown / GCD / conflict / ready notification all in one:

```yaml
cooldown:
  base: 2500                     # base cooldown 2.5 seconds

# Global Cooldown (GCD): for 0.8 seconds after casting this skill, any skill cast is blocked
gcd:
  triggers_ms: 800

# Cooldown ready notification: at the moment the cooldown ends, send actionbar + sound (only works for "binary cooldown" skills; not supported for charge-based skills)
ready_notify:
  enabled: true
  sound: block.note_block.pling           # sound id (dots or underscores both work)
  message: "&7{skill} &f已就绪"            # {skill} is replaced with the display name

# Conflict group: for a short time after casting (config.yml gate.conflict_window_ms, default 1 second) other skills in the same group can't be cast
conflict_groups:
  - melee_burst
```

A charge example for comparison (from the `movement/dash` idea, mutually exclusive with the above):

```yaml
cooldown:
  base: 4000
  charges: 2                     # stores 2 charges; if you use charges, don't expect ready_notify
gcd:
  ignore: true                   # commonly set for blink skills: unaffected by others' GCD
```

---

## ✅ Self-Check Checklist

- [ ] Single-skill frequency → `cooldown.base`; a coordinated set of skills → `cooldown.group`.
- [ ] Want a skill to be stockpilable → `cooldown.charges` (remember it resets on relog and doesn't support ready notifications).
- [ ] Worried about same-frame casting → give key skills `gcd.triggers_ms`; give blink/interrupt skills `gcd.ignore: true`.
- [ ] "Don't let anything cut in right after casting" → use `conflict_groups`, not a cooldown.
- [ ] Only enable `ready_notify` for binary-cooldown skills.

---

## Continue Reading

- Next: [Costs, Conditions & Variables](./cost-conditions-variables.md) —— a detailed look at "resource / health-hunger / condition" in the gate order.
- [Targeting & Target Selection](./targeting.md) —— before the gate, pick who to hit first.
- [Cast Modes & Channeling](./cast-modes-channeling.md) —— `channel`'s start/completion cost and CD timing.
- [Full Skill Definition Fields](./skill-definition-fields.md) —— a quick reference for all fields.
