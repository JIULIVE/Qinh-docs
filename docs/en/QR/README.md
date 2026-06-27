# QinhRuins (QR) Official Documentation

> **The Qinhuai procedural realm engine** — a Roguelike ruin generation and exploration system built for Paper / Purpur / Spigot **1.21.11+** and **Java 25+**.
>
> Current version: **1.0.0**　·　Alias: **/qr**　·　Hard dependency: **QinhCoreLib**

---

QinhRuins (hereafter **QR**) lets you make structural ruins **emerge naturally** in your world **without writing a single line of code**: as players explore, they stumble upon an ancient tower, a sunken tomb, or a floating sky island — walk up, and monsters activate, mechanisms run, and chests roll loot independently for each person. Once cleared, you can even use a "keystone" to infuse it with affixes and upgrade it into an ever-escalating **realm endgame**.

QR is not a "dungeon plugin." It **does not pull players into a separate world and does not start a countdown**. The ruins **grow right inside your main world** — they are part of the world. After being cleared, a ruin fades over time, freeing up a slot for a new ruin to generate — a **living, breathing world**.

> 🖼️ **[Image placeholder]** An in-game screenshot showcasing QR ruins (a surface tower / an affix realm light pillar / a guide compass HUD)　·　suggested `assets/hero-ruin-showcase.png`

---

## 📖 How to read this documentation

The docs are organized by **reader role**. First figure out who you are, then enter from the matching starting point:

| I am… | Start here | What you'll learn |
|---|---|---|
| 🆕 **New to QR** | [Getting Started → Overview](./01-getting-started/overview.md) → [Installation](./01-getting-started/installation.md) → [5-minute quick start](./01-getting-started/quick-start.md) | What QR is, how to install it, and how to build your first naturally-generating ruin |
| 🛠️ **Server owner / configurator** | [Server Guide](./02-server-guide/server-guide-overview.md) | Templates, generation, blueprints, mechanisms, realms, affixes, loot, guides… |
| 🎮 **Want a GUI instead of hand-writing YAML** | [Visual Editor](./03-editor/editor-overview.md) | Stand inside a structure to select a region, mark spawn points / chests / cores, configure mechanisms, save a template in one click |
| 📦 **Want to turn an existing build into a ruin** | [Structure Files](./02-server-guide/structure-files.md) · [Selection and Saving](./02-server-guide/selection-save.md) | `/qr pos1/pos2/save`, `.schem` import, marker blocks |
| 🏆 **Want to build a tier endgame** | [Realms and Keystones](./02-server-guide/realms-keystones.md) · [Affix System](./02-server-guide/affixes.md) | Keystone activation, tier curves, affix pools, danger budget, reforging |
| 💻 **Plugin developer** | [Developer Docs](./04-developer/api.md) | `QinhRuinsAPI`, events, scripts, Provider bridges, placeholders |
| 📚 **Looking up commands / config keys / placeholders** | [Reference](./05-reference/commands.md) | Command tree, permissions, `config.yml`, PlaceholderAPI |
| 🩺 **Ruins won't generate / something errored** | [Diagnostics and Troubleshooting](./05-reference/troubleshooting.md) · [FAQ](./05-reference/faq.md) | `/qr why`, `/qr gentest` troubleshooting + common pitfalls |

Unsure about a term (such as "Anchor," "Template," "Placement Profile," "Blueprint," or "Realm")? Flip to the [Glossary](./05-reference/glossary.md) anytime.

---

## ✨ Core features at a glance

