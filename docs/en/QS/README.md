# QinhSkills (QS) Official Documentation

> **The Qinhuai skill runtime engine** — a "skill brain" built for Paper / Purpur / Spigot **1.21.11+** and **Java 25+**.
>
> Current version: **1.0.22**　·　Hard dependency: **QinhCoreLib**　·　Optional backend: **MythicMobs**

---

QinhSkills (hereafter **QS**) is the **skill engine** of the Qinhuai RPG ecosystem. It handles exactly one thing: **"when the player presses a key, can a skill be cast at all, which skill, and what gates must it pass first?"** — unlocks, cooldowns, charges, costs, target acquisition, combos, channel cast bars, passive triggers — all decided inside QS.

But QS **deliberately draws no particles, computes no damage, and performs no movement**. What the skill actually "looks like when cast" is handed off to **MythicMobs (MM)** to execute, and damage values are settled by an attribute plugin such as **AttributePlus**.

> Remember the division of labor in one line: **the item handles "the press," QS handles "can it cast," MythicMobs handles "what it looks like," and the attribute plugin handles "how much damage."**

> 🖼️ **[Image placeholder]** A sequence of screenshots showing a skill cast (keypress → actionbar prompt → MM flame effect)　·　suggested `assets/hero-skill-cast.png`

---

## 📖 How to read this documentation

The docs are organized by **reader role**. First figure out who you are, then enter from the matching starting point:

| I am… | Start here | What you'll learn |
|---|---|---|
| 🆕 **New to QS** | [Getting Started → Overview](./01-getting-started/overview.md) → [Installation](./01-getting-started/installation.md) → [5-minute quick start](./01-getting-started/quick-start.md) | What QS is, why you need it, and how to build your first castable skill |
| 🤔 **Wondering "why not just use MM"** | [Core Concepts](./01-getting-started/core-concepts.md) · [Integrating MythicMobs → why insert a QS layer](./02-integration/mythicmobs-integration.md) | What problem QS actually solves by sitting between items and MM |
| 🔌 **Want to wire skills to items (QI / MI / NI)** | [Integration Overview](./02-integration/integration-overview.md) | Three approaches: QI native handler, command bridge, any item plugin |
| 🛠️ **Server owner / skill author** | [Skill File Structure](./03-server-guide/skill-file-structure.md) → [Full Skill Definition Fields](./03-server-guide/skill-definition-fields.md) | Writing skills in YAML: triggers, targets, cooldowns, combos, channeling, passives… |
| 🎬 **Want combos / charge-up / toggles / passives** | [Graphs and Combos](./03-server-guide/graph-combos.md) · [Cast Modes and Channeling](./03-server-guide/cast-modes-channeling.md) · [Passive Skills](./03-server-guide/passive-skills.md) | Advanced gameplay broken down one by one |
| 💻 **Plugin developer** | [Developer → API](./04-developer/api.md) | `QinhSkillsAPI`, `QISkillUseEvent`, placeholders, scripts, protocol |
| 📚 **Looking up commands / errors / placeholders** | [Reference → Commands and Permissions](./05-reference/commands-permissions.md) · [Diagnostics and Troubleshooting](./05-reference/troubleshooting.md) | Command tree, message text, result codes, FAQ |

Unsure about a term (such as "graph," "gate," "bridge," or "require_state")? Flip to the [Glossary](./05-reference/glossary.md) anytime.

---

## ✨ Core capabilities at a glance

