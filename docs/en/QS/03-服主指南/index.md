# 📦 Server Guide

This section is the **QinhSkills skill-authoring guide** — it teaches you to build a skill from scratch to fully configured using YAML. Each skill consists of two files: the **skill definition** under `skills/` (what the skill "is": trigger key, cooldown, target, cost, levels) and the **graph execution graph** under `graphs/` (how the skill "flows": key routing, combos, which MythicMobs skill to bind). Understanding this `skills/` vs `graphs/` split is the first step to configuring skills.

No programming background required — just edit the bundled examples. Suggested reading order: start with **File Structure** to grasp the directories and naming → then work through the **all-fields reference** to fill out a skill field by field → to build multi-stage skills, read **graph & combos**, **Triggers**, and **Passive Skills** → for advanced gating see **Target & Targeting**, **Cooldown / Charges / GCD**, and **Cast Modes & Channeling** → for costs and logic see **Cost / Conditions / Variables** and **Scripting** → finally, tune global defaults with **config.yml**.

Each page stands on its own — while configuring a skill, just jump to the relevant section whenever you get stuck.

## In this section

- 🗂️ [Skill File Structure](./skill-file-structure) — one skill = two YAML files; directory categories, naming rules, the reload loop
- 📝 [Skill Definition: All Fields](./skill-definition-fields) — field-by-field reference for the skill definition file, with alias priority and worked examples
- 🔀 [graph & combos](./graph-combos) — the graph execution graph, entry nodes, trigger-key routing, and multi-stage combo orchestration
- 🎯 [Triggers](./triggers) — primary trigger key types and trigger sources (item / key slot / command / API)
- 🛡️ [Passive Skills](./passive-skills) — the 11 passive triggers (on damaged / attack / kill / low health / periodic…) and rate limiting
- 🔭 [Target & Targeting](./targeting) — targeting modes, range, filters, line-of-sight locking, and passing @Target
- ⏱️ [Cooldown / Charges / GCD / Conflicts](./cooldown-charges-gcd-conflicts) — binary cooldown vs charges, cooldown groups, the global cooldown, and conflict groups
- 🪄 [Cast Modes & Channeling](./cast-modes-channeling) — instant / toggle / channeled cast bar and interrupt mechanics
- 💧 [Cost / Conditions / Variables](./cost-conditions-variables) — resource / blood-sacrifice costs, declarative cast conditions, and MM variable passthrough
- 📜 [Scripting (pre_js / post_js)](./scripting) — JS script hooks for pre-cast interception and post-cast side effects
- ⚙️ [config.yml Full Configuration](./config) — full reference for global defaults and toggles
