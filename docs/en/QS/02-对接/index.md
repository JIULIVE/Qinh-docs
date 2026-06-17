# 🔌 Integration: Wiring Skills to Items and MythicMobs

QS itself **listens to no keypress, draws no particle, and computes no damage** — it is a "skill brain" sandwiched between "item input" and "MythicMobs execution." That makes this Integration chapter the most important section of the whole system: it answers two things — **how a keypress / item use / NPC click turns into "cast a particular QS skill,"** and **how a skill, once fired, gets particles, movement, and damage**.

There are three paths to wire a skill onto an item: **① the QinhItems native handler** (`handler: qinhskills:cast`, most full-featured, can carry a JSON payload), **② the command bridge** (usable by any plugin that can run `qs cast`), and **③ the MythicMobs execution backend** (the presentation layer everyone must configure). ① and ② are mutually exclusive "trigger entry points," while ③ is the "presentation" everyone needs — whichever trigger you use, you must ultimately write a same-named skill in MM.

The prerequisite for the whole chapter is one **four-way division-of-labor iron rule**: **the item handles "the press," QS handles "whether it can fire," MythicMobs handles "what it looks like when it fires," and the attribute plugin (AttributePlus) handles "how much damage it deals"** — each owning one segment, none stealing another's authority. Suggested reading order: start with the Integration Overview for the big picture and decision tables; if you're new, read the "why not call MM directly" opening of Integrating MythicMobs to understand the architectural motivation; then pick a trigger approach based on your item plugin; finally use Execution chain and events to understand the full chain and learn to diagnose.

## In this section

- 🗺️ [Integration Overview: three approaches](./integration-overview) — The four-way division-of-labor iron rule, the three trigger approaches, the dependency-degradation table, and the "which page should I read for plugin X" decision table.
- ⚔️ [Integrating QinhItems (native handler)](./qinhitems-integration) — Use `handler: qinhskills:cast` to cast skills on keypress in QI items, with the expanded form, atom mappings, and a complete template.
- 🐲 [Integrating MythicMobs (execution backend)](./mythicmobs-integration) — Explains thoroughly "why insert a QS layer" + teaches you to write skill presentation in MM (particles / damage / target / variables).
- 🎒 [Integrating other item plugins](./other-item-plugins) — Use the command bridge `qs cast` to trigger skills from any plugin: NeigeItems / MMOItems / NPC / GUI, and more.
- 🔗 [Execution chain and events](./cast-flow-events) — The full chain from keypress to MM, events such as `QISkillUseEvent`, and how to diagnose problems when they arise.
