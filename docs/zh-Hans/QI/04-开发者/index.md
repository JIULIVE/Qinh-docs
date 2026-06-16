# 💻 开发者

本节面向要**集成 QI 或扩展 QI** 的插件开发者。无论你写的是市场行情、自定义掉落、跨插件联动，还是想给动作系统加一段自己的逻辑，都从这里入手。QI 的对外能力以 `com.qinhuai.items.api.QinhItemsAPI`（Kotlin object，Java 调用带 `.INSTANCE`）为统一入口，配合一整套 Bukkit 事件、Provider 载荷与集成注册表对外开放。

读 API 时请记住 QI 的职责边界：**它管物品（定义、装配、Lore、动作、套装、绑定、宝石），不算数值、不施法**。数值交 AttributePlus，技能交 QinhSkills，物品源前缀解析在 QinhCoreLib。理解这条分工，跨模块对接才不会走错门。

扩展 QI 主要有三条路：实现**动作处理器**（`QinhActionHandler`）把分支逻辑搬进 Kotlin/Java，让 YAML 只引用它；挂**Provider 载荷**并写**桥（bridge）**让物品携带任意第三方数据而不耦合；用**层（layer）与装配管线**在物品创建后追加补丁（打孔/镶嵌/强化/词缀）。这些都通过 `QinhIntegrationRegistry` 统一注册。

建议阅读顺序：先看 **API 概览与接入**搞清依赖与入口，再按需翻 **API 完整参考**与 **API 配方集**；要响应物品生命周期就看**事件大全**与**事件监听实例**；要做对接看**生态集成**、**集成实操手册**与**跨模块对接**；从 MMOItems / NeigeItems 搬家则看**导入/导出**两篇。

## 本节内容

- 📘 [API 概览与接入](./api-overview) — 如何编译期依赖 QI、入口在哪、API 如何分层。
- 📒 [API 完整参考](./api-reference) — `QinhItemsAPI` 全部方法签名：判定、取定义、绑定、使用校验等。
- 🍳 [API 配方集](./api-recipes) — 市场上架、掉落发放等常见需求的可直接套用完整代码。
- 📡 [事件大全](./events) — QI 抛出的 Bukkit 事件逐个列触发时机、字段与可否取消。
- 🔧 [动作处理器开发](./handler-development) — 用 `QinhActionHandler` 把 if/switch 逻辑写进代码，YAML 只传 payload。
- 🌉 [Provider 与桥](./providers-bridges) — Provider 不透明载荷模型与解读它的 bridge，承载第三方数据不耦合。
- 🧱 [层与装配管线](./layers-assembly) — 层补丁机制与「模板＋实例＋层」合成 ItemStack 的装配流程。
- 👂 [事件监听实例](./event-examples) — 每个事件配一段完整可用的 Java listener 与典型用例。
- 🔗 [生态集成](./integration) — `QinhIntegrationRegistry` 架构与三大内置集成（QinhSkills / Legendinlay / MagicGem）。
- 🛠️ [集成实操手册](./integration-howto) — 逐插件从安装到联调的完整步骤（AttributePlus 等）。
- 🔀 [跨模块对接](./cross-module-integration) — QCL / QI / QS / AP 之间的数据流与职责分工。
- 🔁 [导入/导出](./import-export) — 从 MMOItems / NeigeItems 导入，及 `.qipack` 打包导出/导入。
- 📤 [导入/导出实操](./import-export-howto) — 迁移完整步骤、字段映射对照与 dry-run 解读。
