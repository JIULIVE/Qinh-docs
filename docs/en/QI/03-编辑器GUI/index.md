# 🎮 Editor GUI

QI ships a complete **in-game visual editor** that lets server owners create and edit items, actions, and sets without touching a single line of YAML. The GUI saves to the very same YAML files, so hand-written and editor-authored content are fully interchangeable — edit in the menu, inspect in the file, neither side fights the other.

There is one entry command, `/qi editor` (permission `qinhitems.editor`): it opens the **type browser**, where picking a type leads to the **item browser**; right-clicking an existing item or clicking New opens the **item editor** main screen. The item editor is the hub of the whole GUI — every sub-editor (action, gem socket, attribute, set, template, resource pack) is reached from its field rows.

Different needs map to different sub-editors: wire up triggers and handlers in the **Action / Skill editor**; build multi-piece set bonuses in the **Set editor**; manage fragments, variables, and resource-pack models in the **Other editors**. Every screen uses the same 6-row, 54-slot layout with fixed button positions.

If this is your first time, read the [Workflow](./workflow) page and click through creating a weapon step by step; reach for the [Slot Reference](./slot-reference) only when you need to know exactly which slot to click.

## In this section

- 🧭 [Overview](./overview) — Editor entry command, permission, and the full navigation tree from type browser down to each sub-editor.
- 🪜 [Workflow](./workflow) — Step-by-step walkthroughs of common tasks (such as creating a weapon from scratch) you can follow click by click.
- 🖊️ [Item Editor](./item-editor) — The main screen for a single item: toggle, chat-input, and sub-editor field types and where each writes to.
- ⚡ [Action Editor](./action-editor) — Configure triggers, handlers, and payloads on an item and bind skills, all in the GUI, no hand-written triggers.
- 🎽 [Set Editor](./set-editor) — The set hub and edit screens for creating sets, binding member pieces, and arranging tiered bonuses.
- 🧩 [Other Editors](./other-editors) — The template hub, resource-pack / model hub, and the editor's session and save mechanics.
- 🔢 [Slot Reference](./slot-reference) — Precise slot maps and shared layout constants for each editor screen, for advanced troubleshooting.
