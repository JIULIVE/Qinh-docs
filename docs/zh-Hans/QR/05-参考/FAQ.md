# FAQ 常见问题集

> 所属：[参考手册](./commands.md)　·　相关：[诊断与排错](./troubleshooting.md) · [术语表](./glossary.md)　·　返回：[首页](../README.md)

把散落各页的高频疑问汇成问答。按主题分组，点链接看详解。

---

## 定位与玩法

**Q：QR 是副本插件吗？**
A：**不是**。QR 不把玩家拉进独立世界、不开倒计时。遗迹就**长在你的主世界里**，是世界的一部分；通关后随时间消退、腾名额让新遗迹生成——一个「活的、会呼吸的世界」。它是**程序化 Roguelike 遗迹引擎**，不是「进本—倒计时—结算」那套副本。详见 [概览](../01-getting-started/overview.md)、[核心概念](../01-getting-started/core-concepts.md)。

**Q：秘境是新世界吗？**
A：**不是**。秘境（Realm）是把一座**通关的遗迹**注入「层数 + 词缀」后的强化态，还是**原地那座遗迹**——只是怪重刷、规则改写、产出升级，不开新维度、不传送。详见 [秘境与钥石](../02-server-guide/realms-keystones.md)。

**Q：通关后遗迹会消失吗？**
A：可配。打通（`CLEARED`）的遗迹超过 `director.regen-hours` 小时、附近无人时，生成总控会**快照还原地形**、回收锚点、腾出密度名额长新遗迹。`regen-hours: 0` = 永不消退（当永久地标）。**真正还原方块需同时开 `cleanup.snapshot-restore`**（生成时存了快照才有得还原）。详见 [自然生成与预加载 §四](../02-server-guide/generation-preloading.md#四快照与再生cleanup)。

---

## 依赖与降级

**Q：不装 MythicMobs 能用吗？**
A：**能**。没装 MM 时，刷怪降级为**原版怪**（蓝图刷怪点用原版实体名如 `ZOMBIE`）；`mm-<名字>` 前缀的怪需要 MM。词缀里「怪变强」的 `mob-level-bonus` 也靠 MM 提 level 缩放，没 MM 时该类词缀的等级加成失效，但数量 / 环境 / 战利品类词缀照常。QR 的后端自动探测、缺哪个软依赖就对应降级，插件照常启动。详见 [安装](../01-getting-started/installation.md)。

**Q：必须装什么？**
A：硬依赖只有 **QinhCoreLib**（必须先装，否则 QR 不启用）。服务端 Paper / Purpur / Spigot **1.21.11+**、Java **25+**。其余（MythicMobs、QI / NeigeItems、ItemsAdder / CraftEngine / Nexo、PlaceholderAPI、Vault / 经济插件、Citizens 等）都是可选软依赖，缺了对应能力降级。

---

## 把已有建筑变遗迹

**Q：怎么把已有建筑 / `.schem` 变成遗迹？**
A：两条路：
- **框选保存**：站在建筑里 `/qr pos1` / `/qr pos2` 框选，`/qr save <id>` 存成模板（结构存为原生 `.nbt`）。
- **导入 .schem**：把 WorldEdit 的 `.schem` 放进 `plugins/QinhRuins/schematics/`，`/qr import <文件> <id>` 转成 `.nbt` 模板（QR 用 Bukkit 原生结构，服务器无需 FAWE）。

之后给模板配 `generation`（在哪生成）和可选 `blueprint.yml`（刷怪 / 宝箱 / 核心），就成了会自然生成的遗迹。也可全程用[可视化编辑器](../03-editor/editor-overview.md)不碰 YAML。详见 [结构文件](../02-server-guide/structure-files.md)、[选区与保存](../02-server-guide/selection-save.md)。

**Q：怎么让结构融进地形不推土？**
A：模板 `structure.target-mask`（掩码粘贴，只在指定方块处放置）+ 标记块（屏障→镂空、基岩→地形透出）+ 地基填充。详见 [结构文件](../02-server-guide/structure-files.md)。

---

## 生成与性能

**Q：遗迹会越生成越多卡服吗？**
A：不会失控。三重约束兜底：① **全局密度上限**（`director.density.max-per-region` + `min-spacing`）限制单位区域遗迹数；② **消退再生**（`regen-hours` + `snapshot-restore`）让打通遗迹定期还原腾名额；③ **分帧限流**（`generation.max-millis-per-tick` 每 tick 毫秒预算 + 候选队列），放置超时即让出本 tick，不冻服。详见 [自然生成与预加载](../02-server-guide/generation-preloading.md)。

**Q：该用什么插件预生成世界？**
A：推荐 **[Chunky](https://modrinth.com/plugin/chunky)**（免费、轻量、主流、Paper 原生兼容）。常用流程：`/chunky world <世界>` → `/chunky center 0 0` → `/chunky radius <半径>` → `/chunky start`。

::: warning 注意
**预生成本身很卡、很慢是正常现象**——卡顿来自服务端疯狂生成**原版地形区块**（Chunky 在干活），**不是 QR**。请务必：
- **提前通知玩家**，约定低人数时段（如凌晨）执行；
- **资源世界要先通知玩家「即将关闭 / 重置」**，让大家搬走家当，避免财产损失；
- **配置差就把半径调小、分批次跑**——先 `radius 1000~2000` 看负载，扛得住再加大，别一上来 `radius 10000` 顶死服务器；
- 预生成期间可临时给 QR 减负，跑完再 `/qr scatter` 把遗迹一次性铺进已生成区域。

完整防卡清单与推荐顺序见 ➜ **[自然生成与预加载 §七 世界预生成（Chunky）与防卡建议 ⚠️ 必读](../02-server-guide/generation-preloading.md#七世界预生成chunky与防卡建议--必读)**。开服 / 预生成卡顿排查见 [诊断排错 §8](./troubleshooting.md#8-预生成--开服时卡顿-必看)。
:::

---

## 玩家发物

**Q：怎么发钥石给玩家？**
A：`/qr keystone give <tier> [player]`（`tier` 取 1~`realm.tiers.max`，省略 player = 自己）。钥石也可由通关掉落（带天梯：有概率掉更高一层）。详见 [秘境与钥石](../02-server-guide/realms-keystones.md)。

**Q：怎么发指引物给玩家？**
A：指引物由**物品源给予**——引用 `qinhruins:guide_<模板id>`，通过 QI / 掉落表 / 命令给物插件发放。QR **不内置 give 命令**。玩家右键指引物 → 罗盘指向最近的同类遗迹；`/qr guide cancel` 取消并返还。详见 [向导与图鉴](../02-server-guide/guide-codex.md)。

---

## 跨服与数据

**Q：如何跨服共享图鉴？**
A：让多个服的 **QinhCoreLib 连同一个 MySQL**。QR 的玩家图鉴发现可入库（跨服共享），其余实例与运行态（锚点、宝箱领取记录等）绑具体世界坐标、仍存本地。详见 [数据存储](../04-developer/data-storage.md)、[向导与图鉴](../02-server-guide/guide-codex.md)。

---

## 还没解决？

1. 遗迹不生成 / 报错 → [诊断与排错](./troubleshooting.md)（`/qr why`、`/qr gentest`、`/qr profile`）
2. 名词不懂 → [术语表](./glossary.md)
3. 命令 / 配置 → [命令大全](./commands.md) · [config.yml 全配置](./config.md)

---

## 下一步

- [诊断与排错](./troubleshooting.md)
- [术语表](./glossary.md)
- [命令大全](./commands.md)
