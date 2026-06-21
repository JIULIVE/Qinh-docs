# QinhCoreLib（QCL）官方文档

> **秦淮生态核心底座** — 为 Paper / Purpur / Spigot **1.21.11+**、**Java 25+** 打造的统一平台库。
>
> 当前版本：**1.2.0**　·　主类：`com.qinhuai.corelib.QinhCoreLib`　·　硬依赖：**无**（它是被依赖的那个）

---

QinhCoreLib（下称 **QCL**）是整个秦淮 RPG 生态的**地基**。它本身**不直接面向玩法**——不定义物品内核、不实现技能逻辑、不算伤害——而是把所有秦淮模块（QinhItems / QinhSkills / QinhForge / QinhStrengthen / QCR…）以及一大批第三方插件**统一接到一套公共能力上**：物品源、经济、脚本、数据库、PDC、占位符、GUI、动作契约、桥接状态与诊断。

一句话：**先装 QCL，其它 Qinh 模块才能跑；同时 QCL 自己也是一套能直接用的服主工具与开发者 SDK。**

> 🖼️ **[图片占位]** 一张展示 `/qcl status` 诊断输出（平台/模块/桥接全绿）的游戏内截图　·　建议 `assets/status-overview.png`

---

## 📖 这份文档怎么读

文档按**读者角色**分区。先确认你是谁，再从对应入口进入：

| 我是… | 从这里开始 | 你会学到 |
|---|---|---|
| 🆕 **第一次接触 QCL** | [入门 → 概览](./01-getting-started/overview.md) → [安装](./01-getting-started/installation.md) → [快速上手](./01-getting-started/quick-start.md) | QCL 是什么、为什么要装、怎么验证装好了 |
| 🛠️ **服主 / 配置者** | [服主指南](./02-server-guide/config.md) | config.yml、命令权限、物品源引用、GUI、经济动作、脚本、诊断排错 |
| 🔗 **想接第三方插件** | [外部插件对接](./03-external-plugins/overview-bridge-matrix.md) | MMOItems / NeigeItems / MythicMobs / ItemsAdder / Nexo / CraftEngine / ModelEngine / 经济插件… |
| 💻 **插件开发者** | [开发者文档](./04-developer/api-overview.md) | 公开 API 包、物品/脚本/经济/动作/数据/占位符/GUI/工具集、模块扩展 |
| 🩺 **报错 / 状态异常** | [诊断与排错](./02-server-guide/diagnostics.md) · [FAQ](./05-reference/faq.md) | `/qcl status` 逐行解读、健康码、常见坑 |
| 📚 **查术语 / 速查** | [术语表](./05-reference/glossary.md) | 「模块」「桥」「物品源」「Provider」「Handler」… |

完整章节导航见 **[SUMMARY.md（目录树）](README.md)**。

---

## ✨ 核心能力一览

- **统一物品源体系** — 用一套字符串语法（`mm-龙剑`、`mi-SWORD-烈焰`、`ia-包名_物品`、`qi:神剑`、`nx-枪`…）引用 **10 种来源**的物品：原版 / QinhItems / MMOItems / NeigeItems / MythicMobs / CraftEngine / CustomFishing / MagicGem / ItemsAdder / Nexo。子插件无需改代码即可共享。详见 [物品源引用](./02-server-guide/item-source-references.md)。
- **模块化底座** — 22 个核心模块按优先级有序加载，单个模块出错只降级不拖垮全局。详见 [核心概念](./01-getting-started/core-concepts.md)。
- **诊断系统** — 一条 `/qcl status` 看清平台健康、模块状态、所有桥接、脚本/经济/数据库/PDC/API 边界。详见 [诊断与排错](./02-server-guide/diagnostics.md)。
- **自定义 GUI 引擎** — 纯 YAML 定义菜单：静态槽位 / 布局图案 / 分页 / 点击动作 / 显隐条件 / 占位符，20+ 内置动作类型、10 种条件类型。详见 [自定义 GUI](./02-server-guide/custom-gui.md)。
- **统一经济桥** — 一套 API + 一套 GUI 动作语法同时驱动 **Vault / ExcellentEconomy（多货币）/ PlayerPoints**，自动选源。详见 [经济动作](./02-server-guide/economy-actions.md)。
- **GraalJS 脚本引擎** — 服务端内嵌 JavaScript，按 `命名空间:路径.js:函数` 引用，供 GUI 条件/动作、子插件钩子共用。详见 [脚本入门](./02-server-guide/scripting-intro.md)。
- **动作 / 技能契约** — `QinhActionHandler` + `TriggerType` + `QISkillUseEvent`，是 QI 把物品触发交给 QS 释放技能的公共缝。详见 [动作与技能桥](./04-developer/actions-skill-bridge.md)。
- **开发者 SDK** — `ItemManagerAPI`、`QinhScriptApi`、`EconomyBridge`、`PdcService`、`DatabaseManager`、`PapiBridge`，外加调度 / 特效 / 物品 / 位置 / 文本 / 全息 / 版本兼容工具集。详见 [API 概览](./04-developer/api-overview.md)。
- **第三方桥接** — 13 个反射桥，全部软依赖：**没装对应插件自动跳过，绝不影响启动**。详见 [外部插件对接](./03-external-plugins/overview-bridge-matrix.md)。

---

## ⚠️ 运行环境要求

| 项 | 要求 |
|---|---|
| 服务端 | Paper / Purpur / Spigot **1.21.11+**（推荐 Paper/Purpur） |
| Java | **25+**（Purpur 26.1 需 JDK 25） |
| 硬依赖 | **无** —— QCL 是地基，应**最先**装 |
| 运行库 | Kotlin 2.3.0、GraalJS、Groovy 4（由 `plugin.yml` 的 `libraries` 自动从 Maven 拉取并缓存） |
| 可选软依赖 | Vault、ExcellentEconomy、PlayerPoints、PlaceholderAPI、ModelEngine、CustomCrops、CustomFishing、MythicMobs、NeigeItems、MMOItems、CraftEngine、QinhItems、MagicGem、ItemsAdder、Nexo |

> 纯 Spigot 不支持 `plugin.yml` 的 `libraries` 自动拉库，Kotlin/GraalJS 可能加载失败 —— **强烈建议用 Paper 或 Purpur**。详见 [安装](./01-getting-started/installation.md)。

---

## 📌 文档约定

- 形如 `qcl.status`、`ItemManagerAPI`、`economy.default-provider`、`mm-龙剑` 的是**代码标识符 / 配置键 / 引用语法**，请原样照抄，**大小写敏感**。
- 形如 `🖼️ [图片占位]` 的段落是**留给你后续补图的位置**，已标注建议文件名（放到 `assets/` 目录）。
- 代码块里的中文是**注释 / 说明**，真正写进 YAML 的请保留键名英文。
- 所有 YAML / 文件路径默认相对于 `plugins/QinhCoreLib/`。
- 本文档基于源码 **1.2.0** 撰写，与代码行为对齐；若实际版本不同，以 `/qcl status` 与控制台日志为准。
