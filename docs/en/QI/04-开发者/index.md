# 💻 Developer

This section is for plugin developers who want to **integrate with QI or extend it**. Whether you are building a marketplace, custom drops, cross-plugin interplay, or adding your own logic to the action system, start here. QI exposes its capabilities through a single entry point, `com.qinhuai.items.api.QinhItemsAPI` (a Kotlin object; call with `.INSTANCE` from Java), backed by a full set of Bukkit events, Provider payloads, and an integration registry.

When reading the API, keep QI's responsibility boundary in mind: **it owns items (definitions, assembly, lore, actions, sets, soulbinding, gems); it does not compute stats or cast skills.** Stats go to AttributePlus, skills go to QinhSkills, and item-source prefix resolution lives in QinhCoreLib. Understanding this split keeps your cross-module integration pointed at the right door.

There are three main ways to extend QI: implement an **action handler** (`QinhActionHandler`) to move branching logic into Kotlin/Java so the YAML merely references it; attach a **Provider payload** and write a **bridge** so items can carry arbitrary third-party data without coupling; and use **layers and the assembly pipeline** to patch an item after creation (sockets / inlays / forging / affixes). All of these are registered through `QinhIntegrationRegistry`.

Suggested reading order: start with **API Overview** for dependency setup and entry points, then dip into the **API Reference** and **API Recipes** as needed; for reacting to the item lifecycle read **Events** and **Event Examples**; for hooking things up read **Integration**, the **Integration Howto**, and **Cross-module Integration**; and to migrate from MMOItems / NeigeItems read the two **Import/Export** pages.

## In this section

- 📘 [API Overview](./api-overview) — How to depend on QI at compile time, where the entry point is, how the API is layered.
- 📒 [API Reference](./api-reference) — Every `QinhItemsAPI` method signature: checks, definition lookup, soulbinding, use validation.
- 🍳 [API Recipes](./api-recipes) — Drop-in complete code for common needs like marketplace listing and drop delivery.
- 📡 [Events](./events) — Each Bukkit event QI fires, with trigger timing, fields, and cancellability.
- 🔧 [Handler Development](./handler-development) — Use `QinhActionHandler` to put if/switch logic in code while YAML just passes a payload.
- 🌉 [Providers & Bridges](./providers-bridges) — The opaque Provider payload model and the bridge that reads it, carrying third-party data without coupling.
- 🧱 [Layers & Assembly](./layers-assembly) — The layer patch mechanism and the "template + instance + layers" pipeline that builds the ItemStack.
- 👂 [Event Examples](./event-examples) — A complete, usable Java listener and typical use case for each event.
- 🔗 [Integration](./integration) — The `QinhIntegrationRegistry` architecture and the three built-in integrations (QinhSkills / Legendinlay / MagicGem).
- 🛠️ [Integration Howto](./integration-howto) — Per-plugin steps from install to verification (AttributePlus and more).
- 🔀 [Cross-module Integration](./cross-module-integration) — Data flow and responsibility split across QCL / QI / QS / AP.
- 🔁 [Import & Export](./import-export) — Importing from MMOItems / NeigeItems, plus `.qipack` export/import.
- 📤 [Import/Export Howto](./import-export-howto) — Full migration steps, field-mapping tables, and reading dry-run output.
