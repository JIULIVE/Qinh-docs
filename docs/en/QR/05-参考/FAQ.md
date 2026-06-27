# FAQ

> In: [Reference](./commands.md)　·　Related: [Diagnostics & Troubleshooting](./troubleshooting.md) · [Glossary](./glossary.md)　·　Back: [Home](../README.md)

Frequently asked questions scattered across the docs, gathered into one Q&A. Grouped by topic; click the links for full explanations.

---

## Positioning and gameplay

**Q: Is QR a dungeon plugin?**
A: **No.** QR doesn't pull players into a separate world or start a countdown. Ruins **grow right inside your main world** and are part of it; after clearing, they regen over time and free slots for new ruins — a "living, breathing world." It's a **procedural Roguelike ruin engine**, not the "enter instance — countdown — settle up" dungeon formula. See [Overview](../01-getting-started/overview.md) and [Core Concepts](../01-getting-started/core-concepts.md).

**Q: Is a realm a new world?**
A: **No.** A realm (Realm) is a cleared **ruin** injected with "tier + affixes" into an empowered state — still the **same ruin in place** — only with mobs respawned, rules rewritten, and output upgraded; no new dimension, no teleport. See [Realms & Keystones](../02-server-guide/realms-keystones.md).

**Q: Do ruins disappear after clearing?**
A: Configurable. A cleared (`CLEARED`) ruin, after more than `director.regen-hours` hours and with no one nearby, has the director **snapshot-restore the terrain**, recycle the anchor, and free a density slot for new ruins. `regen-hours: 0` = never regen (treat it as a permanent landmark). **Actually restoring blocks also requires `cleanup.snapshot-restore` on** (only what was snapshotted at generation can be restored). See [Natural Generation & Preloading §4](../02-server-guide/generation-preloading.md).

---

## Dependencies and graceful degradation

**Q: Can I use it without MythicMobs?**
A: **Yes.** Without MM, spawning degrades to **vanilla mobs** (blueprint spawn points use vanilla entity names like `ZOMBIE`); `mm-<name>` prefixed mobs require MM. Affixes' "mobs get stronger" `mob-level-bonus` also relies on MM to supply a level for scaling, so without MM that category's level bonus is ineffective, but quantity / environment / loot affixes work as usual. QR's backend auto-detects and degrades for whichever soft dependency is missing, and the plugin still starts. See [Installation](../01-getting-started/installation.md).

**Q: What must I install?**
A: The only hard dependency is **QinhCoreLib** (must be installed first, or QR won't enable). Server: Paper / Purpur / Spigot **1.21.11+**, Java **25+**. Everything else (MythicMobs, QI / NeigeItems, ItemsAdder / CraftEngine / Nexo, PlaceholderAPI, Vault / an economy plugin, Citizens, etc.) is an optional soft dependency; the corresponding capability degrades when missing.

---

## Turning an existing build into a ruin

**Q: How do I turn an existing build / `.schem` into a ruin?**
A: Two routes:
- **Box-select and save**: stand in the build and box-select with `/qr pos1` / `/qr pos2`, then `/qr save <id>` to save as a template (the structure is saved as native `.nbt`).
- **Import a .schem**: put the WorldEdit `.schem` into `plugins/QinhRuins/schematics/` and run `/qr import <file> <id>` to convert it to a `.nbt` template (QR uses Bukkit native structures, so the server needs no FAWE).

Then give the template a `generation` (where it generates) and an optional `blueprint.yml` (spawns / chests / cores), and it becomes a naturally generating ruin. You can also do it all through the [Visual Editor](../03-editor/editor-overview.md) without touching YAML. See [Structure Files](../02-server-guide/structure-files.md) and [Selection & Saving](../02-server-guide/selection-save.md).

**Q: How do I blend a structure into the terrain without bulldozing it?**
A: The template's `structure.target-mask` (masked paste, placing only at specified blocks) + marker blocks (barrier → carve out, bedrock → terrain shows through) + foundation fill. See [Structure Files](../02-server-guide/structure-files.md).

---

## Generation and performance

**Q: Will ruins keep generating and lag the server?**
A: It won't get out of control. Three guardrails: ① **a global density cap** (`director.density.max-per-region` + `min-spacing`) limits ruins per unit area; ② **regen** (`regen-hours` + `snapshot-restore`) makes cleared ruins periodically restore and free slots; ③ **frame-spread throttling** (`generation.max-millis-per-tick` per-tick millisecond budget + candidate queue), yielding the tick when placement times out, no server freeze. See [Natural Generation & Preloading](../02-server-guide/generation-preloading.md).

**Q: Which plugin should I use to pre-generate the world?**
A: We recommend **[Chunky](https://modrinth.com/plugin/chunky)** (free, lightweight, mainstream, natively Paper-compatible). Common flow: `/chunky world <world>` → `/chunky center 0 0` → `/chunky radius <radius>` → `/chunky start`.

::: warning Note
**Pre-generation being very laggy and slow is normal** — the lag comes from the server frantically generating **vanilla terrain chunks** (Chunky at work), **not QR**. Be sure to:
- **Announce in advance**, and schedule it for a low-population window (such as the small hours);
- **Warn players that the resource world is "about to close / reset"** so everyone can move their belongings out and avoid property loss;
- **On weak hardware, lower the radius and run in batches** — start with `radius 1000~2000` to check load, then increase once it holds; don't open with `radius 10000` and max out the server;
- During pre-generation you can temporarily lighten QR's load, and once it's done, `/qr scatter` to seed ruins into the generated area in one go.

For the full anti-lag checklist and recommended order, see ➜ **[Natural Generation & Preloading §7 World Pre-generation (Chunky) and Anti-lag Tips ⚠️ Must Read](../02-server-guide/generation-preloading.md)**. For startup / pre-generation lag troubleshooting, see [Troubleshooting §8](./troubleshooting.md).
:::

---

## Giving items to players

**Q: How do I give a keystone to a player?**
A: `/qr keystone give <tier> [player]` (`tier` is 1~`realm.tiers.max`, omit player = yourself). Keystones can also drop on clearing (with the ladder: a chance to drop one tier higher). See [Realms & Keystones](../02-server-guide/realms-keystones.md).

**Q: How do I give a guide item to a player?**
A: The guide item is **granted by an item source** — reference `qinhruins:guide_<templateId>` and hand it out via QI / a loot table / a command item plugin. QR **ships no give command**. A player right-clicks the guide item → the compass points to the nearest ruin of the same type; `/qr guide cancel` cancels and returns it. See [Guide & Codex](../02-server-guide/guide-codex.md).

---

## Cross-server and data

**Q: How do I share the codex cross-server?**
A: Point the **QinhCoreLib of multiple servers at the same MySQL**. QR's player codex discoveries can go to the database (shared cross-server), while the rest of the instance and runtime state (anchors, chest claim records, etc.), bound to specific world coordinates, still stays local. See [Data Storage](../04-developer/data-storage.md) and [Guide & Codex](../02-server-guide/guide-codex.md).

---

## Still not solved?

1. Ruins won't generate / errors → [Diagnostics & Troubleshooting](./troubleshooting.md) (`/qr why`, `/qr gentest`, `/qr profile`)
2. Don't understand a term → [Glossary](./glossary.md)
3. Commands / config → [Command Reference](./commands.md) · [Full config.yml Reference](./config.md)

---

## Next

- [Diagnostics & Troubleshooting](./troubleshooting.md)
- [Glossary](./glossary.md)
- [Command Reference](./commands.md)
