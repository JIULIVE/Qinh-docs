# ⚙️ Server Guide

This section is for server owners. It explains how to **configure QinhCoreLib (QCL) and use its server-facing features**. QCL has a single main config file, `config.yml`, which controls the database, debug output, and the default economy provider; its commands live under the `/qcl` root with a matching set of permission nodes. On top of this, QCL's core capability is the **unified item-source reference**: whether an item comes from vanilla, QinhItems, CraftEngine, ItemsAdder, Nexo, or MythicMobs, you reference it with the same `source:itemID` string.

Building on references, QCL lets you create clickable custom GUIs (menus, shops, teleport hubs) **using only YAML**, with a rich set of click actions and view conditions. Three of those are economy actions (give / take / set balance) that work across Vault, PlayerPoints, and ExcellentEconomy backends. When you need more flexible logic, JavaScript scripting can add custom conditions and actions to a GUI without writing Java or packaging a plugin. There is also a custom-block abstraction layer (backed by CraftEngine, with a built-in fallback mechanism).

Suggested reading order: **start with config.yml and item-source references** (they are the foundation for everything that follows), then dig into GUIs, scripting, and economy actions as needed. When something goes wrong, `/qcl status` and the diagnostics page are your first stop.

## In this section

- 🛠️ [Config](./config) — The single main config explained key by key: database, debug, default economy provider, and whether a change needs `/qcl reload` or a restart.
- ⌨️ [Commands & Permissions](./commands-permissions) — The full `/qcl` command tree, usage examples, expected output, and permission nodes with recommended group assignments.
- 🔗 [Item-Source References](./item-source-references) — QCL's most-used feature: reference items from any source with a unified `source:itemID` syntax.
- 🖼️ [Custom GUI](./custom-gui) — Build clickable menus with YAML alone, from a minimal example to working shops and teleport hubs.
- 🎛️ [GUI Actions & Conditions](./gui-actions-conditions) — A one-page cheat sheet of every click action (type) and view condition, each with a copy-paste YAML snippet.
- 💰 [Economy Actions](./economy-actions) — The value syntax for the three economy actions give_money / take_money / set_money and the differences between backends.
- 📜 [Scripting Intro](./scripting-intro) — Use GraalJS scripts to extend GUIs and hooks with custom conditions and actions, no Java and no packaging.
- 🟦 [Custom Blocks](./custom-blocks) — The custom-block abstraction layer backed by CraftEngine, including the fallback to a normal block when placement fails.
- 🩺 [Diagnostics](./diagnostics) — Read the `/qcl status` output, the health-code table, and the troubleshooting decision tree to pinpoint ecosystem faults.
