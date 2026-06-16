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
| 🆕 **New to QI** | [Getting Started → Overview](01-入门/概览.md) → [Install](01-入门/安装.md) → [Quick Start](01-入门/快速上手.md) | What QI is, how to install, how to make your first item |
| 🛠️ **Server owner / configurator** | [Server Guide](02-服主指南/物品定义.md) | YAML item config, types, quality, attributes, actions, sets, gems, binding… |
| 📦 **Want ready-made recipes** | [Item Cookbook](02-服主指南/物品示例库.md) | ~140 bundled example items annotated by category + ready recipes |
| 🩺 **Save / reload errored** | [Validation Quick-ref](05-参考/校验报错速查.md) · [Diagnostics](05-参考/诊断排错.md) | Each error verbatim + cause + fix |
| ❓ **Quick answers** | [FAQ](05-参考/FAQ.md) | Common-pitfall Q&A |
| 🎮 **Prefer GUI over YAML** | [Editor GUI](03-编辑器GUI/概览.md) | Visually edit items, actions, sets in-game |
| 💻 **Plugin developer** | [Developer docs](04-开发者/API概览.md) | `QinhItemsAPI`, events, action handlers, provider bridges, assembly pipeline |
| 📚 **Look up commands / config / placeholders** | [Reference](05-参考/命令.md) | Command tree, permissions, `config.yml`, PlaceholderAPI |

Unsure about a term ("Layer", "Provider", "Section", "ICVM")? Check the [Glossary](05-参考/术语表.md) anytime.

---

## ✨ Core features at a glance

- **Typed item system** — 40+ built-in item types (weapon / armor / ring / gem / consumable…), each declaring its own capabilities. See [Item Types](02-服主指南/物品类型.md).
- **Structured lore rendering** — quality name → type → attributes → affix section → gem sockets → skills → set → description → requirements → binding → durability, auto-laid-out in a unified order. See [Display & Lore](02-服主指南/品质与显示.md).
- **Attribute system** — add combat attributes via `providers.ap` or base values, bridged to **AttributePlus**; degrades to a pure item library without AP. See [Attributes & Numbers](02-服主指南/属性与数值.md).
- **Item actions / skill triggers** — 100+ trigger atoms + built-in handlers + cooldown / cost / conditions. See [Action System](02-服主指南/动作系统/概览.md).
- **Variable engine** — item-level dynamic values, `{var}` placeholder rendering, multi-source conflict resolution. See [Variables](02-服主指南/变量.md).
- **Quality / affixes / random generation** — MMOItems-like random item generation. See [Affixes](02-服主指南/词缀.md) and [Random Generation](02-服主指南/随机生成.md).
- **Set system** — set bonuses activated by worn piece count. See [Sets](02-服主指南/套装.md).
- **Gem sockets** — dual backend (Legendinlay / MagicGem). See [Gem Sockets](02-服主指南/宝石孔.md).
- **Soulbinding** — bound items usable only by the owner, non-droppable / non-tradeable. See [Soulbinding](02-服主指南/灵魂绑定.md).
- **In-game visual editor** — a full GUI, from browsing to per-field editing. See [Editor GUI](03-编辑器GUI/概览.md).
- **Import / export** — import from MMOItems / NeigeItems; `.qipack` content packs. See [Import/Export](04-开发者/导入导出.md).
- **Stable API + events** — layered facade and full lifecycle events. See [API Overview](04-开发者/API概览.md).

---

## ⚠️ Runtime requirements

| Item | Requirement |
|---|---|
| Server | Paper / Purpur / Spigot **1.21.11+** |
| Java | **25+** |
| Hard dependency | **QinhCoreLib** (install first) |
| Optional soft deps | AttributePlus, QinhSkills, PlaceholderAPI, CraftEngine, MythicMobs, LegendCore, Legendinlay, MagicGem, ItemsAdder, Nexo |

> Runs without AttributePlus too: QI enters "pure item-library mode" — items render and actions fire, only numeric attributes aren't applied to players. See [Attributes & Numbers](02-服主指南/属性与数值.md).