- **Procedural natural generation** — ruins generate by weighted lottery in new chunks or already-explored worlds, constrained by global density, minimum spacing, flatness, and biome / dimension / world filters. See [Natural Generation and Pre-generation](./02-server-guide/generation-preloading.md).
- **Generation Director** — a unified scheduler that runs the lottery competition among all ruins, refreshes a living world on a timer, and fades and regenerates cleared terrain. See [Natural Generation and Pre-generation](./02-server-guide/generation-preloading.md).
- **Terrain-blended placement** — mask paste (blends into terrain without bulldozing), foundation fill with edge feathering, marker blocks (barrier → carve-out / bedrock → terrain show-through), and frame-by-frame placement to prevent server lag. See [Structure Files](./02-server-guide/structure-files.md).
- **Blueprint gameplay layer** — overlay spawn points, staged kill objectives, unlockable reward chests, ruin cores, and programmable mechanisms onto the same structure. See [Blueprints and Objectives](./02-server-guide/blueprint-objectives.md).
- **Programmable mechanisms** — 6 triggers (redstone / interact / region / timer / stage / break) × 12 actions (fill / spawn / teleport / give item / loot / NPC…). See [Mechanism System](./02-server-guide/mechanisms.md).
- **Realm endgame** — right-click a ruin core with a keystone to infuse tiers and affixes; the higher the tier, the more dangerous and the more rewarding — with reforge gambling, purge rewards, and a keystone ladder. See [Realms and Keystones](./02-server-guide/realms-keystones.md).
- **Affix system** — five affix categories (count / level / environment / rules / loot), constrained by a danger budget, with mutually exclusive groups and command / JS-script customization. See [Affix System](./02-server-guide/affixes.md).
- **Loot system** — container loot (rolled independently per player / shared server-wide), unlockable reward chests, a purge slot machine, growth scaling, conditional grouping, and vanilla loot table overlay. See [Loot System](./02-server-guide/loot-tables.md).
- **Guides and Codex** — right-click a guide item → a compass points to the nearest ruin of that kind (HUD / particles / title); discover one and it's recorded in your codex. See [Guides and Codex](./02-server-guide/guide-codex.md).
- **Sub-structure variants** — after the main structure generates, paste weighted-random templates into slots (same body, different rooms / spires), recursively nestable. See [Procedural Generation](./02-server-guide/procedural-generation.md).
- **Procedural assembly** — a Tile Palette assembles multiple small structures into a large ruin by rules. See [Procedural Generation](./02-server-guide/procedural-generation.md).
- **In-game visual editor** — select, mark points, and configure mechanisms while standing in the world, then save it as a template in one click — never touching YAML. See [Visual Editor](./03-editor/editor-overview.md).
- **Stable API + events + scripts** — `QinhRuinsAPI`, 4 lifecycle events, JS affix scripts, Provider bridges, PlaceholderAPI. See [Developer Docs](./04-developer/api.md).

---

## 🗺️ Full table of contents

See the **sidebar on the left** for full chapter navigation, or start reading section by section from [Getting Started → Overview](./01-getting-started/overview.md).

---

## ⚠️ Runtime requirements

| Item | Requirement |
|---|---|
| Server | Paper / Purpur / Spigot **1.21.11+** (requires the native Bukkit structure API) |
| Java | **25+** |
| Hard dependency | **QinhCoreLib** (must be installed first, or QR will not enable) |
| Optional soft dependencies | MythicMobs, QinhClass / MMOCore, QinhItems / NeigeItems / MMOItems, ItemsAdder / CraftEngine / Nexo, PlaceholderAPI, Vault / ExcellentEconomy / PlayerPoints, Citizens |

> QR's backends are **auto-detected, no configuration required**: structures use native Bukkit (`.schem` is converted to `.nbt` via `/qr import`); monsters use MythicMobs or vanilla; growth / parties use QinhClass / MMOCore or a built-in fallback. Whichever soft dependency is missing, the corresponding capability degrades and the plugin starts as usual. See [Installation](./01-getting-started/installation.md).

---

## 📌 Documentation conventions

- Tokens like `qinhruins:guide_xxx`, `QinhRuinsAPI`, and `generation.director` are **code identifiers / config keys** — copy them verbatim, **case-sensitive**.
- Paragraphs like `🖼️ [Image placeholder]` are **spots left for you to add images later**, with a suggested filename noted (place it in the `assets/` directory).
- Chinese inside code blocks is **comments / explanation**; keep the actual YAML key names in English.
- All YAML paths are relative to `plugins/QinhRuins/` by default.
- Player-facing text lives in the multilingual files `lang/<language>/*.yml` (7 languages built in); see [Configuration File](./05-reference/config.md).
