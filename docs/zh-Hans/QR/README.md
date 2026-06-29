![QinhRuins](/img/qr/logo.png)

# QinhRuins（QR）官方文档

> **秦淮程序化秘境引擎** — 为 Paper / Purpur / Spigot **1.21.11+**、**Java 25+** 打造的 Roguelike 遗迹生成与探索系统。
>
> 当前版本：**1.1.0**　·　别名：**/qr**　·　硬依赖：**QinhCoreLib**

---

QinhRuins（下称 **QR**）让你**不写一行代码**，就能在世界里**自然冒出**结构遗迹：玩家四处探索时撞见一座古塔、一处沉没墓室、一座天空浮岛——走近，怪物激活、机关运转、宝箱按人独立滚奖，打通后还能用「钥石」把它注入词缀、升成层层加码的**秘境 endgame**。

QR 不是「副本插件」。它**不把玩家拉进独立世界、不开倒计时**。遗迹就**长在你的主世界里**，是世界的一部分；通关后会随时间消退、腾出名额让新遗迹生成——一个**活的、会呼吸的世界**。

> 🖼️ **[图片占位]** 一张展示 QR 遗迹（地表古塔 / 词缀秘境光柱 / 指引罗盘 HUD）的游戏内截图　·　建议 `assets/hero-ruin-showcase.png`

---

## 📖 这份文档怎么读

文档按**读者角色**分区。先确认你是谁，再从对应入口进入：

| 我是… | 从这里开始 | 你会学到 |
|---|---|---|
| 🆕 **第一次接触 QR** | [入门 → 概览](./01-getting-started/overview.md) → [安装](./01-getting-started/installation.md) → [5 分钟上手](./01-getting-started/quick-start.md) | QR 是什么、怎么装、怎么造第一座会自然生成的遗迹 |
| 🛠️ **服主 / 配置者** | [服主指南](./02-server-guide/server-guide-overview.md) | 模板、生成、蓝图、机关、秘境、词缀、战利品、向导… |
| 🎮 **想用 GUI 而不是手写 YAML** | [可视化编辑器](./03-editor/editor-overview.md) | 站在结构里框选、标刷怪点 / 宝箱 / 核心、配机关，一键存模板 |
| 📦 **想把已有建筑变成遗迹** | [结构文件](./02-server-guide/structure-files.md) · [选区与保存](./02-server-guide/selection-save.md) | `/qr pos1/pos2/save`、`.schem` 导入、标记块 |
| 🏆 **想做层数 endgame** | [秘境与钥石](./02-server-guide/realms-keystones.md) · [词缀系统](./02-server-guide/affixes.md) | 钥石激活、层数曲线、词缀池、危险预算、重铸 |
| 💻 **插件开发者** | [开发者文档](./04-developer/api.md) | `QinhRuinsAPI`、事件、脚本、Provider 桥、占位符 |
| 📚 **查命令 / 配置项 / 占位符** | [参考手册](./05-reference/commands.md) | 命令树、权限、`config.yml`、PlaceholderAPI |
| 🩺 **遗迹不生成 / 报错了** | [诊断排错](./05-reference/troubleshooting.md) · [FAQ](./05-reference/faq.md) | `/qr why`、`/qr gentest` 排查 + 常见坑 |

不确定某个术语（如「锚点 Anchor」「模板 Template」「放置档案 Profile」「蓝图 Blueprint」「秘境 Realm」），随时翻 [术语表](./05-reference/glossary.md)。

---

## ✨ 核心特性一览

