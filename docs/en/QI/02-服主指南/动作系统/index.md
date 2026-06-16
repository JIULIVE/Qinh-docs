# ⚡ Action System

Stats alone don't make an item interesting — you want it to *do* things: throw sparks on a left click, cast a skill on right click, chain a sneak combo into a finisher. The action system is QI's engine for these active effects and skills.

One mental model covers everything: **trigger (when) → handler (what)**. The player does something (left click, right click, sneak…) that matches a trigger, and a list of handlers then runs in order (send a message, play a sound, flash a title, run a command…). Around that core line sit three gates — cooldown, cost, and conditions — that decide whether the action *can* fire and what it *costs*.

In YAML it all lives under the item's `actions.triggers` block. Each trigger has its own `trigger` (a trigger atom or a combo sequence), optional `cooldown` / `consume` / `conditions`, and a `refs` list of handlers executed in order.

Suggested reading order: start with **Overview** to grasp the overall structure, keep **Triggers** and **Handlers** open as reference tables, copy a minimal working YAML from **Triggers Hands-on** and look up fields and pitfalls in **Handlers In-Depth**, then add the gates with **Cooldown, Cost & Conditions**.

## In this section

- 🧭 [Overview](./overview) — What an action looks like: the overall structure and YAML layout of `actions.triggers`.
- 🎯 [Triggers](./triggers) — Reference for every built-in trigger atom: clicks, sneaking, combo sequences, and more.
- 🕹️ [Triggers Hands-on](./triggers-hands-on) — One copy-and-run minimal YAML example per trigger category.
- 🧰 [Handlers](./handlers) — Reference table of every built-in handler and its payload format.
- 🔧 [Handlers In-Depth](./handlers-in-depth) — Each handler expanded: payload field meanings, writing variants, and pitfalls.
- ⏱️ [Cooldown, Cost & Conditions](./cooldown-cost-conditions) — The three gates plus combos: whether an action fires and what it costs.
