# Frequently Asked Questions (FAQ)

> Navigation: [Documentation Home](../README.md) · [Table of Contents](../README.md) · [Installation](../01-getting-started/installation.md) · [Diagnostic Codes](./diagnostic-codes.md) · [Glossary](./glossary.md) · [Module System](../04-developer/module-system.md)

This page collects the most common questions encountered while using QinhCoreLib (QCL). Each entry gives a concise answer and points to the relevant page.

## 🧭 Table of Contents

- [Installation & Environment](#-installation--environment)
- [Diagnostics & Status](#-diagnostics--status)
- [Item Sources](#-item-sources)
- [Economy](#-economy)
- [GUI & Scripts](#-gui--scripts)
- [Configuration & Operations](#-configuration--operations)
- [Developers](#-developers)

---

## 🚀 Installation & Environment

### 1. What do I need to install before QCL?

**Nothing needs to be installed first.** QCL is a foundational library; its core functionality does not strongly depend on any external plugin. CraftEngine, MMOItems, NeigeItems, MythicMobs, ItemsAdder, Nexo, economy, PAPI, etc., are all **soft dependencies**: install one and the corresponding bridge is enabled; leave it out and it is skipped. You only need to meet the runtime environment (see the next entries). Conversely, the Qinh-series gameplay plugins (QI/QS/QF/QSt/QCR) **must install QCL first**. See [Installation](../01-getting-started/installation.md).

### 2. Is plain Spigot okay?

**Strongly discouraged.** QCL's Kotlin / GraalJS / Groovy runtime libraries are pulled automatically from Maven via the `libraries` section of `plugin.yml`, and **plain Spigot does not support this mechanism**, which causes Kotlin/GraalJS to fail to load. Please use **Paper or Purpur**. See [Installation](../01-getting-started/installation.md).

### 3. What are the Java version requirements?

`ServerCompat.validateJava` requires **Java ≥ 25** (Purpur 26.1 needs JDK 25). Versions below this are blocked at startup validation and the plugin is disabled. See [Toolkit · ServerCompat](../04-developer/toolkit.md).

### 4. What are the Minecraft version requirements?

`ServerCompat.validateMinecraftVersion` requires **Minecraft ≥ 1.21.11**. See [Installation](../01-getting-started/installation.md).

### 5. Is QCL resource-heavy?

QCL itself is a base layer with very small resident overhead: modules load on demand, bridges only work when the corresponding plugin is present, and scripts/GUIs are all event-driven. The real overhead depends on **how much GUI auto-refresh you use and how complex your scripts are**. Just increase the GUI `update-interval` and avoid heavy loops in scripts. See [Custom GUI](../02-server-guide/custom-gui.md).

---

## 🩺 Diagnostics & Status

### 6. `/qcl status` shows `NO_HOOK` everywhere — is that normal?

**Yes, it is normal.** It means you have not installed any external plugin to hook into, so all bridges are skipped by design and core functionality is unaffected. Just install the corresponding soft dependency when you need a particular capability. See [Diagnostic Codes](./diagnostic-codes.md).

### 7. A bridge shows "unavailable / NO_HOOK" — did something go wrong?

No. `NO_HOOK` = the corresponding **soft dependency is not installed**, so the bridge is skipped by design — a normal graceful degradation. Only `DEGRADED` (installed but running impaired, recoverable) requires attention. Use `/qcl status detail` to see the `message`/`suggestion`. See [Diagnostics & Troubleshooting](../02-server-guide/diagnostics.md).

### 8. What is the difference between "enabled" and "available"?

There are two layers of status: **enabled** is determined by the `modules.*` switch + whether loading succeeded; **available** is determined by whether the corresponding soft dependency is installed and whether it is ready at runtime. A bridge can be "enabled but unavailable" (switch is on but the plugin is not installed). See [Diagnostic Codes · Two-Layer Status](./diagnostic-codes.md).

### 9. What are the extra lines at the end of `/qcl status detail`?

Those are the **custom diagnostic extension lines** output by the script `global:qcl_status.js:formatStatus`. You can edit that script to append your own probes/statistics to the status panel. See [Scripting Basics](../02-server-guide/scripting-intro.md).

---

## 📦 Item Sources

### 10. An item reference fails — how do I investigate?

Locate the cause by the returned item resolution code: `MATERIAL_NOT_FOUND` (wrong vanilla material name), `SOURCE_NOT_FOUND` (item source not hooked / plugin not installed), `ITEM_NOT_FOUND` (no such ID in that source), `MODULE_BUILD_FAILED` (build failed), `PARSE_FAILED` (malformed reference string). Developers can use `ItemManagerAPI.diagnose(ref, player)` to get the detailed reason. See [Diagnostic Codes](./diagnostic-codes.md), [Item Source References](../02-server-guide/item-source-references.md).

### 11. How do I write ItemsAdder / Nexo item references?

- ItemsAdder: `ia-namespace_id` or `itemsadder:namespace:id`
- Nexo: `nexo-id` or `nexo:id`

Both are reflection bridges and are automatically skipped when the corresponding plugin is not installed. This capability is available since **1.1.0**. See [Changelog](./changelog.md), [Item Source References](../02-server-guide/item-source-references.md).

### 12. Why does an MMOItems reference need a "type"?

Because MMOItems items are located by "type + ID" together (e.g., `烈焰剑` under the `SWORD` type). So the reference is written as `mi-type-itemid`, e.g., `mi-SWORD-烈焰剑`, which is internally converted to `type:itemid` and handed to MMOItems. See [Item Plugins](../03-external-plugins/item-plugins.md).

### 13. What is the significance of underscores and colons in CraftEngine / ItemsAdder references?

References for these two sources are "namespace + id". You can write `ce-namespace_id` (underscore) or `ce-namespace:id` (colon) — QCL automatically converts the **first underscore** into a colon before handing it to the plugin. The two forms are equivalent. See [Item Plugins](../03-external-plugins/item-plugins.md).

### 14. What is `::{...}` in an item reference?

Whatever follows `::` is the **JSON parameters** appended to the item source, used by sources that support parameters such as NeigeItems, e.g., `ni-blade::{"品质":"传说"}`. Ordinary references do not need it. See [Item Source References](../02-server-guide/item-source-references.md).

### 15. I want to add my own item source (to hook a plugin QCL does not bundle). How?

Write a **Groovy external item module**, place it in `plugins/QinhCoreLib/item-modules/`, implement the `ItemModule` interface, and register the alias in `onGroovyRegister()` — no need to modify QCL. The repository includes `OraxenModule.groovy.example` / `RPGItemsModule.groovy.example` for reference. See [Item API](../04-developer/item-api.md).

---

## 💰 Economy

### 16. What happens if no economy / PAPI is installed?

No error occurs. The corresponding bridge is skipped in a degraded manner (`NO_HOOK`). Economy calls return `NO_PROVIDER` / `ECONOMY_PROVIDER_MISSING`; placeholders degrade safely when PAPI is absent (returned as-is). Just install them when needed. See [Diagnostic Codes](./diagnostic-codes.md).

### 17. An external plugin (e.g., EE) reports "currency required" — what do I do?

This is the economy code `CURRENCY_REQUIRED` / `ECONOMY_CURRENCY_MISSING`: ExcellentEconomy is a multi-currency system and a currency must be specified. Set a default currency in `economy.default-currency`, or write `excellenteconomy:currency:amount` explicitly at the action/call site. See [Economy Actions](../02-server-guide/economy-actions.md).

### 18. I have both Vault and ExcellentEconomy installed — which is used?

It is determined by `economy.default-provider`. When set to `auto`: **if a currency is specified, ExcellentEconomy is preferred; otherwise Vault > ExcellentEconomy > PlayerPoints**, taking the first available one. You can also fix it to `vault` / `ee` / `pp`. See [Economy Plugins](../03-external-plugins/economy-plugins.md).

### 19. How do I read the GUI economy action format `give_money:vault:100`?

The format is `[provider:][currency:]amount [| failure message]`. `vault:100` = give 100 via Vault; `excellenteconomy:gold:50` = give 50 of EE's gold currency; `100 | Insufficient balance` = give 100, and on failure show "Insufficient balance". See [Economy Actions](../02-server-guide/economy-actions.md).

---

## 🖼️ GUI & Scripts

### 20. The GUI won't open / can't be found?

Open it with `/qcl gui <id>` (requires the `qcl.gui` permission). Confirm: the GUI file is under `plugins/QinhCoreLib/guis/`, the ID (YAML top-level key) is spelled correctly, you ran `/qcl reload` after editing, and the player has permission. If it cannot be found, it shows "GUI not found: id". See [Custom GUI](../02-server-guide/custom-gui.md).

### 21. The placeholder `{player}` in the GUI doesn't work?

Confirm the placeholder name is spelled correctly (case-sensitive). `{xxx}` is a QCL built-in placeholder; only `%xxx%` goes through PlaceholderAPI (requires PAPI). See the full built-in placeholder table at [Custom GUI · Placeholders](../02-server-guide/custom-gui.md).

### 22. The script bridge shows unavailable / scripts don't execute — what do I do?

The script engine is based on GraalVM. `SCRIPT_UNAVAILABLE` usually means plain Spigot did not pull the GraalJS library (switch to Paper/Purpur) or `javascript.enabled=false`. Other codes: `SCRIPT_PARSE_FAILED` (malformed reference format), `SCRIPT_NOT_FOUND` (file does not exist), `SCRIPT_FUNCTION_MISSING` (missing function), `SCRIPT_FAILED` (runtime error — enable `javascript.debug.print-stacktrace` to see the stack trace). See [Scripting Basics](../02-server-guide/scripting-intro.md).

### 23. How do I operate the economy / give a player items in a script?

Use the injected `qcl` object: `qcl.economyHas/Withdraw/Deposit(amount, provider?, currency?)`, `qcl.itemGive(reference, count)`, `qcl.itemParse(reference)`. Get the player from `ctx.player()`. See [Scripting Basics](../02-server-guide/scripting-intro.md), [Script API](../04-developer/script-api.md).

### 24. Can the segments of a script reference `namespace:path.js:function` be omitted?

Yes. Omit the function name → uses `javascript.default-function` (default `main`); omit the namespace → defaults to `global`; omit the `.js` suffix → it is auto-completed. For example, `example.js` is equivalent to `global:example.js:main`. See [Scripting Basics](../02-server-guide/scripting-intro.md).

---

## 🔧 Configuration & Operations

### 25. After changing the config, is `/qcl reload` enough, or do I need to restart?

Most configs (economy, javascript, GUI, external item modules) can be hot-reloaded with `/qcl reload` (alias `rl`, requires `qcl.admin`). However, changes involving the startup phase — such as **database switching (database.*), module toggles (modules.*), and changes to soft dependency load order** — are recommended to do with a **full restart**. See [Commands & Permissions](../02-server-guide/commands-permissions.md).

### 26. How do I disable a module?

In the `modules.*` section of `config.yml`, set the corresponding key to `false` (e.g., `hologram: false`). A disabled module will not load. Note that disabling a module that has dependents (such as `item`) will knock out item sources and related capabilities as well; restart after editing. See [Configuration File](../02-server-guide/config.md), [Module System](../04-developer/module-system.md).

### 27. Should the database use sqlite or mysql?

`database.type` can be `sqlite` or `mysql`. For single/small servers use `sqlite` (data lives in `plugins/QinhCoreLib/data/`, maintenance-free); for multi-server sharing or large servers use `mysql` (configure `database.mysql.*`). See [Configuration File](../02-server-guide/config.md), [Data Storage & Placeholders](../04-developer/data-placeholders.md).

### 28. How do I enable debug logging?

Set `debug.enabled` to `true` in `config.yml`; `debug.prefix` can customize the log prefix. For scripts there is additionally `javascript.debug.print-stacktrace`. See [Configuration File](../02-server-guide/config.md).

---

## 👨‍💻 Developers

### 29. How does a sub-plugin integrate with QCL?

In `plugin.yml`, list QinhCoreLib under `depend` (hard dependency) or `softdepend`, then **use your own plugin main class** to call QCL's public API in `onEnable` (`ItemManagerAPI`, `EconomyBridge`, `QinhScriptBridge`, `PdcServiceManager`, `PapiBridge`, `DatabaseManager`). Generally you **do not need** to cram functionality into a QCL module. **Depend only on public packages; do not touch internal packages.** See [API Overview](../04-developer/api-overview.md).

### 30. Why do I get a `LinkageError` when scheduling from Kotlin?

Because passing a bare Kotlin lambda via SAM conversion to QCL's `Runnable`/`Supplier` parameters can trigger a `LinkageError` across plugin class loaders. Please wrap it explicitly as `Runnable { ... }` / `Supplier { ... }`. See [Toolkit · Global Conventions](../04-developer/toolkit.md).

### 31. Can I use MiniMessage in text?

Yes. `TextUtil.toComponent` supports MiniMessage tags (`<red>`, `<bold>`), legacy `&` color codes, and `§` codes simultaneously. See [Toolkit · TextUtil](../04-developer/toolkit.md).

### 32. What do I use to store custom data on items / entities?

Use the PDC read/write wrapped by `PdcService` (`PdcServiceManager.get(namespace)`); keys are automatically named `qinhcorelib:namespace_keyname`. It supports String/Int/Long/Double/Boolean and generics. See [Data Storage & Placeholders](../04-developer/data-placeholders.md).

---

## Continue Reading

- [Diagnostic Codes](./diagnostic-codes.md) — Code tables for each subsystem and handling suggestions
- [Glossary](./glossary.md) — Term explanations
- [Diagnostics & Troubleshooting](../02-server-guide/diagnostics.md) — Interpreting `/qcl status` and a troubleshooting decision tree
- [Module System](../04-developer/module-system.md) — Modules and the degradation mechanism
- [Documentation Home](../README.md) · [Table of Contents](../README.md)
