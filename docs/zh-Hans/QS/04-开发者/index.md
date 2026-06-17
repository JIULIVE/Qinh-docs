# 💻 开发者

本节面向**插件开发者**，讲清 QS 对外暴露的全部编程接口。一切的起点是 `QinhSkillsAPI` —— 一个 Kotlin object 单例，提供解锁/锁定、设等级/设槽、查询状态，以及程序式释放技能（`cast` / `castDetailed`）。每一次释放都会汇入唯一一条 `SkillCastPipeline` 运行时管线，并发出一个 **`QISkillUseEvent`**（由 QinhCoreLib 提供），别的插件可监听、取消、读结果。

数据出口有两路：**PlaceholderAPI 占位符**把技能等级/冷却/充能/吟唱进度等运行时状态喂给 HUD、计分板、BetterHud；**脚本 API**（`pre_js` / `post_js`）让你在释放前拦截、在释放后做副作用，引擎复用 QCL 的 GraalJS。底层则有 `SkillRuntimeProtocol` 协议层把 QS ↔ MythicMobs 的转发契约显式化，配合 `/qs protocol`、`/qs bridge` 与 debug trace 做诊断。所有玩家技能档案由 `PlayerSkillProfile` 持久化到磁盘。

建议阅读顺序：先读 **API** 拿到全貌，再看 **事件** 理解释放主链路；需要把数据接到 UI 时看 **占位符**，需要复杂门控/副作用时看 **脚本 API**；遇到技能放不出来时查 **诊断与协议**，关心档案落盘细节时读 **数据存储**。

## 本节内容

- 📘 [QinhSkillsAPI](./api) — 编程入口：解锁/设等级/设槽与程序式释放技能
- 📡 [事件 QISkillUseEvent](./events) — 技能释放主链路事件，监听 / 取消 / 读结果
- 🔣 [PlaceholderAPI 占位符](./placeholders) — 把技能运行时状态暴露给 HUD / 计分板
- 🧪 [脚本 API](./script-api) — `pre_js` 拦截、`post_js` 副作用，注入 `ctx` / `qcl`
- 🩺 [诊断与协议](./diagnostics-protocol) — `/qs protocol`、`/qs bridge` 与 debug trace 定位问题
- 🗄️ [数据存储](./data-storage) — `PlayerSkillProfile` 落盘结构与持久化 vs 内存态
