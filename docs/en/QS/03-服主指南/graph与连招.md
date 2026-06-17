# Graphs and Combos

> Previous: [Full Skill Definition Reference](./skill-definition-fields.md)　·　Next: [Cast Modes and Channeling](./cast-modes-channeling.md)

This page covers **how to write a graph (execution graph), how nodes are chosen, and the underlying mechanics of combos**. By the end you'll be able to build combos like "right → right → left finisher."

A graph sounds advanced, but the simplest skill has just one "entry node." Combos are where graphs really shine—let's build up step by step.

> 🖼️ **[Image placeholder]** A combo state-flow diagram (IDLE → opener → COMBO_WINDOW → chain / finisher)　·　suggested `assets/combo-state-flow.png`

---

## 🗺️ What is a graph

A graph answers one thing: **"When this key is pressed in this state, which node do we take and which MM skill do we cast?"**

It lives at `plugins/QinhSkills/graphs/<category>/xxx.graph.yml`, with this structure:

```yaml
graph_id: <lowercase, matches the skill's graph.entry>
entry: <entry node name>
nodes:
  <node_id>:
    skill_id: <optional, defaults to nodeId>
    mythic_skill: <required, the MM skill actually executed>
    require_state: <defaults to IDLE>
    triggers: [<TriggerType...>]
combos:        # optional, only needed for combos
  - id: <combo id>
    inputs: [<TriggerType...>]
    window_ms: <defaults to 800>
    finalize_skill: <a node id in this graph>
```

### Top-level fields

| Field | Description |
|---|---|
| `graph_id` | The graph's id, **all lowercase**, must match the skill's `graph.entry` |
| `entry` | Entry node name (taken when an idle player opens) |
| `nodes` | All nodes |
| `combos` | Combo definitions (optional) |

### Node fields (nodes.\<node_id\>)

| Field | Required | Default | Description |
|---|---|---|---|
| `skill_id` | No | = nodeId | The skill id this node maps to |
| `mythic_skill` | **Yes** | — | The MM skill actually executed |
| `require_state` | No | `IDLE` | State required to take this node (see state machine below) |
| `triggers` | No | `[RIGHT_CLICK]` | Which TriggerTypes route to this node |

`require_state` values: `IDLE` / `CASTING` / `COMBO_WINDOW` / `RECOVERY` / `LOCKED` / `INTERRUPTED`.

---

## 🧩 The simplest graph: a single entry node

For a non-combo skill, the graph is just one entry node. Here's `fire_wave`'s graph—**copy it field for field**:

```yaml
graph_id: fire_wave             # must match the skill file's graph.entry
entry: fire_wave                # entry node name

nodes:
  fire_wave:                    # entry node (name = entry)
    skill_id: fire_wave
    mythic_skill: fire_wave     # the MM skill actually executed
    require_state: IDLE         # requires the "idle" state to open from here
    triggers:                   # pressing these keys routes to this node (you can list several)
      - RIGHT_CLICK
```

It must line up with the skill file `fire_wave.yml`:

| In the graph | In the skill yml | Relationship |
|---|---|---|
| graph `graph_id` / graph `entry` / entry node node_id | `graph.entry` | **Same name in four places** = `fire_wave` (skill `graph.entry` == graph `graph_id` == graph `entry` == entry node name) |
| node `mythic_skill` | `execution.mythic_skill` | Identical |
| node `require_state` | `state.required` | Identical |
| node `triggers` | `trigger.primary` | triggers must **include** primary |

> 💡 For 99% of simple skills, the graph is just this one node—once written you'll barely touch it again.

---

## 🎯 Node selection logic

When a player presses a key, how does QS decide which node to take? The rule is in `SkillGraphResolver.findNodeByTrigger`, a **three-step fallback**:

```text
① First: a node whose trigger matches AND require_state == current state
        ↓ none found
② Then: any node whose trigger matches
        ↓ none found
③ Fallback: the entry node
```

| Step | Match condition | Purpose |
|---|---|---|
| ① | trigger matches **and** state matches | **The key to combos**—uses state to distinguish opener vs. chain |
| ② | trigger matches only | Fallback when state doesn't line up |
| ③ | nothing matches | The entry node is always the safety net, so a key press never goes unanswered |

> 💡 **Step ① is the core of what makes combos work.** The same right-click hits the opener node in `IDLE` and the chain node in `COMBO_WINDOW`—the only difference is `require_state`.

---

## 🔄 The state machine: the stage for combos

QS maintains a state machine per player. Combos rely entirely on these state transitions:

```text
IDLE ──key pressed in IDLE, opener succeeds──► CASTING
CASTING ──succeeds and the skill has a combo──► COMBO_WINDOW
COMBO_WINDOW ──keep pressing within the window──► chain / trigger finisher
COMBO_WINDOW ──window_ms passes with no follow-up──► IDLE   (combo broken)
any state ──/qs silence N──► LOCKED   (silenced/locked, returns to IDLE after N seconds)
```

