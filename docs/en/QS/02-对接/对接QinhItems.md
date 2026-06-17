# Integrating QinhItems: Adding a `qinhskills:cast` Action to an Item

> Previous: [Integration Overview](./integration-overview.md)　·　Next: [Integrating MythicMobs](./mythicmobs-integration.md)

This page teaches you: **using QinhItems (QI) to build a weapon that casts a QS skill on keypress.** This is the most "native" approach — QI ships with the `qinhskills:cast` action handler built in, so you don't need to install any other bridge.

By the end you'll know: how to write this action in the item YAML, why `handler:` / `payload:` **must use the expanded form**, how an item keypress maps to a skill trigger, the three ways to write a payload, and a fully annotated complete template.

> First, recall the iron rule: **QI only turns "a keypress" into "cast a particular skill"; it doesn't write skill logic, doesn't compute damage, and doesn't call MM directly.** See [Integration Overview](./integration-overview.md).

---

## 🧩 1. What the action looks like: the minimal skeleton

In a QI item YAML, "trigger a skill on keypress" is written in the `actions.triggers` section. The minimal skeleton:

```yaml
my_item:
  actions:
    triggers:
      left_click:                    # trigger name (custom, name it whatever)
        trigger:
          atom: left_click           # trigger atom: what action the player performs
        refs:                        # handler references executed in order
          - handler: qinhskills:cast # fixed handler; hands the skill to QS
            payload: "blade_slash"   # payload = QS skill id
```

How to read it: **player left-clicks → QI captures it → calls handler `qinhskills:cast` → hands the payload `blade_slash` to QS → QS runs gating, then calls MM to cast the skill.**

---

## ⚠️ 2. The easiest pitfall: `handler` contains a colon, so you must use the expanded form

QI's action references support two forms. But the handler id `qinhskills:cast` **itself contains a colon**, so you **can only** use the "expanded form":

✅ **Correct (expanded form, handler / payload on separate lines):**

```yaml
refs:
  - handler: qinhskills:cast
    payload: "blade_slash"
```

❌ **Wrong (single-line shorthand):**

```yaml
refs:
  - "qinhskills:cast: blade_slash"   # ☠ will be split wrong at the "first colon"!
```

> Why? The single-line shorthand format is `<handler>: <payload>`, and when YAML parses it, it splits at the **first colon**. Since `qinhskills:cast` already has a colon, it gets wrongly split into handler=`qinhskills`, payload=`cast: blade_slash` — completely misaligned. **Remember: whenever a handler id contains a colon, always use the `handler:` / `payload:` expanded form.**

---

## 🎮 3. Item keypress (atom) ↔ skill trigger (trigger.primary)

The **trigger atoms** available on a QI item are a one-to-one concept with `trigger.primary` in a QS skill. Common mapping table:

| QI item atom | Meaning | Matching QS `trigger.primary` |
|---|---|---|
| `left_click` | Left-click (swing, most reliable) | `LEFT_CLICK` |
| `right_click` | Right-click | `RIGHT_CLICK` |
| `shift_left_click` | Sneak + left-click | `SHIFT_LEFT_CLICK` |
| `shift_right_click` | Sneak + right-click | `SHIFT_RIGHT_CLICK` |
| `shift_toggle` | Sneak toggle (common for toggle skills) | `SHIFT_TOGGLE` |

> 💡 **Best practice: make the item atom match the skill's `trigger.primary`.** For example, if the skill `dash` is configured with `trigger.primary: SHIFT_RIGHT_CLICK`, then trigger it from the item with `shift_right_click`.
>
> What happens if they **don't match**? QS won't error — it will **fall back to the skill's entry node**, and the skill still casts; it's just that combos / branches may not reach the path you expected. So "even if they don't match it still casts, but it's best to match them."

> 🖼️ **[Image placeholder]** Illustration of the five atoms' player actions (left-click / right-click / sneak combos / toggle)　·　suggested `assets/qi-atom-triggers.png`

---

## 📦 4. The three ways to write a payload

The `payload` the item passes to QS is parsed by QS's internal `PayloadParser`, which supports **three** forms. The skill id is always lowercased.

| Form | Example | Parse result |
|---|---|---|
| **① Plain skill id** | `payload: "fire_wave"` | `skill = fire_wave` |
| **② With trigger mode** | `payload: "fire_wave:RIGHT_CLICK"` | `skill = fire_wave`, `triggerMode = RIGHT_CLICK` |
| **③ JSON** | `payload: '{"skill":"demo_slash_charged","source":"qinhitems","context":{"mode":"LEFT_CLICK"}}'` | `skill = demo_slash_charged`, plus `source` / `context.mode` |

