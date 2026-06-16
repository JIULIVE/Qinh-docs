# FAQ 常见问题集

> 所属：[参考](./commands.md)　·　相关：[诊断排错](./diagnostics.md) · [校验报错速查](./validation-errors.md)

把散落各页的易错点汇成问答。按主题分组，点链接看详解。

---

## 安装与启动

**Q：QI 启动失败 / 控制台报错中止？**
A：多半是缺 **QinhCoreLib**（硬依赖，必须先装），或服务端 / Java 版本不够（Paper 1.21.11+、Java 25+）。见 [安装](../01-getting-started/installation.md)。

**Q：删了某个内置示例物品想找回来？**
A：示例只在首次启动释放一次（标记文件 `.bundled_initialized_v3`）。删标记或从 jar 里单独取。见 [安装 §4](../01-getting-started/installation.md#4-首次启动会生成什么)。

---

## 物品配置

**Q：改了 YAML 不生效？**
A：要 `/qi reload`。**动作只在 reload / 重启时加载**。

**Q：动作整段失效？**
A：缩进错位——`actions` 块必须与 `material` / `type` **同级**，错一格整段失效。

**Q：`material` 报 unknown？**
A：用合法原版材质名（`diamond_sword`）。带 `:` 或 `-` 会被当成[外部物品源引用](../02-server-guide/item-definition.md#5-material-材质)。

**Q：怎么用 CraftEngine / ItemsAdder / Nexo 的物品当外观？**
A：直接 `material: ce:xxx`（或 `nexo:xxx` / `ia:xxx`），把外部成品当底模，它自带模型，**别再配 `custom_model_data`**。前缀别名表与语法见 [物品定义 §5.1](../02-server-guide/item-definition.md#51-外部物品源引用craftengine--itemsadder--nexo-等)，两条换皮路线见 [资源包 §4](../02-server-guide/resource-pack.md#4-两条自定义外观路线)。

**Q：`material: ce:xxx` 解析失败？**
A：`/qi diagnose` 看码——`SOURCE_NOT_FOUND` = 对应插件没装（前缀没注册）；`ITEM_NOT_FOUND` = 插件装了但没这个物品 ID。

**Q：品质名不显示？**
A：`tier` 要**大写**（`EPIC`），且必须存在于 `item_tiers.yml`。见 [品质与显示](../02-server-guide/quality-display.md)。

**Q：物品 ID 要带前缀吗？**
A：不带。裸 ID（`demo_sword`）。内部会自动剥 `qi:` / `qinhitems:` 前缀。

---

## 属性 / 数值

**Q：属性数字显示了但不上身？**
A：① 没装 AttributePlus（纯物品库模式）；② `combat.enabled: false`；③ `attribute-mapping` 的名字和 AP 不一致（控制台会警告）。见 [属性与数值](../02-server-guide/attributes-numbers.md)。

**Q：QI 自己能算伤害吗？**
A：不能。**QI 不内置数值**，只把属性挂物品、交 AttributePlus 应用。

**Q：没装 AP 还能用 QI 吗？**
A：能。进入「纯物品库模式」：物品能造、动作能触发、Lore 照常显示，只是属性不上身。

**Q：属性能写范围吗？**
A：能，如 `"10-20"`，范围值不会被基础值覆盖。

---

## 动作 / 技能

**Q：`right_click` 不触发？**
A：右键对空气不一定触发。泛用场景优先 `left_click`。见 [触发器](../02-server-guide/action-system/triggers.md)。

**Q：能在动作里写 if / else 吗？**
A：**不能**。YAML 禁止逻辑分支。复杂逻辑请[开发处理器](../04-developer/handler-development.md)。

**Q：`qinhskills:cast` 报 HANDLER_UNAVAILABLE？**
A：没装 / 没启用 QinhSkills。见 [集成实操 → QinhSkills](../04-developer/integration-howto.md#二qinhskills技能引擎)。

**Q：套装技能不触发？**
A：套装 `abilities` 里 handler 要用 **map 形式** `{handler: "qinhskills:cast", payload: "..."}`，字符串简写会被首冒号拆错。见 [套装](../02-server-guide/sets.md)。

**Q：消耗品 `consume` 触发不了？**
A：`consume` 原子只对可食用材质（potion / 食物）有效。非食用材质（paper 等）用 `left_click` + `consume: ["self:1"]`。见 [示例库 §3](../02-server-guide/item-cookbook.md#三逐类注解--消耗品consumableyml)。

**Q：冷却写 `3` 是 3 秒吗？**
A：裸数字当**秒**，但 `3` 会被算成 3000 秒。明确写 `3s`。见 [冷却/消耗/条件](../02-server-guide/action-system/cooldown-cost-conditions.md)。

---

## 套装 / 段 / 词缀

**Q：套装件怎么算进套装？**
A：物品 ID 精确匹配或前缀匹配 `belonging_pieces`（如 `warrior` 匹配 `warrior_helmet`）。见 [套装](../02-server-guide/sets.md)。

**Q：套装属性怎么上身？**
A：穿满件数后 QI 推一个 `qi:set:<id>` 的 AP 源，属性仍由 AttributePlus 应用，掉到阈值下自动移除。

**Q：随机前缀怎么配？**
A：用[段](../02-server-guide/sections.md)的 `weight_join`（随机词缀池）或 `quality_pool`（按品质选）。

---

## 灵魂绑定

**Q：绑定物品能交易 / 邮寄吗？**
A：不能（除非有 `qinhitems.bypass.soulbound`）。市场 / 邮件插件应先 `isSoulbound` 校验。见 [灵魂绑定](../02-server-guide/soulbinding.md)、[API 配方集](../04-developer/api-recipes.md)。

**Q：把绑定物塞潜影盒能绕过吗？**
A：不能。`scan-containers` 会深扫潜影盒（8 层）。

---

## 编辑器

**Q：编辑后没保存就关了背包？**
A：改动丢弃。工作副本不自动落盘，要点保存（槽 53）。

**Q：保存提示校验错误？**
A：按提示改，见 [校验报错速查](./validation-errors.md)。

**Q：左键物品没进编辑？**
A：浏览器里**右键**才编辑，左键是获取到背包。或 `/qi editor <ID>` 直达。

---

## 资源包 / 模型

**Q：resource_pack 保存报 `[RP_POLICY]`？**
A：模型不能含变量 / 层 / 动作 / 条件，且只能有 `custom_model_data` / `model` 两个键。见 [资源包](../02-server-guide/resource-pack.md#2-校验约束)。

---

## 开发

**Q：item → id 反查在哪？**
A：只在 QI 的 `getItemId` / `isQinhItem`。CoreLib 没有反查，只有前缀解析。见 [API 概览](../04-developer/api-overview.md#6-接入路线选择)。

**Q：改物品状态用哪个 API？**
A：分清域：临时 UI/buff → `variables().set`（runtime 域）；打孔/强化 → `applyLayerPatch`（layer 域）。越权会被写域策略拒。见 [层与装配](../04-developer/layers-assembly.md)。

**Q：变量键报「语义红线」？**
A：别用 `attack_damage` 等属性名当变量键，用 `star`/`quality`。属性走 `providers.ap`。

**Q：怎么给市场 / 邮件 / 抽奖接 QI？**
A：见 [API 配方集](../04-developer/api-recipes.md) 的成品代码。

---

## 还没解决？

1. `/qi diagnose` 看子系统状态 → [诊断排错](./diagnostics.md)
2. `/qi problems` 看具体报错 → [校验报错速查](./validation-errors.md)
3. 翻 [术语表](./glossary.md) 确认名词
4. 联系 QI 作者

---

## 下一步

- [诊断排错](./diagnostics.md)
- [校验报错速查](./validation-errors.md)
- [术语表](./glossary.md)