| State | Meaning |
|---|---|
| `IDLE` | Idle, can open normally |
| `CASTING` | Casting |
| `COMBO_WINDOW` | **Combo window**; inputs within this window count as "chaining" |
| `RECOVERY` | Recovery/aftercast (reserved) |
| `LOCKED` | Silenced; no skill can be cast |
| `INTERRUPTED` | Channeling/casting was interrupted |

---

## 🥋 How combos work (key section)

A combo relies on three things working together: **multiple nodes** + **`require_state` to distinguish opener vs. chain** + the **`combos` section**.

**Core mechanics:**

1. The opener node uses `require_state: IDLE`; the chain/finisher nodes use the **same trigger** but `require_state: COMBO_WINDOW`.
2. After a successful opener the player enters `COMBO_WINDOW`, so the same key now hits the chain node because of the different state (node selection step ①).
3. Before matching, `ComboResolver` first checks **`current state == combo.state_required`** (defaults to `COMBO_WINDOW`)—if the state doesn't match, **that combo is skipped**.
4. Once the state matches, `ComboResolver` keeps only the historical inputs "within ≤ `window_ms` of now" (a **sliding window**), then checks whether the last N of them equal `combo.inputs`; if equal, it triggers the node named by `finalize_skill`. In other words, **the whole sequence from the first press to the last press must span ≤ `window_ms`**, otherwise the earliest press gets dropped and the combo fails to register.

### combos section fields

| Field | Required | Default | Description |
|---|---|---|---|
| `id` | Yes | — | Combo id |
| `inputs` | Yes | — | **The full input sequence** (including the opening press) |
| `window_ms` | No | `800` | The **sliding time window** for the whole sequence; the span from first to last press must be ≤ this value, otherwise the earliest press is dropped and the combo breaks |
| `state_required` | No | `COMBO_WINDOW` | The player state required to trigger this combo; **usually no need to configure** (the source field name is `state_required`) |
| `finalize_skill` | Yes | — | **Must be a node id in this graph's nodes** ⚠ the field name is `finalize_skill`, not `_id` |

---

## 🔥 Complete combo example: right → right → left

Below reproduces **all three files** of the `fire_combo_finisher` combo, field for field.

### File 1: skill definition `skills/combo/fire_combo_finisher.yml`

```yaml
id: fire_combo_finisher
display: "&c&l炎爆连舞"

meta:
  category: combo
  type: active
  rank: advanced
trigger:
  primary: RIGHT_CLICK          # opening key
state:
  required: IDLE
graph:
  entry: fire_combo_finisher
execution:
  mythic_skill: fire_combo_strike   # the MM skill of the opening press; must match the entry node's mythic_skill

type: active
max_level: 1

cooldown:
  base: 0                       # ★ set combo skill cooldown to 0 so chains stay castable (put the real cooldown on the finisher's MM skill)

# no resource: the opener costs no mana, so chains don't break mid-combo from running out. If you must charge, put it on the finisher's MM skill.
```

### File 2: graph `graphs/combo/fire_combo_finisher.graph.yml`

```yaml
graph_id: fire_combo_finisher
entry: fire_combo_finisher

nodes:
  fire_combo_finisher:          # ① opener node (right-click while idle)
    skill_id: fire_combo_finisher
    mythic_skill: fire_combo_strike
    require_state: IDLE
    triggers:
      - RIGHT_CLICK

  fire_combo_chain:             # ② the "normal slash" for another right-click during the chain (within the combo window)
    skill_id: fire_combo_chain
    mythic_skill: fire_combo_strike
    require_state: COMBO_WINDOW
    triggers:
      - RIGHT_CLICK

  fire_combo_blaze:             # ③ finisher node (pointed to by combos.finalize_skill below)
    skill_id: fire_combo_blaze
    mythic_skill: fire_combo_blaze
    require_state: COMBO_WINDOW
    triggers:
      - LEFT_CLICK

# combo definition: within the combo window, once recent inputs complete the inputs sequence → cast the finalize_skill node
combos:
  - id: blaze
    inputs: [RIGHT_CLICK, RIGHT_CLICK, LEFT_CLICK]   # full input sequence (including the opening press)
    window_ms: 1500             # time window (ms) for the whole sequence: first to last press must complete within this time
    finalize_skill: fire_combo_blaze                 # ⚠ must be a node name that actually exists in nodes above
```

### What each of the three nodes handles

| Node | `require_state` | `triggers` | Role |
|---|---|---|---|
| `fire_combo_finisher` | `IDLE` | `RIGHT_CLICK` | ① opener (right-click while idle) |
| `fire_combo_chain` | `COMBO_WINDOW` | `RIGHT_CLICK` | ② chain (right-click again within the window) |
| `fire_combo_blaze` | `COMBO_WINDOW` | `LEFT_CLICK` | ③ finisher (left-click within the window, pointed to by the combo) |

