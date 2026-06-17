# FAQ — Frequently Asked Questions

> Previous: [Performance and Throttling](./performance-throttling.md)　·　Next: [Glossary](./glossary.md)

The common pitfalls from across the pages, collected into Q&A and grouped by topic. Click a link for the full explanation. Corresponds to QS **1.0.22**.

---

## Installation and dependencies

**Q: QS fails to start / isn't enabled?**
A: Most likely **QinhCoreLib** is missing (a hard dependency that must be installed first), or the server / Java version is too low (Paper 1.21.11+, Java 25+). See [Diagnostics §1](./troubleshooting.md#1-qs-isnt-enabled).

**Q: Is MythicMobs required?**
A: **No**. QS starts without MM and performs its gate checks as usual, but a "cast" skill degrades to a single placeholder message `[QinhSkills] skillName` — **with no real effect**. For particles / damage you need MM and a same-named skill. See [Integrating MythicMobs](../02-integration/mythicmobs-integration.md).

**Q: Is QinhItems required?**
A: No. QI provides the native `qinhskills:cast` handler so item keypresses cast skills; without QI, any plugin that can run commands (NI/MI, etc.) can use the `/qs cast` command bridge. See [Integration Overview](../02-integration/integration-overview.md).

---

## Why not just use MythicMobs

**Q: MM can cast skills on its own, so why insert a QS layer?**
A: QS handles the half MM doesn't — **unlocks, cooldowns, charges, resources, target acquisition, combos, channel cast bars, passive triggers, and level growth**. MM is responsible for "what it looks like when fired," QS for "whether it can fire, which one, and which gates it clears first." See [Core Concepts](../01-getting-started/core-concepts.md).

**Q: Where is damage configured?**
A: **Neither in QS nor in QI**. Neither QS nor QI builds in numbers; damage is settled by an attribute plugin such as **AttributePlus** on the MM side. See [Integrating MythicMobs](../02-integration/mythicmobs-integration.md).

---

## Skill doesn't work

**Q: The skill fires but only sends a `[QinhSkills] skillName` chat message?**
A: That's a placeholder stub — MM has no same-named skill. Write a same-named skill in `plugins/MythicMobs/skills/` + `/mm reload`. See [Diagnostics §2](./troubleshooting.md#2-skill-shows-only-a-placeholder-message).

**Q: The item does nothing at all when pressed?**
A: ① the skill isn't unlocked (`/qs unlock`); ② QI isn't installed / loaded late (`/qs reload`); ③ the atom doesn't match `trigger.primary`. Item by item: see [Diagnostics §3](./troubleshooting.md#3-item-does-nothing-when-pressed).

**Q: Why didn't my skill YAML edit take effect?**
A: You need `/qs reload`. Skill definitions and graphs are only re-read on reload / restart.

**Q: Why didn't my MM skill edit take effect?**
A: That's the MM side, which needs `/mm reload` (and `/qs reload` to sync the bridge if necessary).

**Q: `/qs reload` reports a schema warning?**
A: The skill fields (`trigger`/`graph`/`state`…) don't line up with the graph file. See [Diagnostics §5](./troubleshooting.md#5-schema-warnings).

---

## Cooldown / resource

**Q: I get "skill on cooldown" — what do I do?**
A: Wait out the cooldown, or lower `cooldown.base` / add `charges`. Note cooldowns persist — relogging won't refresh them. See [Result code ON_COOLDOWN](./castresult-codes.md).

**Q: I get "insufficient resource" — how does mana regen?**
A: `resource.mana` and the like are **temporary placeholders**; the resource pool will eventually be taken over by **QinhClass (QC)**. The current regen logic follows the config placeholders. See [Glossary](./glossary.md).

**Q: A charge skill is full / empty after relog?**
A: Charges are in-memory and reset on relog; only binary cooldowns persist. See [Performance and Throttling](./performance-throttling.md#-persistence-and-in-memory-state).

---

## Combo / channel / passive

**Q: The combo finisher won't fire?**
A: `finalize_skill` must be a node id within this graph, `window_ms` mustn't be too short, and follow-up nodes' `require_state` must be `COMBO_WINDOW`. See [Diagnostics §6](./troubleshooting.md#6-combo-finisher-wont-fire).

**Q: The channel keeps getting interrupted?**
A: Movement beyond `move_threshold` or taking damage interrupts it (`interrupt_on_move`/`interrupt_on_damage`). To avoid interruption by movement, turn off the matching switch. See [Cast Modes and Channeling](../03-server-guide/cast-modes-channeling.md).

**Q: Do passive skills need a `trigger.primary`?**
A: Since 1.0.16, passive (`type: passive`) skills don't — the schema handles them as PASSIVE automatically.

**Q: Passives burst-fire and flood the server?**
A: High-frequency passives (damage / jump / mining, etc.) must have a `cooldown_ms`. See [Performance and Throttling](./performance-throttling.md#-high-frequency-passives-must-be-throttled).

---

## Integrating item plugins

**Q: How do NeigeItems / MMOItems items cast QS skills?**
A: Via the **command bridge** — have the item run `/qs cast <skill>`. See [Integration Overview](../02-integration/integration-overview.md) and the example `neigeitems_skill_example.yml`.

**Q: How do QinhItems items cast QS skills?**
A: Use the native `qinhskills:cast` handler — no command bridge needed. See the example `qinhitems_action_example.yml`.

**Q: Can a skill pass parameters through to MM?**
A: Yes. The keys of `variables:` / `levels.params:` pass through as `<skill.var.xxx>`, and when there's a target it also passes `@Target`. See [Server Owner's Guide → Costs, Conditions, and Variables](../03-server-guide/cost-conditions-variables.md).

---

## Developers

**Q: How do I cast a skill programmatically / listen for a cast?**
A: Cast with `QinhSkillsAPI.castSkill(...)`, listen to `QISkillUseEvent` and read `castResult`. See [Developers → API](../04-developer/api.md).

**Q: What are `/qs test` and `/qs gen`?**
A: Internal event-chain CI / generation tools, **not publicly exposed**. Treat the 11 subcommands in [Commands and Permissions](./commands-permissions.md) as the authoritative list of usable commands.

**Q: What placeholders are there?**
A: `%qinhskills_<skill>_cooldown%` `_charges` `_ready` `_unlocked` `_toggled` `_level`, and others. See [Developers → Placeholders](../04-developer/placeholders.md).

---

## Read next

- [Glossary](./glossary.md) — Quick term reference
- [Diagnostics and Troubleshooting](./troubleshooting.md) — The troubleshooting decision tree
- [Commands and Permissions](./commands-permissions.md) — The command tree