Keys recognized by the JSON form:

| JSON key | Required | Meaning |
|---|---|---|
| `skill` | ✅ Required | Skill id |
| `source` | Optional | Trigger source marker (e.g. `qinhitems`); passed to MM as a variable |
| `context.mode` | Optional | Trigger mode (e.g. `LEFT_CLICK`) |

> 📌 Which form to choose? For everyday use, **① the plain skill id** is enough. Use **③ JSON** only when you want MM to read `source` / `mode` for branching.

---

## 📄 5. Complete template: `qinhitems_action_example.yml`, section by section

Below is the **official template, copied verbatim**, that QS drops on first startup to `plugins/QinhSkills/integrations/qinhitems_action_example.yml`. It builds a weapon: **left-click casts "Blade Slash," sneak + right-click casts "Dash."**

> Usage: copy this content under `plugins/QinhItems/items/` (you may rename the file), then `/qi reload`.

```yaml
#==============================================================================
#  [Integration Example 1/4] QinhItems item  →  trigger a QS skill
#
#  Copy this file under   plugins/QinhItems/items/   (rename allowed), then  /qi reload.
#  It builds a weapon: left-click casts "Blade Slash", sneak+right-click casts "Dash". Keypresses are captured by QI,
#  sent to QS via the handler qinhskills:cast; after QS runs gating (unlock/cooldown/cost/target) it hands off to MythicMobs for effects.
#
#  ★ Key division of labor (be sure to understand it; the next three examples follow the same):
#     QinhItems = turns "a keypress" into "cast a particular skill" (what this file does); doesn't write skill logic, doesn't compute damage.
#     QinhSkills= gating like unlock/cooldown/cost/target/combo, then calls MM.
#     MythicMobs= the real particle/movement/damage presentation (see Integration Example 3).
#     Attribute plugin (AttributePlus etc.) = computes the final damage numbers.
#  ⚠ Neither QI nor QS has [any built-in attributes / damage]. The weapon's attack power is written under providers.ap and handed to AttributePlus.
#==============================================================================

# Top-level key = item ID (globally unique); run /qi reload after editing to apply
demo_fire_blade:
  type: weapon                       # item type (corresponds to the ruleset in items/weapon.yml)
  material: golden_sword             # base material (vanilla material name)
  display_name: "<gold>炎刃剑</gold>" # hover name (MiniMessage or &color codes)
  item_name: "炎刃剑"
  tier: RARE                         # tier COMMON/UNCOMMON/RARE/EPIC/LEGENDARY
  lore:
    - ""
    - "<gray>左键:刃斩   ｜   潜行+右键:疾冲</gray>"
    - "<dark_gray>技能表现由 MythicMobs 呈现，伤害由属性插件结算</dark_gray>"

  # Item attributes → handed to AttributePlus (QI has no built-in numbers).
  # ⚠ The key must be the "display name" configured in AP (AP only ships with "物理伤害" by default; any other
  #    attribute must first be defined in plugins/AttributePlus/attribute.yml, otherwise it has no effect).
  providers:
    ap:
      value:
        物理伤害: 50                  # basic-attack damage is applied by AP; skill damage also goes through AP (QI here only declares the number)

  options:
    glow: false
    max_stack_size: 1

  # Actions: keypress → trigger skill
  actions:
    triggers:
      # Left-click is the most reliable (a swing triggers anytime). This corresponds to "Blade Slash" with trigger.primary: LEFT_CLICK in QS
      left_click:
        trigger:
          atom: left_click           # available atoms: left_click / right_click / shift_left_click / shift_right_click / shift_toggle
        # cooldown: 1s               # (optional) QI-side action cooldown; the skill's real cooldown is best configured in the QS skill file — don't duplicate on both sides
        refs:
          # ⚠ the handler is fixed as qinhskills:cast (which itself contains a colon) — you must use the expanded handler:/payload: form,
          #    not the single-line shorthand "- qinhskills:cast: xxx" (it gets split wrong at the first colon)
          - handler: qinhskills:cast
            payload: "blade_slash"   # payload = QS skill id; JSON form also supported: '{"skill":"blade_slash"}'

      # Sneak+right-click → Dash (the trigger.primary of dash in QS is exactly SHIFT_RIGHT_CLICK)
      shift_right_click:
        trigger:
          atom: shift_right_click
        refs:
          - handler: qinhskills:cast
            payload: "dash"

#------------------------------------------------------------------------------
# Troubleshooting tips:
#  · the payload's skill must be [already unlocked by the player] — QS by default blocks and notifies if it isn't unlocked. To test:
#    /qs unlock blade_slash, or write it into QS config.yml's unlock.starter_skills, or unlock.default_all: true.
#  · the item keypress's atom should match the QS skill's trigger.primary (when they don't match, QS falls back to the entry node and still casts).
#  · don't also write mythicmobs:cast in the same action — MM is always called by QS, to avoid QI/QS/MM three-way authority conflict.
#  · full acceptance test:  /qs reload → /qi reload → /qi give @p demo_fire_blade → try left-click / sneak right-click to cast.
#==============================================================================
```