> Note that ① and ② both use the `RIGHT_CLICK` trigger and are distinguished by `require_state`—this is exactly how the combo mechanics play out in practice.

---

## 🚶 Step-by-step walkthrough: right → right → left

Follow this table once and combos will be perfectly clear:

| Step | Player action | Current state | Node selection (three-step logic) | Node taken | MM skill cast | State change |
|---|---|---|---|---|---|---|
| 1 | Right-click | `IDLE` | ① RIGHT_CLICK matches + state IDLE → `fire_combo_finisher` | opener | `fire_combo_strike` | opener succeeds and has a combo → **enter COMBO_WINDOW** |
| 2 | Right-click | `COMBO_WINDOW` | ① RIGHT_CLICK matches + state COMBO_WINDOW → `fire_combo_chain` | chain | `fire_combo_strike` | window refreshed, stays in COMBO_WINDOW |
| 3 | Left-click | `COMBO_WINDOW` | recent inputs = [R, R, L] == `inputs` and within `window_ms` → trigger `finalize_skill` | finisher `fire_combo_blaze` | `fire_combo_blaze` | combo complete → back to IDLE |

> 💡 In step 3, QS isn't simply asking "which node does left-click hit"; instead `ComboResolver` notices that **the last three inputs exactly form `[RIGHT_CLICK, RIGHT_CLICK, LEFT_CLICK]`** and directly casts the `fire_combo_blaze` node that `finalize_skill` points to.

**What if it times out mid-way?** After the right-click in step 1, if `window_ms` (1500ms here) passes without the second press → the state returns to `IDLE`, the combo breaks, and the next right-click starts fresh from the opener.

---

## ⚠️ Common combo pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| **`finalize_skill` is not a node id** | finisher won't cast / reload errors | `finalize_skill` must **exactly equal** one of the node names in `nodes` (not an MM skill name, not `_id`) |
| **Field written as `finalize_skill_id`** | combo never triggers | The field is literally **`finalize_skill`**—don't add `_id` |
| **`window_ms` too short** | hand speed can't keep up, combo keeps breaking | Increase `window_ms` (the global default `combo_window_ms` is 800ms; a single combo can override it) |
| **Chain node forgot `require_state: COMBO_WINDOW`** | the chain is treated as an opener, the combo never completes | Chain/finisher nodes must set `require_state: COMBO_WINDOW` |
| **Combo skill has a cooldown** | opener goes on CD, the second press is blocked, chain breaks | Set the combo skill's `cooldown.base: 0`, leave the real cooldown to the finisher's MM skill |
| **Opener has a `resource` even though it shouldn't charge** | runs out of mana mid-way and can't chain | Don't set `resource` on the opener; put charging on the finisher's MM skill |

---

## 🔠 Full TriggerType set

`trigger.primary`, node `triggers`, combo `inputs`, and passive internals all use this enum (**case-sensitive, copy verbatim**):

| Trigger | Meaning |
|---|---|
| `RIGHT_CLICK` / `LEFT_CLICK` | right-click / left-click |
| `SHIFT_RIGHT_CLICK` / `SHIFT_LEFT_CLICK` | sneak right-click / sneak left-click |
| `SHIFT_TOGGLE` | sneak toggle |
| `DOUBLE_RIGHT_CLICK` / `DOUBLE_LEFT_CLICK` | double right-click / double left-click |
| `HOLD_RIGHT_CLICK` / `HOLD_LEFT_CLICK` | hold right-click / hold left-click |
| `PASSIVE` | passive |
| `COMMAND` | command |
| `API` | external API |
| `CI_TEST` | internal testing only |

---

## ✅ Summary

- A graph decides "press a key → take a node → cast an MM skill"; a simple skill is just one entry node.
- Node selection is a three-step fallback: state + trigger both match → trigger only → fall back to entry.
- A combo = opener node (`IDLE`) + chain node (same trigger but `COMBO_WINDOW`) + the `combos` section.
- `combos.finalize_skill` must be a node id that **actually exists** in this graph.
- Set the combo skill's `cooldown.base: 0`, otherwise the opener goes on CD and breaks the chain.

---

## Further reading

- All skill definition fields → [Full Skill Definition Reference](./skill-definition-fields.md)
- File layout and naming → [Skill File Structure](./skill-file-structure.md)
- State machine / silence / full pipeline → [Core Concepts](../01-getting-started/core-concepts.md)
- Channeling / toggle cast modes → [Cast Modes and Channeling](./cast-modes-channeling.md)
- Passive skill triggers → [Passive Skills](./passive-skills.md)
