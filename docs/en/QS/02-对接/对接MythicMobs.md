# Integrating MythicMobs: Why Insert a QS Layer + Configuring Skill Presentation

> Previous: [Integrating QinhItems](./qinhitems-integration.md)　·　Next: [Integrating other item plugins](./other-item-plugins.md)

This page has two jobs:

1. **Explain thoroughly "why we don't let items call MythicMobs directly, and instead insert a QS layer in the middle"** — this is the single most important thing to understand about the whole QinhSkills architecture.
2. **Teach you how to write the skill body in MythicMobs** (particles / damage / movement) so QS can invoke it to "make it visible."

> First, restate the iron rule: **QS governs "whether it can fire, and which one," MM governs "what it looks like when it fires," and AP governs "how much damage it deals."** See [Integration Overview](./integration-overview.md).

---

## 🧠 1. Why not call MM directly? (THE WHY — please read it all)

The most intuitive approach is: **press the item → directly call MythicMobs to cast a skill.** Many servers do exactly this. QinhSkills **deliberately does not**, and instead inserts a QS layer between the item and MM. Why? Because "items calling MM directly" runs into four walls, and the QS layer dismantles them one by one.

### Benefit 1️⃣: State/logic and presentation, cleanly separated (single responsibility)

A skill has two kinds of things:

- **"Logic"**: Is it unlocked? Is the cooldown ready? Is the cooldown group occupied? Are there enough charges? Has it passed the GCD? Is there enough mana? Enough health for a blood sacrifice? Which target is chosen? Which combo stage is this? How far has the cast bar filled? Are the passive conditions met? Does gating let it through?
- **"Presentation"**: What the particles look like, how far the movement goes, what sound plays, where damage lands.

> **QS handles all the "logic," MM handles all the "presentation."** This way: when a skill won't fire, if it's a logic problem you check QS, if there's no effect you check MM — **whoever has the problem is who you check**, with no finger-pointing between the two sides.

If items called MM directly, these two kinds of things would get smeared together: where do you write cooldown? Where do you check unlocks? Where do you store combo state? In the end it can only scatter everywhere across item templates and MM YAML.

### Benefit 2️⃣: Single source of truth (no double-charging, no double cooldown)

This is the most concrete benefit. Three things **can only have one place in charge**:

| This thing | Single source of truth | Why |
|---|---|---|
| **Cooldown** | **QS** | So MM skills are always `Cooldown: 0`. Otherwise item cooldown + MM cooldown = double cooldown, ruining the player experience |
| **Resource cost (mana/rage…)** | **QS** (`PlayerSkillProfile`, the same single charge seam) | Otherwise the item deducts once, then the skill deducts again = double charge |
| **Damage numbers** | **AttributePlus** (settled by item attributes) | The `damage{}` in MM only "fires a damage event once"; the number is handed to AP |

> Analogy: QS is the "bookkeeper," and the only ledger for all cooldowns and resources is its. MM and items aren't allowed to keep their own private books, or the accounts won't reconcile.

### Benefit 3️⃣: A pluggable execution backend

QS isn't hardwired to "only MythicMobs." It connects to MM through a **bridge**. If in the future you want to swap to a different execution engine (or MM ships a new version with a changed API), **you only change the bridge layer — not a single line of QS's gating logic needs to move**.

> Analogy: QS is the console, and MM is the monitor plugged into the HDMI port. Swapping the monitor doesn't require swapping the console — because there's a standard interface (the bridge) between them.

### Benefit 4️⃣: Passive triggers get a unified entry point

The trickiest part of passive skills (retaliate when hit, heal on kill, raise a shield at low health…) is the "**who hit whom**" context. If you let items/MM each grab it themselves, it turns into a mess.

QS **uniformly catches** all passive events (attack / take damage / kill / low health / sneak / jump…), builds the context (who is the attacker, who is the victim), and then calls MM — so what MM receives is a ready-made `@Trigger` / `@Target`, with no effort needed to find it itself.

### 🔒 The iron rule this leads to

> **QI only turns a keypress into "cast a particular skill"; it doesn't write skill logic, doesn't compute damage, and doesn't call MM directly. All skill execution goes through QS into MM, to avoid QI / QS / MM three-way authority conflict.**

