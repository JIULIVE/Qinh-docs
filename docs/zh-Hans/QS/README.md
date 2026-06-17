# QinhSkills（QS）官方文档

> **秦淮技能运行时引擎** — 为 Paper / Purpur / Spigot **1.21.11+**、**Java 25+** 打造的「技能大脑」。
>
> 当前版本：**1.0.22**　·　硬依赖：**QinhCoreLib**　·　可选后端：**MythicMobs**

---

QinhSkills（下称 **QS**）是秦淮 RPG 生态里的 **技能引擎**。它管的是一件事：**「玩家这一下按键，到底能不能放技能、放哪个技能、放之前要过哪些关」**——解锁、冷却、充能、消耗、目标索敌、连招、吟唱读条、被动触发，全在 QS 里判定。

但 QS **故意不画粒子、不算伤害、不做位移**。真正"放出来是什么样"交给 **MythicMobs（MM）** 执行，伤害数值交给 **AttributePlus** 这类属性插件结算。

> 一句话记住分工：**物品负责"按下"，QS 负责"能不能放"，MythicMobs 负责"放出来啥样"，属性插件负责"打多少伤害"。**

> 🖼️ **[图片占位]** 一张展示技能释放（按键 → actionbar 提示 → MM 火焰特效）的连续截图　·　建议 `assets/hero-skill-cast.png`

---

## 📖 这份文档怎么读

文档按**读者角色**分区。先确认你是谁，再从对应入口进入：

| 我是… | 从这里开始 | 你会学到 |
|---|---|---|
| 🆕 **第一次接触 QS** | [入门 → 概览](./01-getting-started/overview.md) → [安装](./01-getting-started/installation.md) → [5 分钟上手](./01-getting-started/quick-start.md) | QS 是什么、为什么要它、怎么造第一个能放的技能 |
| 🤔 **想搞懂"为什么不直接用 MM"** | [核心概念](./01-getting-started/core-concepts.md) · [对接 MythicMobs → 为何插一层 QS](./02-integration/mythicmobs-integration.md) | QS 插在物品和 MM 之间到底解决了什么问题 |
| 🔌 **要把技能接到物品上（QI / MI / NI）** | [对接总览](./02-integration/integration-overview.md) | 三种接法：QI 原生 handler、命令桥、任意物品插件 |
| 🛠️ **服主 / 配技能的** | [技能文件结构](./03-server-guide/skill-file-structure.md) → [技能定义全字段](./03-server-guide/skill-definition-fields.md) | YAML 写技能：触发、目标、冷却、连招、吟唱、被动… |
| 🎬 **想做连招 / 蓄力 / 开关 / 被动** | [graph 与连招](./03-server-guide/graph-combos.md) · [施法模式与吟唱](./03-server-guide/cast-modes-channeling.md) · [被动技能](./03-server-guide/passive-skills.md) | 进阶玩法逐个拆解 |
| 💻 **插件开发者** | [开发者 → API](./04-developer/api.md) | `QinhSkillsAPI`、`QISkillUseEvent`、占位符、脚本、协议 |
| 📚 **查命令 / 报错 / 占位符** | [参考 → 命令与权限](./05-reference/commands-permissions.md) · [诊断排错](./05-reference/troubleshooting.md) | 命令树、消息文案、结果码、FAQ |

不确定某个术语（如「graph」「gate」「桥 bridge」「require_state」），随时翻 [术语表](./05-reference/glossary.md)。

---

## ✨ 核心能力一览