- **Unified skill runtime** — every skill cast (item keypress, command, API, passive event) flows into the same pipeline: input normalization → state machine → graph resolution → execution plan → gate → execution → post-processing. See [Core Concepts](./01-getting-started/core-concepts.md).
- **Gate system** — unlock / cooldown / cooldown group / charges / global cooldown (GCD) / resource / health-and-hunger (blood sacrifice) / conflict group / declarative conditions, checked in a fixed order one by one; any failure stops the cast and shows a prompt. See [Cooldown, Charges, GCD, and Conflicts](./03-server-guide/cooldown-charges-gcd-conflicts.md) and [Costs, Conditions, and Variables](./03-server-guide/cost-conditions-variables.md).
- **Automatic targeting** — `target: NEAREST / FARTHEST / LOWEST_HP / HIGHEST_HP / RANDOM / LOOK`, combined with `filter` (monsters only / players only…), `range`, and `require_los`; QS picks the target and passes it to MM as `@Target`. See [Targets and Acquisition](./03-server-guide/targeting.md).
- **Combos** — press a specified input sequence (e.g. right → right → left) within the combo window to trigger a finisher. See [Graphs and Combos](./03-server-guide/graph-combos.md).
- **Three cast modes** — `instant` / `toggle` / `channel` cast bar (with bossbar/actionbar progress, movement and damage interruption, cost charged on start or on completion). See [Cast Modes and Channeling](./03-server-guide/cast-modes-channeling.md).
- **Passive skills** — 11 passive triggers in total: on-damaged / attack / kill / low-health (edge) / sneak / jump / sprint / mine / respawn / fall / periodic (TICK). See [Passive Skills](./03-server-guide/passive-skills.md).
- **MythicMobs execution bridge** — three bridge modes `AUTO / API_MODE / YAML_STUB`; starts and is testable even when MM is absent; **never overrides an existing MM skill of the same name**. See [Integrating MythicMobs](./02-integration/mythicmobs-integration.md).
- **Seamless item-plugin integration** — QinhItems uses the native `qinhskills:cast` handler; NeigeItems / MMOItems / any command-capable plugin uses the `/qs cast` command bridge. See [Integration Overview](./02-integration/integration-overview.md).
- **Level progression** — `levels.N.*` overrides cooldown, cost, and parameters by level, with parameters passed through to MM for value scaling. See [Full Skill Definition Fields](./03-server-guide/skill-definition-fields.md).
- **Script hooks** — `pre_js` intercepts a cast, `post_js` handles post-cast side effects, reusing QCL's GraalJS engine. See [Scripts](./03-server-guide/scripting.md) and [Script API](./04-developer/script-api.md).
- **Observability** — `/qs list` `/qs info` `/qs protocol` `/qs bridge` diagnostics; PlaceholderAPI placeholders expose cooldown / charges / unlock / level / channel progress. See [Placeholders](./04-developer/placeholders.md).

---

## 🗺️ Full table of contents

See the sidebar on the left for full chapter navigation, or start reading section by section from [Getting Started → Overview](./01-getting-started/overview.md).

---

## ⚠️ Runtime requirements

| Item | Requirement |
|---|---|
| Server | Paper / Purpur / Spigot **1.21.11+** |
| Java | **25+** |
| Hard dependency | **QinhCoreLib** (must be installed first, or QS will not enable) |
| Optional soft dependencies | **QinhItems** (item triggers), **MythicMobs** (skill presentation/execution), **AttributePlus** (damage values), **PlaceholderAPI** (placeholders) |

> Runs even without MythicMobs: QS still performs all gate checks, the skill "cast" just degrades to a placeholder message `[QinhSkills] <skill name>` — seeing it means the QS side is working; add an MM skill of the same name to get real effects. See [Installation](./01-getting-started/installation.md).

---

## 📌 Documentation conventions

- Tokens like `qinhskills:cast`, `target.mode`, `RIGHT_CLICK`, and `SkillCastService` are **code identifiers / config keys / enum values** — copy them verbatim, **case-sensitive**.
- Paragraphs like `🖼️ [Image placeholder]` are **spots left for you to add images later**, with a suggested filename noted (place it in the `assets/` directory).
- Chinese inside code blocks is **comments / explanation**; keep the actual YAML key names in English.
- Skill definition files default to `plugins/QinhSkills/skills/<category>/`, graph files to `plugins/QinhSkills/graphs/<category>/`, and MM skill files to `plugins/MythicMobs/skills/`.
- This documentation corresponds to QS **1.0.22**. Capabilities marked "planned / internal" (such as `/qs test`, `/qs gen`) are **not currently exposed as commands** — defer to the actually available commands.