This iron rule directly yields two "don'ts" (already emphasized in [Integrating QinhItems](./qinhitems-integration.md)): **don't configure cooldown again** in the item, and **don't add `mythicmobs:cast` again** in the item.

> 🖼️ **[Image placeholder]** Comparison diagram: left "item calls MM directly (cooldown/resources/damage conflict in three places)" vs right "insert a QS layer (single source of truth)"　·　suggested `assets/why-qs-layer.png`

---

## 🌉 2. The Mythic bridge: three modes

Before QS calls MM, it must first ensure MM **has that same-named skill**. QS's "bridge" is responsible for "connecting" the skill to MM. The bridge has three modes, configured in `config.yml` under `mythic.bridge_mode`:

| Mode | Behavior | Suits |
|---|---|---|
| **`AUTO`** (recommended) | First **register via API** → verify whether registration succeeded → if it fails, **write a YAML stub** into the MM skills directory and `loadSkills()` → then verify again | Production, most robust |
| **`API_MODE`** | **Register via API only**, no YAML fallback | Development / debugging |
| **`YAML_STUB`** | **Write a YAML stub only** into the MM skills directory, going through MM's loading lifecycle | When you want fully file-based management |

> In plain terms: `AUTO` = "first try to tell MM directly via code that this skill exists; if that doesn't work, write a placeholder file and let MM load it itself." The vast majority of people should just use the default `AUTO`.

---

## ⚙️ 3. The bridge's config fields

All under the `mythic:` section of `config.yml`:

| Field | Default | Meaning |
|---|---|---|
| `bridge_enabled` | `true` | Whether to enable the Mythic bridge |
| `bridge_mode` | `AUTO` | One of the three modes (see above) |
| `bridge_debug` | `false` | The bridge's debug log (turn on when troubleshooting) |
| `bridge_verify_after_register` | `true` | After registering, use `getSkill` to check the skill is really in MM |
| `bridge_verify_cast` | `false` | Optional: a silent test-cast to verify (requires a **player online** + `debug`) |
| `bridge_mythic_yaml_file` | `QinhSkillsBridge.yml` | Which file the YAML stub is written to |
| `bridge_stub_mechanic` | `'message{m="&7[QinhSkills] &f{skill}"} @Self'` | The stub's placeholder mechanic, **must contain the `{skill}` placeholder** |

> The `{skill}` in `bridge_stub_mechanic` is replaced with the skill name — this is the source of that `[QinhSkills] skill name` placeholder message you see on screen when you haven't configured MM presentation.

---

## 📝 4. What a stub looks like + the never-overwrite principle

When the bridge takes the YAML fallback, it writes a **stub (placeholder skill)** to:

```text
plugins/MythicMobs/skills/QinhSkillsBridge.yml
```

Shaped like:

```yaml
skillId:
  Cooldown: 0
  Skills:
  - message{m="&7[QinhSkills] &fskillId"} @Self    # exactly the expansion of bridge_stub_mechanic
```

### 🔐 The never-overwrite principle (extremely important)

> **QS will never overwrite a same-named MM skill that already exists.** Once it detects this skill name already exists in MM (`skillExists`), the bridge **simply skips** — it doesn't write the stub and doesn't touch your file.

This means:

- The stub **is just a placeholder + verification channel** — before you've written the real skill, it at least lets you see "the skill really did fire."
- Once you write a **real same-named skill** in `plugins/MythicMobs/skills/`, QS immediately switches to your real skill, and the stub steps aside.
- So you **never have to worry about QS clobbering your carefully written MM skill.**

---

## 🎯 5. When QS calls MM, what does it pass over?

