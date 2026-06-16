# QinhItems (QI) — Official Docs

> **Qinh-native item library** — a next-generation custom item engine for Paper / Purpur / Spigot **1.21.11+**, **Java 25+**.
>
> Current version: **1.1.0**　·　API version: **1**　·　Hard dependency: **QinhCoreLib**

---

QinhItems (**QI**) is the core item module of the Qinh RPG ecosystem. It lets you create complex custom items — with attributes, skill actions, sets, gem sockets, quality affixes, and soulbinding — **without writing a single line of code**, while giving developers a **clean, stable, layered** API to read, generate, and transform items.

> 🖼️ **[Image placeholder]** An in-game screenshot of a QI item (structured lore, set, gem sockets, quality prefix) · suggested `assets/hero-item-showcase.png`

---

## 📖 How to read these docs

The docs are organized **by reader role**. Find who you are, then enter from the matching door:

| I am… | Start here | You'll learn |
|---|---|---|
| 🆕 **New to QI** | [Getting Started → Overview](./01-getting-started/overview.md) → [Install](./01-getting-started/installation.md) → [Quick Start](./01-getting-started/quick-start.md) | What QI is, how to install, how to make your first item |
| 🛠️ **Server owner / configurator** | [Server Guide](./02-server-guide/item-definition.md) | YAML item config, types, quality, attributes, actions, sets, gems, binding… |
| 📦 **Want ready-made recipes** | [Item Cookbook](./02-server-guide/item-cookbook.md) | ~140 bundled example items annotated by category + ready recipes |
| 🩺 **Save / reload errored** | [Validation Quick-ref](./05-reference/validation-errors.md) · [Diagnostics](./05-reference/diagnostics.md) | Each error verbatim + cause + fix |
| ❓ **Quick answers** | [FAQ](./05-reference/faq.md) | Common-pitfall Q&A |
| 🎮 **Prefer GUI over YAML** | [Editor GUI](./03-editor-gui/overview.md) | Visually edit items, actions, sets in-game |
| 💻 **Plugin developer** | [Developer docs](./04-developer/api-overview.md) | `QinhItemsAPI`, events, action handlers, provider bridges, assembly pipeline |
| 📚 **Look up commands / config / placeholders** | [Reference](./05-reference/commands.md) | Command tree, permissions, `config.yml`, PlaceholderAPI |

Unsure about a term ("Layer", "Provider", "Section", "ICVM")? Check the [Glossary](./05-reference/glossary.md) anytime.

---

## ✨ Core features at a glance

- **Typed item system** — 40+ built-in item types (weapon / armor / ring / gem / consumable…), each declaring its own capabilities. See [Item Types](./02-server-guide/item-types.md).
- **Structured lore rendering** — quality name → type → attributes → affix section → gem sockets → skills → set → description → requirements → binding → durability, auto-laid-out in a unified order. See [Display & Lore](./02-server-guide/quality-display.md).
- **Attribute system** — add combat attributes via `providers.ap` or base values, bridged to **AttributePlus**; degrades to a pure item library without AP. See [Attributes & Numbers](./02-server-guide/attributes-numbers.md).
- **Item actions / skill triggers** — 100+ trigger atoms + built-in handlers + cooldown / cost / conditions. See [Action System](./02-server-guide/action-system/overview.md).
- **Variable engine** — item-level dynamic values, `{var}` placeholder rendering, multi-source conflict resolution. See [Variables](./02-server-guide/variables.md).
- **Quality / affixes / random generation** — MMOItems-like random item generation. See [Affixes](./02-server-guide/affixes.md) and [Random Generation](./02-server-guide/random-generation.md).
- **Set system** — set bonuses activated by worn piece count. See [Sets](./02-server-guide/sets.md).
- **Gem sockets** — dual backend (Legendinlay / MagicGem). See [Gem Sockets](./02-server-guide/gem-sockets.md).
- **Soulbinding** — bound items usable only by the owner, non-droppable / non-tradeable. See [Soulbinding](./02-server-guide/soulbinding.md).
- **In-game visual editor** — a full GUI, from browsing to per-field editing. See [Editor GUI](./03-editor-gui/overview.md).
- **Import / export** — import from MMOItems / NeigeItems; `.qipack` content packs. See [Import/Export](./04-developer/import-export.md).
- **Stable API + events** — layered facade and full lifecycle events. See [API Overview](./04-developer/api-overview.md).

---

## ⚠️ Runtime requirements

| Item | Requirement |
|---|---|
| Server | Paper / Purpur / Spigot **1.21.11+** |
| Java | **25+** |
| Hard dependency | **QinhCoreLib** (install first) |
| Optional soft deps | AttributePlus, QinhSkills, PlaceholderAPI, CraftEngine, MythicMobs, LegendCore, Legendinlay, MagicGem, ItemsAdder, Nexo |

> Runs without AttributePlus too: QI enters "pure item-library mode" — items render and actions fire, only numeric attributes aren't applied to players. See [Attributes & Numbers](./02-server-guide/attributes-numbers.md).