- **程序化自然生成** — 遗迹在新区块或已探索世界里按权重抽签生成，受全局密度、最小间距、平整度、群系 / 维度 / 世界过滤约束。详见 [自然生成与预加载](./02-server-guide/generation-preloading.md)。
- **生成总控** — 统一调度所有遗迹竞争抽签、活世界定时刷新、打通后地形消退再生。详见 [自然生成与预加载](./02-server-guide/generation-preloading.md)。
- **地形融合放置** — 掩码粘贴（融进地形不推土）、地基填充与边缘渐变、标记块（屏障→镂空 / 基岩→地形透出）、分帧放置防卡服。详见 [结构文件](./02-server-guide/structure-files.md)。
- **蓝图玩法层** — 同一座结构上叠刷怪点、分阶段击杀目标、解锁式奖励箱、遗迹核心、可编程机关。详见 [蓝图与目标](./02-server-guide/blueprint-objectives.md)。
- **可编程机关** — 6 种触发器（红石 / 交互 / 区域 / 计时 / 阶段 / 破坏）× 12 种动作（填充 / 刷怪 / 传送 / 给物 / 战利品 / NPC…）。详见 [机关系统](./02-server-guide/mechanisms.md)。
- **秘境 endgame** — 钥石右键遗迹核心，注入层数与词缀，越高层越危险也越肥；带重铸赌博、净化奖励、钥石天梯。详见 [秘境与钥石](./02-server-guide/realms-keystones.md)。
- **词缀系统** — 数量 / 等级 / 环境 / 规则 / 战利品五类词缀，危险预算约束、互斥分组、命令 / JS 脚本自定义。详见 [词缀系统](./02-server-guide/affixes.md)。
- **战利品系统** — 容器战利品（每人独立滚 / 全服共享）、解锁式奖励箱、净化老虎机、成长度缩放、条件分组、原版战利品表叠加。详见 [战利品系统](./02-server-guide/loot-tables.md)。
- **向导与图鉴** — 指引物右键 → 罗盘指向最近同类遗迹（HUD / 粒子 / 标题），发现即记图鉴。详见 [向导与图鉴](./02-server-guide/guide-codex.md)。
- **子结构变体** — 主结构生成后在槽位贴加权随机模板（同主体不同房 / 塔尖），可递归嵌套。详见 [程序化生成](./02-server-guide/procedural-generation.md)。
- **程序化拼接** — 调色板（Tile Palette）把多个小结构按规则拼成大遗迹。详见 [程序化生成](./02-server-guide/procedural-generation.md)。
- **游戏内可视化编辑器** — 站在世界里框选、标点、配机关，一键存成模板，全程不碰 YAML。详见 [可视化编辑器](./03-editor/editor-overview.md)。
- **稳定 API + 事件 + 脚本** — `QinhRuinsAPI`、4 个生命周期事件、JS 词缀脚本、Provider 桥、PlaceholderAPI。详见 [开发者文档](./04-developer/api.md)。

---

## 🗺️ 完整目录

完整章节导航见**左侧侧边栏**，或从 [入门 → 概览](./01-getting-started/overview.md) 开始逐章阅读。

---

## ⚠️ 运行环境要求

| 项 | 要求 |
|---|---|
| 服务端 | Paper / Purpur / Spigot **1.21.11+**（需 Bukkit 原生结构 API） |
| Java | **25+** |
| 硬依赖 | **QinhCoreLib**（必须先装，否则 QR 不启用） |
| 可选软依赖 | MythicMobs、QinhClass / MMOCore、QinhItems / NeigeItems / MMOItems、ItemsAdder / CraftEngine / Nexo、PlaceholderAPI、Vault / ExcellentEconomy / PlayerPoints、Citizens |

> QR 的后端**自动探测、无需配置**：结构用 Bukkit 原生（`.schem` 用 `/qr import` 转 `.nbt`）；怪物用 MythicMobs 或原版；成长度 / 队伍用 QinhClass / MMOCore 或内置降级。缺哪个软依赖，对应能力降级，插件照常启动。详见 [安装](./01-getting-started/installation.md)。

---

## 📌 文档约定

- 形如 `qinhruins:guide_xxx`、`QinhRuinsAPI`、`generation.director` 的是**代码标识符 / 配置键**，请原样照抄，**大小写敏感**。
- 形如 `🖼️ [图片占位]` 的段落是**留给你后续补图的位置**，已标注建议文件名（放到 `assets/` 目录）。
- 代码块里的中文是**注释 / 说明**，真正写进 YAML 的请保留键名英文。
- 所有 YAML 路径默认相对于 `plugins/QinhRuins/`。
- 玩家可见文案走多语言文件 `lang/<语言>/*.yml`（内置 7 种语言）；详见 [配置文件](./05-reference/config.md)。
