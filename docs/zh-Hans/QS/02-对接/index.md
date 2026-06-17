# 🔌 对接：把技能接到物品与 MythicMobs

QS 自己**不监听按键、不画粒子、不算伤害**——它是夹在「物品输入」和「MythicMobs 执行」之间的一颗「技能大脑」。所以「对接」这一章是整套体系最关键的一节：它回答两件事——**怎么把按键/用物品/点 NPC 变成「放某个 QS 技能」**，以及**技能放出来后怎么才有粒子、位移、伤害**。

把技能接到物品上有三条路：**① QinhItems 原生 handler**（`handler: qinhskills:cast`，功能最全，能带 JSON payload）、**② 命令桥**（任意能跑 `qs cast` 的插件都能用）、以及**③ MythicMobs 执行后端**（所有人都要配的表现层）。① 和 ② 是二选一的「触发入口」，③ 是人人都要的「表现」——无论你用哪种触发，最后都得在 MM 里写一个同名技能。

理解全章的前提，是一条**四方分工铁律**：**物品负责「按下」，QS 负责「能不能放」，MythicMobs 负责「放出来啥样」，属性插件（AttributePlus）负责「打多少伤害」**，各管一段、互不抢权。建议阅读顺序：先读「对接总览」掌握全局与决策表；新手再读「对接 MythicMobs」开篇的「为何不直接调 MM」理解架构动机；然后按你的物品插件挑触发接法；最后用「执行链路与事件」搞懂全链路、学会诊断。

## 本节内容

- 🗺️ [对接总览：三种接法](./integration-overview) — 四方分工铁律、三种触发接法、依赖降级表与「我用 X 插件该看哪页」决策表。
- ⚔️ [对接 QinhItems（原生 handler）](./qinhitems-integration) — 用 `handler: qinhskills:cast` 在 QI 物品里按键放技能，含展开写法、atom 对应与完整范本。
- 🐲 [对接 MythicMobs（执行后端）](./mythicmobs-integration) — 讲透「为何插一层 QS」+ 教你在 MM 里写技能表现（粒子/伤害/目标/变量）。
- 🎒 [对接其他物品插件](./other-item-plugins) — 用命令桥 `qs cast` 让 NeigeItems / MMOItems / NPC / GUI 等任意插件触发技能。
- 🔗 [执行链路与事件](./cast-flow-events) — 从按键到 MM 的完整链路、`QISkillUseEvent` 等事件，以及出问题时的诊断思路。