### Section-by-section breakdown

| Section | What it does | Note |
|---|---|---|
| `demo_fire_blade:` | Item id (globally unique) | Run `/qi reload` after editing |
| `type` / `material` / `display_name` / `tier` / `lore` | Item appearance | Same as any normal QI item; unrelated to the skill |
| `providers.ap.value.物理伤害: 50` | Hands attack power to **AttributePlus** | ⚠ The key name must be a "display name" defined in AP; QI doesn't compute damage itself |
| `actions.triggers.left_click` | Left-click → Blade Slash | The atom `left_click` matches skill `blade_slash`'s `trigger.primary: LEFT_CLICK` |
| `# cooldown: 1s` (commented out) | QI-side action cooldown | ⚠ **Deliberately commented out** — let QS manage cooldown; don't duplicate on both sides |
| `handler: qinhskills:cast` / `payload: "blade_slash"` | Hands the skill to QS | Expanded form; payload is the skill id |
| `shift_right_click` → `payload: "dash"` | Sneak right-click → Dash | The atom `shift_right_click` matches `dash`'s `trigger.primary: SHIFT_RIGHT_CLICK` |

---

## 🚫 6. Two "absolutely don'ts"

| Don't do | Why | What to do instead |
|---|---|---|
| **Don't configure cooldown on both the QI and QS sides** | Causes double cooldown / conflicts | **Let QS manage cooldown** (write it in the skill file). In the template, QI's `cooldown:` is commented out |
| **Don't add `mythicmobs:cast` in the same action** | Causes QI / QS / MM three-way authority conflict (architectural fracture) | **MM is always called by QS.** Write only `qinhskills:cast` in the item; never call MM directly |

> Both of these follow directly from the "four-way division-of-labor iron rule": **QS is the single source of truth for cooldown, and MM is always driven by QS.** See [Integrating MythicMobs → why not call MM directly](./mythicmobs-integration.md).

---

## 🩺 7. Troubleshooting checklist

Keypress won't cast the skill? Check each item:

| Symptom | Possible cause | Fix |
|---|---|---|
| "Skill not unlocked" message | The payload's skill isn't unlocked for the player | `/qs unlock blade_slash`; or configure `unlock.starter_skills`; or `unlock.default_all: true` |
| Keypress does nothing at all | The handler was written as single-line shorthand and got split wrong | Switch to the `handler:` / `payload:` expanded form (see section 2) |
| Keypress does nothing + no console log | Didn't `/qi reload`; or the atom is wrong | Reload; double-check the atom spelling |
| Skill firing shows only the text `[QinhSkills] skill name` | No same-named skill in MM | Go to [Integrating MythicMobs](./mythicmobs-integration.md) to configure MM presentation |
| Combo / branch didn't reach the expected path | The atom doesn't match the skill's `trigger.primary` | Make the atom match the skill's `trigger.primary` |
| The `qinhskills:cast` handler doesn't exist | QS loaded before QI and registration wasn't patched | Usually auto-patched; if it really fails, `/qs reload` → `/qi reload` |

---

## ✅ 8. Acceptance commands

Type these in order and you'll get an end-to-end verification:

```text
/qs reload                          # reload QS (skills, unlocks, bridge)
/qi reload                          # reload QI (items, action bindings)
/qi give @p demo_fire_blade         # give yourself the template weapon
# then: left-click to try "Blade Slash", sneak+right-click to try "Dash"
```

> If the skill fires with only placeholder text and no particles/damage, that means the QS side is already working — only the MM presentation is missing, which is exactly what the next page fills in.

---

## Keep reading

- Configure the skill's MM presentation (particles / damage / movement) → [Integrating MythicMobs](./mythicmobs-integration.md)
- Not using QI, using another item plugin? → [Integrating other item plugins](./other-item-plugins.md)
- Want to understand what happens between "keypress → skill firing" → [Execution chain and events](./cast-flow-events.md)
