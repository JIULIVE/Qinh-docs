# FAQ 常见问题集

> 上一页：[性能与限流](./performance-throttling.md)　·　下一页：[术语表](./glossary.md)

把各页的易错点汇成问答，按主题分组，点链接看详解。对应 QS **1.0.22**。

---

## 安装与依赖

**Q：QS 启动失败 / 没启用？**
A：多半是缺 **QinhCoreLib**（硬依赖，必须先装），或服务端 / Java 版本不够（Paper 1.21.11+、Java 25+）。见 [诊断排错 §1](./troubleshooting.md#1-qs-没启用)。

**Q：MythicMobs 必须装吗？**
A：**不必须**。没装 MM 也能启动，QS 照常做门控判定，但技能"放出来"会退化成一条占位消息 `[QinhSkills] 技能名`——**没有真实表现**。要粒子 / 伤害就得装 MM 并写同名技能。见 [对接 MythicMobs](../02-integration/mythicmobs-integration.md)。

**Q：QinhItems 必须装吗？**
A：不必须。QI 提供原生 `qinhskills:cast` handler 让物品按键放技能；没 QI 时，任意能跑命令的插件（NI/MI 等）可走 `/qs cast` 命令桥。见 [对接总览](../02-integration/integration-overview.md)。

---

## 为什么不直接用 MythicMobs

**Q：MM 自己就能放技能，为什么还要插一层 QS？**
A：QS 管的是 MM 不管的那半边——**解锁、冷却、充能、资源、目标索敌、连招、吟唱读条、被动触发、等级成长**。MM 负责"放出来啥样"，QS 负责"能不能放、放哪个、放之前过哪些关"。见 [核心概念](../01-getting-started/core-concepts.md)。

**Q：伤害在哪配？**
A：**不在 QS，也不在 QI**。QS / QI 都不内置数值，伤害由 **AttributePlus** 等属性插件在 MM 那侧结算。见 [对接 MythicMobs](../02-integration/mythicmobs-integration.md)。

---

## 技能不生效

**Q：技能放出来只有一条 `[QinhSkills] 技能名` 聊天消息？**
A：那是占位 stub——MM 里没有同名技能。去 `plugins/MythicMobs/skills/` 写同名技能 + `/mm reload`。见 [诊断排错 §2](./troubleshooting.md#2-技能只有占位消息)。

**Q：物品按了完全没反应？**
A：① 技能没解锁（`/qs unlock`）；② QI 没装 / 加载晚（`/qs reload`）；③ atom 与 `trigger.primary` 不一致。逐项见 [诊断排错 §3](./troubleshooting.md#3-物品按了没反应)。

**Q：为什么我改了技能 YAML 没生效？**
A：要 `/qs reload`。技能定义与 graph 在 reload / 重启时才重读。

**Q：为什么我改了 MM 技能没生效？**
A：那是 MM 那侧，要 `/mm reload`（必要时再 `/qs reload` 同步桥）。

**Q：`/qs reload` 报 schema 警告？**
A：技能字段（`trigger`/`graph`/`state`…）与 graph 文件对不上。见 [诊断排错 §5](./troubleshooting.md#5-schema-警告)。

---

## 冷却 / 资源

**Q：提示"技能冷却中"怎么办？**
A：等冷却，或调小 `cooldown.base` / 加 `charges`。注意冷却落盘——重登不会刷新。见 [结果码 ON_COOLDOWN](./castresult-codes.md)。

**Q：提示"资源不足"，mana 怎么回？**
A：`resource.mana` 等是 **临时占位**，资源池将来归 **QinhClass（QC）** 接管。当前回复逻辑以 config 占位为准。见 [术语表](./glossary.md)。

**Q：充能技能重登后满了 / 空了？**
A：充能是内存态，relog 重置；二元冷却才落盘。见 [性能与限流](./performance-throttling.md#-持久化与内存态)。

---

## 连招 / 吟唱 / 被动

**Q：连招终结技放不出来？**
A：`finalize_skill` 必须是本 graph 的 node id、`window_ms` 别太短、续段节点 `require_state` 要是 `COMBO_WINDOW`。见 [诊断排错 §6](./troubleshooting.md#6-连招放不出)。

**Q：吟唱（channel）总被打断？**
A：位移超 `move_threshold` 或受伤会打断（`interrupt_on_move`/`interrupt_on_damage`）。想不被位移打断就关掉对应开关。见 [施法模式与吟唱](../03-server-guide/cast-modes-channeling.md)。

**Q：被动技能不用写 `trigger.primary` 吗？**
A：1.0.16 起被动（`type: passive`）无需写，schema 自动按 PASSIVE 处理。

**Q：被动连发刷爆服务器？**
A：高频被动（受伤 / 跳跃 / 挖掘等）必须配 `cooldown_ms`。见 [性能与限流](./performance-throttling.md#-高频被动必须限流)。

---

## 对接物品插件

**Q：NeigeItems / MMOItems 的物品怎么放 QS 技能？**
A：走**命令桥**——让物品执行 `/qs cast <技能>`。见 [对接总览](../02-integration/integration-overview.md) 与示例 `neigeitems_skill_example.yml`。

**Q：QinhItems 物品怎么放 QS 技能？**
A：用原生 `qinhskills:cast` handler，无需命令桥。见示例 `qinhitems_action_example.yml`。

**Q：技能能透传参数给 MM 吗？**
A：能。`variables:` / `levels.params:` 的键透传为 `<skill.var.xxx>`，有目标时还传 `@Target`。见 [服主指南 → 消耗条件与变量](../03-server-guide/cost-conditions-variables.md)。

---

## 开发者

**Q：怎么程序化放技能 / 监听技能释放？**
A：`QinhSkillsAPI.castSkill(...)` 施放，监听 `QISkillUseEvent` 读 `castResult`。见 [开发者 → API](../04-developer/api.md)。

**Q：`/qs test`、`/qs gen` 是什么？**
A：内部事件链 CI / 生成工具，**未对外开放命令**。可用命令以 [命令与权限](./commands-permissions.md) 的 11 个子命令为准。

**Q：占位符有哪些？**
A：`%qinhskills_<skill>_cooldown%` `_charges` `_ready` `_unlocked` `_toggled` `_level` 等。见 [开发者 → 占位符](../04-developer/placeholders.md)。

---

## 继续阅读

- [术语表](./glossary.md) — 名词速查
- [诊断排错](./troubleshooting.md) — 排查决策树
- [命令与权限](./commands-permissions.md) — 命令树
