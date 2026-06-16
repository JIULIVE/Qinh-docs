# 💻 Developer

QinhCoreLib (QCL) is the foundation library of the whole Qinh ecosystem, and this section covers its entire developer-facing API surface. Everything here follows one principle: **depend only on the public API packages, never couple to internal implementation**. QCL exposes its capabilities as facades — items, scripting, economy, the action system and skill bridge, the condition and expression engine, data storage and placeholders, GUI programming, and a pluggable module system. Sub-plugins and external scripts program against these unified entry points instead of touching internal classes.

By subsystem: the item API offers unified item lookup and item module registration; the script API is the built-in GraalJS script bridge; the economy API flattens backends such as Vault and PlayerPoints into a single call surface; the action system and skill bridge are the contract layer for module developers, defining the seam from trigger to skill execution; the condition and expression engine decides whether an action runs and computes its numbers; data storage and placeholders provide three persistence capabilities — PDC, database, and PlaceholderAPI; the GUI programming API lets you open and render interfaces from code; the toolkit is a set of ready-to-use utilities; and the module system governs the registration, loading, and graceful degradation of it all.

Suggested reading order: **start with API Overview**, to understand the public API boundary, dependency declaration, and the entry point of each facade, then go deeper into whichever subsystem your task touches. If you are building a new module to plug into the Qinh ecosystem, focus on the Actions & Skill Bridge and Module System pages.

## In this section

- 📘 [API Overview](./api-overview) — The main entry point for integrating with QCL: the public API boundary (apiJar), dependency declaration, and each facade entry.
- 📦 [Item API](./item-api) — Unified item lookup via ItemManagerAPI, item module registration, and reading/writing item PDC metadata.
- 📜 [Script API](./script-api) — The built-in GraalJS script bridge QinhScriptBridge: execute scripts from the host and pass values both ways.
- 💰 [Economy API](./economy-api) — EconomyBridge flattens Vault / ExcellentEconomy / PlayerPoints backends into one unified call surface.
- 🌉 [Actions & Skill Bridge](./actions-skill-bridge) — The ActionSystem execution framework and the QinhActionHandler skill bridge contract, the integration layer for module developers.
- 🧮 [Conditions & Expressions](./conditions-expressions) — The ConditionSystem boolean framework and the exp4j-based ExpressionEngine for numeric expressions.
- 🗄️ [Data & Placeholders](./data-placeholders) — The three persistence and lookup capabilities: PdcService, DatabaseManager, and PapiBridge.
- 🖥️ [GUI API](./gui-api) — Open, render, and populate interfaces from code with CustomGuiManager.
- 🧰 [Toolkit](./toolkit) — Ready-to-use utilities from the util package: scheduling, effects, text, coordinates, and server compatibility.
- 🧩 [Module System](./module-system) — The unified module lifecycle, priority loading, health reporting, and degradation isolation provided by ModuleManager.
