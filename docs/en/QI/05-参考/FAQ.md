# FAQ — Frequently Asked Questions

> Belongs to: [Reference](命令.md)　·　Related: [Diagnostics & Troubleshooting](诊断排错.md) · [Validation Error Quick Reference](校验报错速查.md)

A collection of common pitfalls scattered across pages, gathered into Q&A form. Grouped by topic — click the links for details.

---

## Installation & Startup

**Q: QI fails to start / the console reports an error and aborts?**
A: Most likely you are missing **QinhCoreLib** (a hard dependency that must be installed first), or your server / Java version is too low (Paper 1.21.11+, Java 25+). See [Installation](../01-入门/安装.md).

**Q: I deleted one of the built-in example items and want it back?**
A: Examples are only released once on first startup (marker file `.bundled_initialized_v3`). Delete the marker or extract it individually from the jar. See [Installation §4](../01-入门/安装.md#4-首次启动会生成什么).

---

## Item Configuration

**Q: My YAML changes don't take effect?**
A: You need `/qi reload`. **Actions are only loaded on reload / restart**.

**Q: An entire action block stops working?**
A: Indentation is misaligned — the `actions` block must be at the **same level** as `material` / `type`. Off by one space and the whole block fails.

**Q: `material` reports unknown?**
A: Use a valid vanilla material name (`diamond_sword`). A name with `:` or `-` is treated as an [external item-source reference](../02-服主指南/物品定义.md#5-material-材质).

**Q: How do I use a CraftEngine / ItemsAdder / Nexo item as the appearance?**
A: Just use `material: ce:xxx` (or `nexo:xxx` / `ia:xxx`), taking the external finished item as the base model — it carries its own model, so **do not configure `custom_model_data`** again. For the prefix alias table and syntax see [Item Definition §5.1](../02-服主指南/物品定义.md#51-外部物品源引用craftengine--itemsadder--nexo-等), and for the two reskinning routes see [Resource Pack §4](../02-服主指南/资源包.md#4-两条自定义外观路线).

**Q: `material: ce:xxx` fails to resolve?**
A: Run `/qi diagnose` to read the code — `SOURCE_NOT_FOUND` = the corresponding plugin is not installed (the prefix is not registered); `ITEM_NOT_FOUND` = the plugin is installed but there is no such item ID.

**Q: The quality name doesn't display?**
A: `tier` must be **uppercase** (`EPIC`) and must exist in `item_tiers.yml`. See [Quality & Display](../02-服主指南/品质与显示.md).

**Q: Does the item ID need a prefix?**
A: No. Use the bare ID (`demo_sword`). The `qi:` / `qinhitems:` prefix is stripped automatically internally.

---

## Attributes / Numbers

**Q: Attribute numbers show up but don't apply to me?**
A: ① AttributePlus is not installed (pure item-library mode); ② `combat.enabled: false`; ③ the names in `attribute-mapping` don't match AP (the console will warn). See [Attributes & Numbers](../02-服主指南/属性与数值.md).

**Q: Can QI compute damage itself?**
A: No. **QI has no built-in numbers** — it only attaches attributes to items and hands them to AttributePlus to apply.

**Q: Can I still use QI without AP installed?**
A: Yes. It enters "pure item-library mode": items can be created, actions can trigger, and Lore displays as usual — only the attributes don't apply to you.

**Q: Can attributes be written as a range?**
A: Yes, e.g. `"10-20"`. A range value will not be overwritten by the base value.

---

## Actions / Skills

**Q: `right_click` doesn't trigger?**
A: Right-clicking on air doesn't always trigger. For general-purpose cases prefer `left_click`. See [Triggers](../02-服主指南/动作系统/触发器.md).

**Q: Can I write if / else inside an action?**
A: **No.** YAML forbids logic branches. For complex logic please [develop a handler](../04-开发者/动作处理器开发.md).

**Q: `qinhskills:cast` reports HANDLER_UNAVAILABLE?**
A: QinhSkills is not installed / not enabled. See [Integration Practice → QinhSkills](../04-开发者/集成实操.md#二qinhskills技能引擎).

**Q: Set skills don't trigger?**
A: In the set's `abilities`, the handler must use the **map form** `{handler: "qinhskills:cast", payload: "..."}` — the string shorthand gets split incorrectly at the first colon. See [Sets](../02-服主指南/套装.md).

**Q: The consumable `consume` doesn't trigger?**
A: The `consume` atom only works for edible materials (potion / food). For non-edible materials (paper, etc.) use `left_click` + `consume: ["self:1"]`. See [Example Library §3](../02-服主指南/物品示例库.md#三逐类注解--消耗品consumableyml).

**Q: Does a cooldown of `3` mean 3 seconds?**
A: A bare number is treated as **seconds**, but `3` would be computed as 3000 seconds. Write `3s` explicitly. See [Cooldown / Consumption / Conditions](../02-服主指南/动作系统/冷却消耗条件.md).

---

## Sets / Sections / Affixes

**Q: How does a set piece count toward the set?**
A: The item ID matches `belonging_pieces` exactly or by prefix (e.g. `warrior` matches `warrior_helmet`). See [Sets](../02-服主指南/套装.md).

**Q: How do set attributes apply to me?**
A: After wearing the full piece count, QI pushes an AP source named `qi:set:<id>`; the attributes are still applied by AttributePlus, and are removed automatically when you drop below the threshold.

**Q: How do I configure random affixes?**
A: Use the [Section](../02-服主指南/段.md)'s `weight_join` (random affix pool) or `quality_pool` (selected by quality).

---

## Soulbinding

**Q: Can a bound item be traded / mailed?**
A: No (unless you have `qinhitems.bypass.soulbound`). Market / mail plugins should validate with `isSoulbound` first. See [Soulbinding](../02-服主指南/灵魂绑定.md), [API Recipe Collection](../04-开发者/API配方集.md).

**Q: Can I bypass it by stuffing the bound item into a shulker box?**
A: No. `scan-containers` deep-scans shulker boxes (8 layers).

---

## Editor

**Q: I closed the inventory after editing without saving?**
A: Changes are discarded. The working copy is not persisted automatically — you must click save (slot 53).

**Q: Save reports a validation error?**
A: Fix it as prompted. See [Validation Error Quick Reference](校验报错速查.md).

**Q: Left-clicking an item doesn't enter editing?**
A: In the browser, **right-click** to edit; left-click takes it into your inventory. Or use `/qi editor <ID>` to go there directly.

---

## Resource Pack / Models

**Q: Saving resource_pack reports `[RP_POLICY]`?**
A: The model cannot contain variables / layers / actions / conditions, and may only have the two keys `custom_model_data` / `model`. See [Resource Pack](../02-服主指南/资源包.md#2-校验约束).

---

## Development

**Q: Where is the item → id reverse lookup?**
A: Only in QI's `getItemId` / `isQinhItem`. CoreLib has no reverse lookup, only prefix resolution. See [API Overview](../04-开发者/API概览.md#6-接入路线选择).

**Q: Which API do I use to change item state?**
A: Distinguish the domains: temporary UI/buff → `variables().set` (runtime domain); socketing / enhancement → `applyLayerPatch` (layer domain). Overreach is rejected by the write-domain policy. See [Layers & Assembly](../04-开发者/层与装配.md).

**Q: A variable key reports a "semantic red line"?**
A: Don't use attribute names like `attack_damage` as variable keys; use `star`/`quality`. Attributes go through `providers.ap`.

**Q: How do I connect QI to a market / mail / lottery?**
A: See the ready-made code in the [API Recipe Collection](../04-开发者/API配方集.md).

---

## Still not solved?

1. `/qi diagnose` to view subsystem status → [Diagnostics & Troubleshooting](诊断排错.md)
2. `/qi problems` to view the specific error → [Validation Error Quick Reference](校验报错速查.md)
3. Browse the [Glossary](术语表.md) to confirm terms
4. Contact the QI author

---

## Next Step

- [Diagnostics & Troubleshooting](诊断排错.md)
- [Validation Error Quick Reference](校验报错速查.md)
- [Glossary](术语表.md)