QS calls MM through `MythicExecutor` (which under the hood uses `MythicBukkit`'s `apiHelper.castSkill`). It passes a **target** and **a bunch of variables** to MM.

### 5.1 Target: when do `@Target` / `@Trigger` exist?

**Key: only when the QS skill configures `target:` will MM receive `@Target`!**

| Configured this way in the QS skill | On the MM side | What you should use in MM |
|---|---|---|
| Configured `target:` (e.g. `NEAREST` + `MONSTERS`) | QS picks the target → passes it in as `@Target` | `@Target` |
| **Did not configure** `target:` | **No** `@Target` | `@EntitiesInRadius{r=4}` / `@Self` — **grab a range yourself** |
| Passive skill | The attacker etc. is passed in as `@Trigger` / `@Target` | `@Trigger` / `@Target` |

::: warning Caution
⚠️ The most common newbie pitfall: the MM skill uses `@Target`, but the QS skill didn't configure `target:` — so MM can't find a target and the skill "fires into nothing." **If you didn't configure `target:`, use `@EntitiesInRadius` / `@Self`.**
:::

### 5.2 Variables: read them in MM with `<skill.var.name>`

QS injects these variables, which the MM YAML reads with `<skill.var.NAME>` (the variable names have been cross-checked against the source `MythicExecutor.applyVariables` + `SkillCastRequestBridge`):

| Variable name | Meaning |
|---|---|
| `mode` | Trigger mode (e.g. `LEFT_CLICK`) |
| `source` | Trigger source (e.g. `qinhitems`) |
| `slot` | Item slot (`-1` when there's no slot, e.g. the command bridge) |
| `playerName` | Caster's player name (**it's literally `playerName`, there is no `player`**) |
| `origin` | Fixed `=QinhSkills` |
| `logicOnly` | Fixed `true` |
| `toggle_state` | `on` / `off` (**only for TOGGLE skills**) |
| **All keys configured in the skill's `variables:` / `levels.params:`** | E.g. `element`, `power` — everything you wrote in the QS skill definition is passed through (**verbatim, with no prefix**) |

> Numbers are automatically converted to MM **numeric variables** (usable in math); everything else is a string. This lets you use `<skill.var.power>` to do per-level scaling in MM (the damage is ultimately handed to AP, but you can use it to scale presentation like particle count, range, etc.).

::: warning Caution
⚠️ **Two high-frequency misconceptions (be sure to commit to memory):**
1. **The player name is `<skill.var.playerName>`, not `<skill.var.player>`.** There is no `player` variable on the MM side.
2. **The MM side cannot get the skill level `level`.** Level exists only in the script `ctx` (`ctx.get("level")`). To scale by level in MM, pass a parameter in the QS skill's `levels.N.params:` (e.g. `power: "1.2"`), and read it in MM with `<skill.var.power>`.
3. This MM variable-name set (parameters with **no** `var_` prefix, using `playerName`) and the **script** `ctx` set (parameters **with** the `var_` prefix, using `player`, having `level`) are **two different sets** — don't mix them. For the mapping see [Script API](../04-developer/script-api.md).
:::

---

## ⚖️ 6. Three iron rules on the MM side

When writing MM skills, none of these three can be broken:

| ★ Iron rule | Why |
|---|---|
| **`Cooldown` is always `0`** | Cooldown is managed centrally by QS. Setting cooldown in MM too = double cooldown |
| **`@Target` only when QS configured `target:`** | Otherwise MM can't find a target and fires into nothing (see 5.1) |
| **`damage{}` only fires a damage event; the number goes to AP** | Neither QS nor QI hardcodes damage; AttributePlus settles the final number from the attacker's **item attributes** |

---

## 📄 7. Complete template: `QinhSkillsEcosystem.yml` (annotated per skill)

Below is the **official MM template, copied verbatim**, that QS drops on first startup to `plugins/QinhSkills/integrations/mythic/QinhSkillsEcosystem.yml`. It is the standard answer for "how the MM side should be written."

> Usage: copy it under `plugins/MythicMobs/skills/`, then `/mm reload`. Once MM has these same-named skills, QS's bridge **no longer uses placeholder messages** and switches to the real presentation you wrote here.

> 🛠️ **One comment that needs correcting (defer to the variable table in section 5.2 of this page):** the comment in the template file's header writes `<skill.var.player>` and `<skill.var.level>`, but what QS actually injects into MM is **`<skill.var.playerName>`** (the player name), and **`level` is not passed to MM**. The template skill bodies below don't actually use these two variables, so copying verbatim does no harm; but when you write your own MM skills, use `<skill.var.playerName>` for the player name, and scale by level via passing a parameter in `levels.params:` (e.g. `<skill.var.power>`).

```yaml
#==============================================================================
#  [Integration Example 3/4] MythicMobs skill  ←  invoked and executed by QS (the real presentation layer)
#
#  Copy this file under   plugins/MythicMobs/skills/   , then /mm reload.
#  These skill names correspond one-to-one with the QS example skills' execution.mythic_skill. Once a same-named skill exists in MM,
#  QS's Mythic bridge [no longer uses placeholder messages] and switches to the real presentation (particles/movement/damage) you wrote here.
#
#  ★ The QS → MM "interface" (what you can get on the MM side):
#    1) Variables: QS injects skill variables, read inside MM with  <skill.var.name> . Common ones:
#         <skill.var.player>  caster name      <skill.var.level>  skill level
#         <skill.var.element> / <skill.var.power>  what you configured in QS variables:/levels.params:
#         <skill.var.toggle_state>  a toggle skill's on/off
#    2) Target: @Target / @Trigger is only passed when the QS skill configured target:!
#         configured (e.g. blade_slash's NEAREST) → use @Target;
#         passive skill (e.g. retaliate) → the attacker is passed in as @Trigger / @Target;
#         not configured target: (e.g. fire_wave) → no @Target, please use @EntitiesInRadius / @Self to grab a range yourself.
#    3) Caster: @Self / @caster is the player who cast the skill.
#
#  ⚠ Damage numbers are not hardcoded here, and even less in QS/QI:
#     Neither QS nor QinhItems has [any built-in attributes/damage]. The damage below is just "deal a hit, fire a damage event";
#     the final damage is settled by AttributePlus (or whatever attribute plugin you use) from the attacker's item attributes — AP has taken over vanilla damage.
#     If your attribute plugin provides a dedicated "settle by attributes" MM mechanic, replace the damage line per its docs.
#
#  ★ Cooldown is always set to 0: cooldown is managed centrally by QS; don't set it again here, to avoid double cooldown.
#  ★ Mechanics (particles/sound/movement/auras…) come in a huge variety; here we only use a few of the most basic ones to demo "how to consume QS's data",
#    for the full mechanic list see the MythicMobs Wiki.
#==============================================================================

# Fire Wave — AOE around self (QS didn't configure target, so use @EntitiesInRadius to grab a range, can't use @Target)
fire_wave:
  Cooldown: 0
  Skills:
  - effect:particles{particle=flame;amount=40;hSpread=2;vSpread=1;speed=0.05} @Origin
  - sound{sound=entity.blaze.shoot;volume=1;pitch=1} @Self
  - ignite{ticks=40} @EntitiesInRadius{r=4}
  - damage{amount=4} @EntitiesInRadius{r=4}   # number settled by AP; <skill.var.power> can be used for per-level scaling

# Blade Slash — single target (QS configured target: NEAREST+MONSTERS, so there's @Target = the nearest monster)
blade_slash:
  Cooldown: 0
  Skills:
  - sound{sound=entity.player.attack.sweep;volume=1;pitch=1} @Self
  - effect:particles{particle=crit;amount=12} @Target
  - damage{amount=6} @Target                  # @Target is picked by QS; damage goes to AP

# Demo Slash — a starter skill, no target, grabs monsters around self
demo_slash:
  Cooldown: 0
  Skills:
  - sound{sound=entity.player.attack.strong;volume=1;pitch=1} @Self
  - damage{amount=3} @EntitiesInRadius{r=3}

# Demo Charged Slash — invoked by QS after the cast completes (the cast-bar logic is all in QS, MM only handles the "firing" moment)
demo_slash_charged:
  Cooldown: 0
  Skills:
  - sound{sound=entity.generic.explode;volume=1;pitch=1.2} @Self
  - effect:particles{particle=crit;amount=30} @Self
  - damage{amount=6} @EntitiesInRadius{r=3}

# Thorns Retaliate — passive: QS passes "the entity that hit you" in as @Trigger
retaliate:
  Cooldown: 0
  Skills:
  - sound{sound=enchant.thorns.hit;volume=1;pitch=1} @Self
  - damage{amount=3} @Trigger                 # retaliate the attacker; number goes to AP

# Dash — a movement skill, deals no damage
dash:
  Cooldown: 0
  Skills:
  - sound{sound=entity.player.attack.sweep;volume=1;pitch=1.6} @Self
  - effect:particles{particle=cloud;amount=20;speed=0.02} @Self
  - potion{type=SPEED;duration=30;level=4} @Self
  # ↑ uses "speed" to illustrate. For a real teleport/dash, switch to an MM movement mechanic (lunge / velocity / leap etc., see the MM Wiki).

# Shield — a toggle skill, QS passes <skill.var.toggle_state> = on / off
shield:
  Cooldown: 0
  Skills:
  - sound{sound=block.beacon.activate;volume=1;pitch=1.4} @Self
  - potion{type=ABSORPTION;duration=200;level=1} @Self
  # ↑ to distinguish "raise shield/drop shield", use an MM condition (?) or split into two sub-skills branching on <skill.var.toggle_state> (see the MM Wiki).

# Blaze Combo Dance — the opener/follow-up hit of a combo (fire_combo_strike in the QS combo)
fire_combo_strike:
  Cooldown: 0
  Skills:
  - sound{sound=entity.blaze.hurt;volume=1;pitch=1.2} @Self
  - effect:particles{particle=flame;amount=8} @Self
  - damage{amount=3} @EntitiesInRadius{r=3}

# Blaze Combo Dance — the finisher (right→right→left; QS invokes fire_combo_blaze on hit)
fire_combo_blaze:
  Cooldown: 0
  Skills:
  - sound{sound=entity.generic.explode;volume=1;pitch=1} @Self
  - effect:particles{particle=flame;amount=60;hSpread=3;vSpread=1} @Origin
  - ignite{ticks=60} @EntitiesInRadius{r=5}
  - damage{amount=10} @EntitiesInRadius{r=5}  # big finisher damage; number goes to AP
```

### Annotation per skill

| MM skill | What it is on the QS side | How target is grabbed | Highlight |
|---|---|---|---|
| `fire_wave` | Self AOE, **no** `target:` configured | `@EntitiesInRadius{r=4}` / `@Origin` | Example of grabbing a range yourself when there's no target |
| `blade_slash` | Configured `target: NEAREST` + `MONSTERS` | `@Target` (nearest monster) | Use `@Target` only when target is configured |
| `demo_slash` | A starter skill, no target | `@EntitiesInRadius{r=3}` | The simplest starter skill |
| `demo_slash_charged` | Invoked after **casting** completes | Around `@Self` | The cast-bar logic is all in QS; MM only handles "the firing moment" |
| `retaliate` | **Passive** (retaliate when attacked) | `@Trigger` (the one who hit you) | Example of a passive skill grabbing `@Trigger` |
| `dash` | Movement skill | `@Self` | Deals no damage; uses speed to illustrate movement |
| `shield` | **Toggle skill** | `@Self` | Reads `<skill.var.toggle_state>` to distinguish on/off |
| `fire_combo_strike` | **Combo** opener / follow-up | `@EntitiesInRadius{r=3}` | The middle stage of a combo |
| `fire_combo_blaze` | **Combo finisher** (after right→right→left lands) | `@EntitiesInRadius{r=5}` | The combo's finishing ultimate |

> Note for each skill: **all `Cooldown: 0`** (cooldown belongs to QS), **the number in `damage{}` only "deals a hit"** (final damage belongs to AP), and **`@Target` appears only in `blade_slash`, which configured `target:`**. These three points are the living textbook for the "three MM-side iron rules."

---

## 🩺 8. Troubleshooting checklist

| Symptom | Possible cause | Fix |
|---|---|---|
| Skill shows only the placeholder text `[QinhSkills] skill name` | No same-named skill in MM | Copy `QinhSkillsEcosystem.yml` to the MM skills directory + `/mm reload` |
| Skill "fires into nothing" with no target | MM used `@Target` but QS didn't configure `target:` | Configure `target:` in QS, or switch MM to `@EntitiesInRadius` / `@Self` |
| Cooldown is messed up / shorter or longer than expected | The MM skill set `Cooldown` ≠ 0 | Always `Cooldown: 0` in MM; cooldown goes to QS |
| Damage numbers are wrong | Expected AP settlement but seeing MM's hardcoded value | `damage{}` only fires the event; go configure attributes in AP |
| Bridge didn't connect / no log visible | Debug not enabled | Set `mythic.bridge_debug: true` in `config.yml`, watch the bridge log on `/qs reload` |
| My real skill got overwritten | Doesn't happen | QS **never overwrites** a same-named MM skill; if suspicious, check whether the filename is truly the same name |

---

## Keep reading

- Not using QI, triggering with another item plugin? → [Integrating other item plugins](./other-item-plugins.md)
- Want to understand the full chain from keypress to MM + diagnostics → [Execution chain and events](./cast-flow-events.md)
- Going back to configure item triggers → [Integrating QinhItems](./qinhitems-integration.md)
