# QinhCoreLib (QCL) Official Documentation

> **The core foundation of the Qinhuai ecosystem** — a unified platform library built for Paper / Purpur / Spigot **1.21.11+** and **Java 25+**.
>
> Current version: **1.1.0**　·　Main class: `com.qinhuai.corelib.QinhCoreLib`　·　Hard dependency: **none** (it is the one others depend on)

---

QinhCoreLib (hereafter **QCL**) is the **foundation** of the entire Qinhuai RPG ecosystem. It is **not gameplay-facing** by itself — it does not define an item core, does not implement skill logic, and does not compute damage — instead it connects all Qinhuai modules (QinhItems / QinhSkills / QinhForge / QinhStrengthen / QCR…) plus a large batch of third-party plugins onto **one common set of capabilities**: item source, economy, script, database, PDC, placeholder, GUI, action contracts, bridge state, and diagnostics.

In one sentence: **install QCL first, and only then can the other Qinh modules run; at the same time QCL is itself a ready-to-use server-owner toolkit and developer SDK.**

> 🖼️ **[Image placeholder]** An in-game screenshot showing the `/qcl status` diagnostic output (platform / modules / bridges all green)　·　suggested `assets/status-overview.png`

---

## 📖 How to read this documentation

The docs are organized by **reader role**. First decide who you are, then enter from the matching entry point:

| I am… | Start here | What you'll learn |
|---|---|---|
| 🆕 **New to QCL** | [Getting Started → Overview](01-入门/概览.md) → [Installation](01-入门/安装.md) → [Quick Start](01-入门/快速上手.md) | What QCL is, why you need to install it, and how to verify it's installed correctly |
| 🛠️ **Server owner / configurator** | [Server Owner Guide](02-服主指南/配置文件.md) | config.yml, command permissions, item source references, GUI, economy actions, scripts, diagnostics and troubleshooting |
| 🔗 **Want to integrate third-party plugins** | [External Plugin Integration](03-外部插件对接/概览.md) | MMOItems / NeigeItems / MythicMobs / ItemsAdder / Nexo / CraftEngine / ModelEngine / economy plugins… |
| 💻 **Plugin developer** | [Developer Documentation](04-开发者/API概览.md) | Public API packages, item/script/economy/action/data/placeholder/GUI/toolkit, module extensions |
| 🩺 **Errors / abnormal status** | [Diagnostics & Troubleshooting](02-服主指南/诊断与排错.md) · [FAQ](05-参考/FAQ.md) | Line-by-line reading of `/qcl status`, health codes, common pitfalls |
| 📚 **Look up terms / quick reference** | [Glossary](05-参考/术语表.md) | "module", "bridge", "item source", "Provider", "Handler"… |

For full chapter navigation, see **[SUMMARY.md (table of contents tree)](README.md)**.

---

## ✨ Core capabilities at a glance

- **Unified item source system** — Use one string syntax (`mm-龙剑`, `mi-SWORD-烈焰`, `ia-包名_物品`, `qi:神剑`, `nx-枪`…) to reference items from **10 sources**: vanilla / QinhItems / MMOItems / NeigeItems / MythicMobs / CraftEngine / CustomFishing / MagicGem / ItemsAdder / Nexo. Sub-plugins can share them without changing any code. See [Item Source References](02-服主指南/物品源引用.md).
- **Modular foundation** — 22 core modules load in priority order; a failure in a single module only degrades that module rather than dragging down the whole system. See [Core Concepts](01-入门/核心概念.md).
- **Diagnostics system** — A single `/qcl status` reveals platform health, module status, all bridges, and the script / economy / database / PDC / API boundaries. See [Diagnostics & Troubleshooting](02-服主指南/诊断与排错.md).
- **Custom GUI engine** — Define menus in pure YAML: static slots / layout patterns / pagination / click actions / show-hide conditions / placeholders, with 20+ built-in action types and 10 condition types. See [Custom GUI](02-服主指南/自定义GUI.md).
- **Unified economy bridge** — One API + one GUI action syntax drives **Vault / ExcellentEconomy (multi-currency) / PlayerPoints** simultaneously, with automatic source selection. See [Economy Actions](02-服主指南/经济动作.md).
- **GraalJS script engine** — JavaScript embedded server-side, referenced as `namespace:path.js:function`, shared by GUI conditions/actions and sub-plugin hooks. See [Script Getting Started](02-服主指南/脚本入门.md).
- **Action / skill contract** — `QinhActionHandler` + `TriggerType` + `QISkillUseEvent` is the common seam through which QI hands item triggers to QS to cast skills. See [Action & Skill Bridge](04-开发者/动作与技能桥.md).
- **Developer SDK** — `ItemManagerAPI`, `QinhScriptApi`, `EconomyBridge`, `PdcService`, `DatabaseManager`, `PapiBridge`, plus scheduling / effect / item / location / text / hologram / version-compatibility toolkits. See [API Overview](04-开发者/API概览.md).
- **Third-party bridges** — 13 reflection bridges, all soft dependencies: **if the corresponding plugin isn't installed it is skipped automatically and never affects startup**. See [External Plugin Integration](03-外部插件对接/概览.md).

---

## ⚠️ Runtime requirements

| Item | Requirement |
|---|---|
| Server | Paper / Purpur / Spigot **1.21.11+** (Paper/Purpur recommended) |
| Java | **25+** (Purpur 26.1 requires JDK 25) |
| Hard dependency | **None** — QCL is the foundation and should be installed **first** |
| Runtime libraries | Kotlin 2.3.0, GraalJS, Groovy 4 (automatically pulled from Maven and cached via the `libraries` entry in `plugin.yml`) |
| Optional soft dependencies | Vault, ExcellentEconomy, PlayerPoints, PlaceholderAPI, ModelEngine, CustomCrops, CustomFishing, MythicMobs, NeigeItems, MMOItems, CraftEngine, QinhItems, MagicGem, ItemsAdder, Nexo |

> Pure Spigot does not support automatic library pulling via the `libraries` entry in `plugin.yml`, so Kotlin/GraalJS may fail to load — **using Paper or Purpur is strongly recommended**. See [Installation](01-入门/安装.md).

---

## 📌 Documentation conventions

- Tokens of the form `qcl.status`, `ItemManagerAPI`, `economy.default-provider`, `mm-龙剑` are **code identifiers / config keys / reference syntax** — copy them verbatim, **they are case-sensitive**.
- Paragraphs of the form `🖼️ [Image placeholder]` are **spots left for you to add images later**, with a suggested filename already noted (place it in the `assets/` directory).
- Chinese text inside code blocks is **comments / explanation**; keep the key names in English for what actually gets written into YAML.
- All YAML / file paths are by default relative to `plugins/QinhCoreLib/`.
- This documentation is written against source **1.1.0** and aligned with code behavior; if your actual version differs, defer to `/qcl status` and the console log.
