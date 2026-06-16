# 🔌 External Plugins

QinhCoreLib (QCL) was built from the start to live alongside a large set of third-party plugins. It treats every one of them as a **soft dependency**: if a plugin is installed it hooks up automatically, and if it is not, QCL silently skips it and never refuses to load over a "missing dependency". Each hook point is a **reflection bridge** — it probes the target classes at runtime and calls them on demand, so even if the other plugin changes versions or is absent entirely, QCL itself will not crash.

Once a bridge is hooked, that plugin's capabilities are "borrowed" into the whole ecosystem: its items can be pulled through QI, custom GUIs, CustomBlock drops, and the developer API using one unified reference syntax; its blocks, models, crops, and economy become reusable too. Which plugins are hooked, and how far each is supported, is recorded in a single **bridge matrix** that you can inspect after a restart with `/qcl status detail`.

This section is organized by the kind of integration: **item plugins** for pulling items, **block/model/crop plugins** for world interaction, and **economy plugins** for money. Start with the overview page to understand the shared soft-dependency and reflection-bridge rules, then jump to the category page you need.

## In this section

- 🗺️ [Overview & Bridge Matrix](./overview-bridge-matrix) — The integration design philosophy, how to confirm a bridge is hooked, and one matrix covering every plugin.
- 🎒 [Item Plugins](./item-plugins) — Reference-prefix lookup and per-plugin detail for nine item sources, all pulled via a single reference string.
- 🌳 [Blocks, Models & Crops](./blocks-models-crops) — World-interaction support for CraftEngine blocks/furniture, ModelEngine entities, and CustomCrops.
- 🏦 [Economy Plugins](./economy-plugins) — Unified hooking of Vault / ExcellentEconomy / PlayerPoints and the auto provider-selection logic.
