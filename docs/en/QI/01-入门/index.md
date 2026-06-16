# 📖 Getting Started

QinhItems (QI) is a **data-driven custom item engine**: a server owner describes "what an item looks like, what attributes it carries, and what effect each key triggers" in YAML or an in-game GUI, and QI compiles that description into a real Minecraft `ItemStack`, maintaining its display, attributes, actions, and binding state at runtime. This section is your first stop for getting to know QI.

By the end of this section you will have built the two mental models that matter most. The first is QI's **scope**: it does not compute combat numbers. Instead it attaches attributes to the item and hands them to AttributePlus to actually apply to the player; without AP installed you can still create items, fire actions, and show lore, only the numbers stay off the player. The second is the item's **three-layer data model**—Definition + Instance data + Layer—merged by an assembly pipeline into the final item. Grasp these two ideas and every later chapter becomes easier.

A suggested reading order: start with the Overview to learn what QI is and how it differs from MMOItems; follow Installation to set up the hard dependency QinhCoreLib and any optional soft dependencies; then use the Quick Start to build a sword by hand in YAML or through the GUI; finally let Core Concepts tie the terminology and data flow together.

## In this section

- 🧭 [Overview](./overview) — QI's one-line positioning, a concept map against MMOItems, and its three design philosophies.
- 📥 [Installation](./installation) — server and Java version requirements, the QinhCoreLib hard dependency, optional soft dependencies, and the files generated on first launch.
- 🚀 [Quick Start](./quick-start) — build an attribute-bearing, left-click-triggered, epic-quality sword using either hand-written YAML or the in-game GUI.
- 🧩 [Core Concepts](./core-concepts) — the item's three-layer data model and assembly pipeline, explaining the core terms and data flow.
