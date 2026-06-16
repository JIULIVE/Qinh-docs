# 💻 开发者

QinhCoreLib（QCL）是整个秦淮生态的地基库，本节就是它面向开发者的全部 API 表面。这里所有内容都围绕一条原则展开：**只依赖公开 API 包，绝不耦合内部实现**。QCL 把各项能力做成一个个门面（facade），物品、脚本、经济、动作系统与技能桥、条件与表达式引擎、数据存储与占位符、GUI 编程，再到可插拔的模块系统，子插件与外部脚本都对着这些统一入口编程，而不是去碰内部类。

按子系统看：物品 API 提供统一取物与物品模块注册；脚本 API 是内置 GraalJS 脚本桥；经济 API 把 Vault / PlayerPoints 等后端抹平成一套调用；动作系统与技能桥是模块开发者的契约层，定义触发到技能执行的那道缝；条件与表达式引擎决定动作「做不做」并算出数值；数据存储与占位符给出 PDC、数据库与 PlaceholderAPI 三块持久化能力；GUI 编程 API 让你用代码打开和渲染界面；工具集是开箱即用的通用轮子；模块系统则统管这一切的注册、加载与降级。

建议的阅读顺序：**先读 API 概览与接入**，搞清公开 API 边界、依赖声明与各门面入口，再按你要做的事深入对应子系统。如果你在写一个想接入秦淮生态的新模块，重点看动作系统与技能桥、模块系统两页。

## 本节内容

- 📘 [API 概览与接入](./api-overview) — 开发者接入 QCL 的总入口：公开 API 包边界（apiJar）、依赖声明与各门面入口。
- 📦 [物品 API](./item-api) — 用 ItemManagerAPI 统一取物、注册物品模块、读写物品 PDC 元数据。
- 📜 [脚本 API](./script-api) — 内置 GraalJS 脚本桥 QinhScriptBridge：从宿主执行脚本并双向传值。
- 💰 [经济 API](./economy-api) — EconomyBridge 把 Vault / ExcellentEconomy / PlayerPoints 等后端抹平成统一调用。
- 🌉 [动作系统与技能桥](./actions-skill-bridge) — ActionSystem 动作执行框架与 QinhActionHandler 技能桥契约，模块开发者的接入层。
- 🧮 [条件与表达式引擎](./conditions-expressions) — ConditionSystem 布尔判断框架与基于 exp4j 的 ExpressionEngine 数值表达式引擎。
- 🗄️ [数据存储与占位符](./data-placeholders) — PdcService、DatabaseManager 与 PapiBridge 三块持久化与取数能力。
- 🖥️ [GUI 编程 API](./gui-api) — 用 CustomGuiManager 以代码方式打开、渲染界面与填充数据。
- 🧰 [工具集](./toolkit) — util 包提供的调度、特效、文本、坐标、服务端兼容等开箱即用工具。
- 🧩 [模块系统与扩展](./module-system) — ModuleManager 统一的模块生命周期、优先级加载、健康上报与降级隔离。