- **统一技能运行时** — 所有技能释放（物品按键、命令、API、被动事件）都汇入同一条管线：输入归一 → 状态机 → 图解析 → 执行计划 → 门控 → 执行 → 后处理。详见 [核心概念](./01-getting-started/core-concepts.md)。
- **门控（Gate）系统** — 解锁 / 冷却 / 冷却组 / 充能 / 全局冷却(GCD) / 资源 / 生命饥饿(血祭) / 冲突组 / 声明式条件，按固定顺序逐项校验，任一不过就拦下并给提示。详见 [冷却充能GCD与冲突](./03-server-guide/cooldown-charges-gcd-conflicts.md)、[消耗条件与变量](./03-server-guide/cost-conditions-variables.md)。
- **自动索敌** — `target: NEAREST / FARTHEST / LOWEST_HP / HIGHEST_HP / RANDOM / LOOK`，配合 `filter`（仅怪 / 仅玩家…）、`range`、`require_los`，QS 选好目标作为 MM 的 `@Target` 传入。详见 [目标与索敌](./03-server-guide/targeting.md)。
- **连招（Combo）** — 在连招窗口内按出指定输入序列（如 右→右→左）触发终结技。详见 [graph 与连招](./03-server-guide/graph-combos.md)。
- **三种施法模式** — `instant` 瞬发 / `toggle` 开关 / `channel` 吟唱读条（带 bossbar/actionbar 进度、位移与受伤打断、起手或完成扣费）。详见 [施法模式与吟唱](./03-server-guide/cast-modes-channeling.md)。
- **被动技能** — 受伤 / 攻击 / 击杀 / 低血(边沿) / 潜行 / 跳跃 / 疾跑 / 挖掘 / 重生 / 坠落 / 周期(TICK) 共 11 种被动触发。详见 [被动技能](./03-server-guide/passive-skills.md)。
- **MythicMobs 执行桥** — `AUTO / API_MODE / YAML_STUB` 三种桥接模式；MM 未装也能启动、可测试；**永不覆盖你已有的同名 MM 技能**。详见 [对接 MythicMobs](./02-integration/mythicmobs-integration.md)。
- **物品插件无缝对接** — QinhItems 走原生 `qinhskills:cast` handler；NeigeItems / MMOItems / 任意能跑命令的插件走 `/qs cast` 命令桥。详见 [对接总览](./02-integration/integration-overview.md)。
- **等级成长** — `levels.N.*` 按等级覆盖冷却、消耗、参数，参数透传给 MM 做数值缩放。详见 [技能定义全字段](./03-server-guide/skill-definition-fields.md)。
- **脚本出口** — `pre_js` 拦截施放、`post_js` 施放后副作用，复用 QCL 的 GraalJS 引擎。详见 [脚本](./03-server-guide/scripting.md)、[脚本 API](./04-developer/script-api.md)。
- **可观测** — `/qs list` `/qs info` `/qs protocol` `/qs bridge` 诊断；PlaceholderAPI 占位符暴露冷却 / 充能 / 解锁 / 等级 / 吟唱进度。详见 [占位符](./04-developer/placeholders.md)。

---

## 🗺️ 完整目录

完整章节导航见左侧侧边栏，或从 [入门 → 概览](./01-getting-started/overview.md) 开始逐节阅读。

---

## ⚠️ 运行环境要求

| 项 | 要求 |
|---|---|
| 服务端 | Paper / Purpur / Spigot **1.21.11+** |
| Java | **25+** |
| 硬依赖 | **QinhCoreLib**（必须先装，否则 QS 不启用） |
| 可选软依赖 | **QinhItems**（物品触发）、**MythicMobs**（技能表现执行）、**AttributePlus**（伤害数值）、**PlaceholderAPI**（占位符） |

> 没装 MythicMobs 也能跑：QS 照常做门控判定，只是技能"放出来"会退化成一条占位消息 `[QinhSkills] 技能名`——看到它就说明 QS 这侧通了，补一个同名 MM 技能即可有真实效果。详见 [安装](./01-getting-started/installation.md)。

---

## 📌 文档约定

- 形如 `qinhskills:cast`、`target.mode`、`RIGHT_CLICK`、`SkillCastService` 的是**代码标识符 / 配置键 / 枚举值**，请原样照抄，**大小写敏感**。
- 形如 `🖼️ [图片占位]` 的段落是**留给你后续补图的位置**，已标注建议文件名（放到 `assets/` 目录）。
- 代码块里的中文是**注释 / 说明**，真正写进 YAML 的请保留键名英文。
- 技能定义文件默认相对 `plugins/QinhSkills/skills/<分类>/`，graph 文件相对 `plugins/QinhSkills/graphs/<分类>/`，MM 技能文件相对 `plugins/MythicMobs/skills/`。
- 本文档对应 QS **1.0.22**。文中标注「计划 / 内部」的能力（如 `/qs test`、`/qs gen`）当前**未对外开放命令**，请以实际可用命令为准。
