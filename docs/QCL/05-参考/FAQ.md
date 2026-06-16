# 常见问答（FAQ）

> 导航：[文档首页](../README.md) · [目录](../README.md) · [安装](../01-入门/安装.md) · [诊断码](诊断码.md) · [术语表](术语表.md) · [模块系统](../04-开发者/模块系统.md)

本页汇总 QinhCoreLib（QCL）使用中的高频问题。每条给出简明答案并指向相关页面。

## 🧭 目录

- [安装与环境](#-安装与环境)
- [诊断与状态](#-诊断与状态)
- [物品源](#-物品源)
- [经济](#-经济)
- [GUI 与脚本](#-gui-与脚本)
- [配置与运维](#-配置与运维)
- [开发者](#-开发者)

---

## 🚀 安装与环境

### 1. 安装 QCL 前要先装什么？

**什么都不用先装。** QCL 是基础库，核心功能不强依赖任何外部插件。CraftEngine、MMOItems、NeigeItems、MythicMobs、ItemsAdder、Nexo、经济、PAPI 等都是**软依赖**：装了就启用对应桥，不装就跳过。只要满足运行环境（见下条）即可。反过来，秦淮系玩法插件（QI/QS/QF/QSt/QCR）**必须先装 QCL**。详见 [安装](../01-入门/安装.md)。

### 2. 纯 Spigot 行不行？

**强烈不建议。** QCL 的 Kotlin / GraalJS / Groovy 运行库靠 `plugin.yml` 的 `libraries` 段从 Maven 自动拉取，而**纯 Spigot 不支持这个机制**，会导致 Kotlin/GraalJS 加载失败。请用 **Paper 或 Purpur**。详见 [安装](../01-入门/安装.md)。

### 3. Java 版本要求？

`ServerCompat.validateJava` 要求 **Java ≥ 25**（Purpur 26.1 需 JDK 25）。低于此版本会在启动校验时被拦截并禁用插件。详见 [工具集 · ServerCompat](../04-开发者/工具集.md)。

### 4. Minecraft 版本要求？

`ServerCompat.validateMinecraftVersion` 要求 **Minecraft ≥ 1.21.11**。详见 [安装](../01-入门/安装.md)。

### 5. QCL 会不会很吃资源？

QCL 本身是底座，常驻开销很小：模块按需加载、桥只在对应插件存在时才工作、脚本/GUI 都是事件驱动。真正的开销取决于你**用了多少 GUI 自动刷新、多复杂的脚本**。把 GUI 的 `update-interval` 调大、避免脚本里写重循环即可。详见 [自定义 GUI](../02-服主指南/自定义GUI.md)。

---

## 🩺 诊断与状态

### 6. `/qcl status` 全是 `NO_HOOK`，正常吗？

**正常。** 说明你没装任何可对接的外部插件，所有桥都按设计跳过，核心功能不受影响。需要某项能力时再装对应软依赖即可。详见 [诊断码](诊断码.md)。

### 7. 某个桥显示「不可用 / NO_HOOK」，是出错了吗？

不是。`NO_HOOK` = 对应**软依赖未安装**，桥按设计跳过，属正常降级。只有 `DEGRADED`（装了但运行受损、可恢复）才需要关注。用 `/qcl status detail` 看 `message`/`suggestion`。详见 [诊断与排错](../02-服主指南/诊断与排错.md)。

### 8. 「启用」和「可用」有什么区别？

两层状态：**启用（enabled）** 由 `modules.*` 开关 + 加载是否成功决定；**可用（available）** 由对应软依赖是否安装、运行时是否就绪决定。一个桥可以「启用但不可用」（开关开着但插件没装）。详见 [诊断码 · 两层状态](诊断码.md)。

### 9. `/qcl status detail` 末尾多出来几行是什么？

那是脚本 `global:qcl_status.js:formatStatus` 输出的**自定义诊断扩展行**。你可以编辑该脚本，把自己的探测/统计追加进状态面板。详见 [脚本入门](../02-服主指南/脚本入门.md)。

---

## 📦 物品源

### 10. 某个物品引用失败，怎么查？

看返回的物品解析码定位：`MATERIAL_NOT_FOUND`（原版材质名错）、`SOURCE_NOT_FOUND`（物品源未挂钩/插件没装）、`ITEM_NOT_FOUND`（该源中无此 ID）、`MODULE_BUILD_FAILED`（构建失败）、`PARSE_FAILED`（引用串格式错）。开发者可用 `ItemManagerAPI.diagnose(ref, player)` 拿到详细原因。详见 [诊断码](诊断码.md)、[物品源引用](../02-服主指南/物品源引用.md)。

### 11. ItemsAdder / Nexo 物品引用怎么写？

- ItemsAdder：`ia-命名空间_id` 或 `itemsadder:命名空间:id`
- Nexo：`nexo-id` 或 `nexo:id`

均为反射桥，未装对应插件时自动跳过。该能力自 **1.1.0** 起提供。详见 [更新日志](更新日志.md)、[物品源引用](../02-服主指南/物品源引用.md)。

### 12. MMOItems 引用为什么要带「类型」？

因为 MMOItems 的物品由「类型 + ID」共同定位（如 `SWORD` 类型下的 `烈焰剑`）。所以引用写 `mi-类型-物品id`，例 `mi-SWORD-烈焰剑`，内部会转成 `类型:物品id` 交给 MMOItems。详见 [物品类插件](../03-外部插件对接/物品类插件.md)。

### 13. CraftEngine / ItemsAdder 引用里的下划线和冒号有什么讲究？

这两个源的引用是「命名空间 + id」。你可以写 `ce-命名空间_id`（下划线）或 `ce-命名空间:id`（冒号）——QCL 会把**第一个下划线**自动转成冒号再交给插件。两种写法等价。详见 [物品类插件](../03-外部插件对接/物品类插件.md)。

### 14. 物品引用里的 `::{...}` 是什么？

`::` 之后是追加给物品源的 **JSON 参数**，用于 NeigeItems 等支持参数的源，例 `ni-blade::{"品质":"传说"}`。普通引用不需要它。详见 [物品源引用](../02-服主指南/物品源引用.md)。

### 15. 想自己加一个物品源（接个 QCL 没内置的插件）怎么办？

写一个 **Groovy 外部物品模块**放进 `plugins/QinhCoreLib/item-modules/`，实现 `ItemModule` 接口并在 `onGroovyRegister()` 里注册别名即可，无需改 QCL。仓库自带 `OraxenModule.groovy.example` / `RPGItemsModule.groovy.example` 可参考。详见 [物品 API](../04-开发者/物品API.md)。

---

## 💰 经济

### 16. 没装经济 / PAPI 会怎样？

不会报错。对应桥以降级方式跳过（`NO_HOOK`）。经济调用会返回 `NO_PROVIDER` / `ECONOMY_PROVIDER_MISSING`；占位符在没有 PAPI 时安全降级（原样返回）。需要时再装即可。详见 [诊断码](诊断码.md)。

### 17. 外部插件（如 EE）报「需要 currency」怎么办？

这是经济码 `CURRENCY_REQUIRED` / `ECONOMY_CURRENCY_MISSING`：ExcellentEconomy 是多货币系统，必须指定货币。在 `economy.default-currency` 设好默认货币，或在动作/调用处显式写 `excellenteconomy:货币:金额`。详见 [经济动作](../02-服主指南/经济动作.md)。

### 18. 同时装了 Vault 和 ExcellentEconomy，用哪个？

由 `economy.default-provider` 决定。设 `auto` 时：**指定了货币优先 ExcellentEconomy，否则 Vault > ExcellentEconomy > PlayerPoints**，取第一个可用的。也可固定为 `vault` / `ee` / `pp`。详见 [经济插件](../03-外部插件对接/经济插件.md)。

### 19. GUI 经济动作 `give_money:vault:100` 这种格式怎么读？

格式是 `[provider:][currency:]金额 [| 失败提示]`。`vault:100` = 用 Vault 给 100；`excellenteconomy:gold:50` = 用 EE 的 gold 货币给 50；`100 | 余额不足` = 给 100，失败时提示「余额不足」。详见 [经济动作](../02-服主指南/经济动作.md)。

---

## 🖼️ GUI 与脚本

### 20. GUI 打不开 / 找不到？

用 `/qcl gui <id>`（需 `qcl.gui` 权限）打开。确认：GUI 文件在 `plugins/QinhCoreLib/guis/` 下、ID（YAML 顶层 key）拼写正确、改完跑了 `/qcl reload`、玩家有权限。找不到会提示「找不到GUI: id」。详见 [自定义 GUI](../02-服主指南/自定义GUI.md)。

### 21. GUI 里的占位符 `{player}` 不生效？

确认占位符名拼写正确（区分大小写）。`{xxx}` 是 QCL 内置占位符；`%xxx%` 才走 PlaceholderAPI（需装 PAPI）。完整内置占位符表见 [自定义 GUI · 占位符](../02-服主指南/自定义GUI.md)。

### 22. 脚本桥显示不可用 / 脚本不执行怎么办？

脚本引擎基于 GraalVM。`SCRIPT_UNAVAILABLE` 通常是纯 Spigot 没拉到 GraalJS 库（换 Paper/Purpur）或 `javascript.enabled=false`。其它码：`SCRIPT_PARSE_FAILED`（引用格式错）、`SCRIPT_NOT_FOUND`（文件不存在）、`SCRIPT_FUNCTION_MISSING`（缺函数）、`SCRIPT_FAILED`（运行报错，开 `javascript.debug.print-stacktrace` 看堆栈）。详见 [脚本入门](../02-服主指南/脚本入门.md)。

### 23. 脚本里怎么操作经济 / 给玩家物品？

用注入的 `qcl` 对象：`qcl.economyHas/Withdraw/Deposit(金额, provider?, currency?)`、`qcl.itemGive(引用, 数量)`、`qcl.itemParse(引用)`。玩家从 `ctx.player()` 拿。详见 [脚本入门](../02-服主指南/脚本入门.md)、[脚本 API](../04-开发者/脚本API.md)。

### 24. 脚本引用 `命名空间:路径.js:函数` 各段能省吗？

能。省函数名→用 `javascript.default-function`（默认 `main`）；省命名空间→默认 `global`；省 `.js` 后缀→自动补。例 `example.js` 等价于 `global:example.js:main`。详见 [脚本入门](../02-服主指南/脚本入门.md)。

---

## 🔧 配置与运维

### 25. 改了配置，`/qcl reload` 够不够，还是要重启？

多数配置（economy、javascript、GUI、外部物品模块）可用 `/qcl reload`（别名 `rl`，需 `qcl.admin`）热重载。但**数据库切换（database.*）、模块开关（modules.*）、软依赖加载顺序变更**这类涉及启动期的改动建议**完整重启**。详见 [命令与权限](../02-服主指南/命令与权限.md)。

### 26. 怎么禁用某个模块？

在 `config.yml` 的 `modules.*` 段把对应键设为 `false`（如 `hologram: false`）。被关的模块不会加载。注意禁用有依赖关系的模块（如 `item`）会连带影响物品源等能力，改完需重启。详见 [配置文件](../02-服主指南/配置文件.md)、[模块系统](../04-开发者/模块系统.md)。

### 27. 数据库用 sqlite 还是 mysql？

`database.type` 可选 `sqlite` 或 `mysql`。单机/小型服用 `sqlite`（数据在 `plugins/QinhCoreLib/data/`，免运维）；多服共享或大型服用 `mysql`（配 `database.mysql.*`）。详见 [配置文件](../02-服主指南/配置文件.md)、[数据存储与占位符](../04-开发者/数据存储与占位符.md)。

### 28. 调试日志怎么开？

`config.yml` 的 `debug.enabled` 设 `true`，`debug.prefix` 可自定义日志前缀。脚本相关另有 `javascript.debug.print-stacktrace`。详见 [配置文件](../02-服主指南/配置文件.md)。

---

## 👨‍💻 开发者

### 29. 子插件如何接入 QCL？

`plugin.yml` 里把 QinhCoreLib 写进 `depend`（硬依赖）或 `softdepend`，然后**用你自己的插件主类**在 `onEnable` 里调用 QCL 的公开 API（`ItemManagerAPI`、`EconomyBridge`、`QinhScriptBridge`、`PdcServiceManager`、`PapiBridge`、`DatabaseManager`）。一般**不必**把功能塞进 QCL 模块。**只依赖公开包，别碰内部包。** 详见 [API 概览](../04-开发者/API概览.md)。

### 30. 从 Kotlin 调度时为什么报 `LinkageError`？

因为把裸 Kotlin lambda 经 SAM 转换传给 QCL 的 `Runnable`/`Supplier` 形参，跨插件类加载可能触发 `LinkageError`。请显式包成 `Runnable { ... }` / `Supplier { ... }`。详见 [工具集 · 全局约定](../04-开发者/工具集.md)。

### 31. 文本里能用 MiniMessage 吗？

能。`TextUtil.toComponent` 同时支持 MiniMessage 标签（`<red>`、`<bold>`）、旧版 `&` 颜色码和 `§` 码。详见 [工具集 · TextUtil](../04-开发者/工具集.md)。

### 32. 想给物品 / 实体存自定义数据用什么？

用 `PdcService`（`PdcServiceManager.get(命名空间)`）封装的 PDC 读写，key 自动命名为 `qinhcorelib:命名空间_键名`。支持 String/Int/Long/Double/Boolean 及泛型。详见 [数据存储与占位符](../04-开发者/数据存储与占位符.md)。

---

## 继续阅读

- [诊断码](诊断码.md) — 各子系统码表与处理建议
- [术语表](术语表.md) — 名词解释
- [诊断与排错](../02-服主指南/诊断与排错.md) — `/qcl status` 解读与排查决策树
- [模块系统](../04-开发者/模块系统.md) — 模块与降级机制
- [文档首页](../README.md) · [目录](../README.md)
