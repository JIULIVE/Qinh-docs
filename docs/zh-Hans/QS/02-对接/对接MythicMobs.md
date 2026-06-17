# 对接 MythicMobs：为何插一层 QS + 配技能表现

> 上一页：[对接 QinhItems](./qinhitems-integration.md)　·　下一页：[对接其他物品插件](./other-item-plugins.md)

这一页有两个任务：

1. **讲透「为什么不让物品直接调 MythicMobs，偏偏在中间插一层 QS」**——这是整个秦淮技能架构最该理解的一点。
2. **教你在 MythicMobs 里写技能本体**（粒子 / 伤害 / 位移），让 QS 调用它「放出来」。

> 先复述铁律：**QS 管「能不能放、放哪个」，MM 管「放出来啥样」，AP 管「打多少伤害」。** 详见 [对接总览](./integration-overview.md)。

---

## 🧠 一、为何不直接调 MM？（THE WHY，请务必读完）

最直觉的做法是：**物品按一下 → 直接调 MythicMobs 放个技能。** 很多服就是这么干的。秦淮**偏偏不这么干**，而是在物品和 MM 之间插一层 QS。为什么？因为「物品直接调 MM」会撞上四面墙，而 QS 这一层正好把它们一一拆掉。

### 好处 1️⃣：状态/逻辑 与 表现，彻底分离（单一职责）

一个技能有两类东西：

- **「逻辑」**：解锁了吗？冷却好了吗？冷却组占用了吗？充能够吗？过 GCD 了吗？蓝够扣吗？血够血祭吗？目标选谁？这是连招第几段？吟唱读到几格了？被动条件满足吗？门控放行吗？
- **「表现」**：粒子长啥样、位移多远、什么音效、damage 打哪。

> **QS 全包「逻辑」，MM 全包「表现」。** 这样一来：技能放不出来，是逻辑问题就查 QS，是没特效就查 MM——**谁出问题查谁**，不会两边互相甩锅。

如果物品直接调 MM，这两类东西就糊在一起了：冷却写哪？解锁判哪？连招状态存哪？最后只能散落在物品模板、MM YAML 里到处都是。

### 好处 2️⃣：单一数据真实源（不双扣、不双冷却）

这是最实在的好处。三件事**只能有一个地方说了算**：

| 这件事 | 唯一真实源 | 为什么 |
|---|---|---|
| **冷却** | **QS** | 所以 MM 技能一律 `Cooldown: 0`。否则物品冷却 + MM 冷却 = 双重冷却，玩家体验崩坏 |
| **资源消耗（蓝/怒…）** | **QS**（`PlayerSkillProfile` 同一条扣费缝） | 否则物品扣一次、技能再扣一次 = 双扣 |
| **伤害数值** | **AttributePlus**（按物品属性结算） | MM 里的 `damage{}` 只是「触发一次伤害事件」，数字交 AP |

> 类比：QS 是「账房先生」，所有冷却、资源的账只有它一本。MM、物品都不许私自记账，否则对不上。

### 好处 3️⃣：可插拔的执行后端

QS 不是写死「只能用 MythicMobs」。它通过一层**桥（Bridge）**对接 MM。将来你想换成别的执行引擎（或者 MM 出了新版本 API 变了），**只改桥这一层，QS 的门控逻辑一行都不用动**。

> 类比：QS 是主机，MM 是接在 HDMI 口上的显示器。换显示器不用换主机——因为它们之间隔着一个标准接口（桥）。

### 好处 4️⃣：被动触发有了统一入口

被动技能（被打了反击、击杀了回血、低血了开盾…）最麻烦的是「**谁打了谁**」这个上下文。如果让物品/MM各自去抓，乱成一锅粥。

QS 把所有被动事件（攻击 / 受伤 / 击杀 / 低血 / 潜行 / 跳跃…）**统一接住**，建好上下文（攻击者是谁、被击者是谁），再调 MM——MM 这边拿到的就是现成的 `@Trigger` / `@Target`，不用自己费劲找。

### 🔒 由此推出的铁律

> **QI 只把按键变成「放某个技能」，不写技能逻辑、不算伤害、不直接调 MM。所有技能执行都经 QS 进 MM，避免 QI / QS / MM 三方抢权。**

这条铁律直接推出了两个「别做」（已在 [对接 QinhItems](./qinhitems-integration.md) 强调）：物品里**别再配冷却**、物品里**别再加 `mythicmobs:cast`**。

> 🖼️ **[图片占位]** 对比图：左「物品直接调MM（冷却/资源/伤害三处打架）」vs 右「插一层QS（单一真实源）」　·　建议 `assets/why-qs-layer.png`

---

## 🌉 二、Mythic 桥：三种模式

QS 调 MM 之前，得先确保 MM 里**有那个同名技能**。QS 的「桥」负责把技能「接上」MM。桥有三种模式，在 `config.yml` 的 `mythic.bridge_mode` 配置：

| 模式 | 行为 | 适合 |
|---|---|---|
| **`AUTO`**（推荐） | 先用 **API 注册**技能 → 验证是否注册成功 → 失败则**写一个 YAML stub** 到 MM skills 目录并 `loadSkills()` → 再验证 | 生产环境，最稳 |
| **`API_MODE`** | **只用 API 注册**，不做 YAML fallback | 开发 / 调试 |
| **`YAML_STUB`** | **只写 YAML stub** 到 MM skills 目录，走 MM 的加载生命周期 | 想完全走文件式管理时 |

> 大白话：`AUTO` = 「先试着用代码直接告诉 MM 有这技能，不行就写个占位文件让 MM 自己加载」。绝大多数人用默认的 `AUTO` 即可。

---

## ⚙️ 三、桥的配置字段

都在 `config.yml` 的 `mythic:` 段下：

| 字段 | 默认 | 含义 |
|---|---|---|
| `bridge_enabled` | `true` | 是否启用 Mythic 桥 |
| `bridge_mode` | `AUTO` | 三种模式之一（见上） |
| `bridge_debug` | `false` | 桥的调试日志（排错时开） |
| `bridge_verify_after_register` | `true` | 注册后用 `getSkill` 检查技能是否真在 MM 里 |
| `bridge_verify_cast` | `false` | 可选：静默试射一次校验（需要**玩家在线** + `debug`） |
| `bridge_mythic_yaml_file` | `QinhSkillsBridge.yml` | YAML stub 写到哪个文件 |
| `bridge_stub_mechanic` | `'message{m="&7[QinhSkills] &f{skill}"} @Self'` | stub 的占位机制，**必须含 `{skill}` 占位** |

> `bridge_stub_mechanic` 里的 `{skill}` 会被替换成技能名——这就是你没配 MM 表现时，屏幕上看到的那条 `[QinhSkills] 技能名` 占位消息的来源。

---

## 📝 四、Stub 长什么样 + 永不覆盖原则

当桥走 YAML fallback 时，会把一个 **stub（占位技能）** 写到：

```text
plugins/MythicMobs/skills/QinhSkillsBridge.yml
```

形如：

```yaml
skillId:
  Cooldown: 0
  Skills:
  - message{m="&7[QinhSkills] &fskillId"} @Self    # 就是 bridge_stub_mechanic 展开的样子
```

### 🔐 永不覆盖原则（极重要）

> **QS 永远不会覆盖你已经存在的同名 MM 技能。** 一旦检测到 MM 里已有这个技能名（`skillExists`），桥就**直接跳过**，不写 stub、不动你的文件。

这意味着：

- stub **只是占位 + 验证通道**——你还没写真技能时，让你至少看见「技能确实放出来了」。
- 一旦你在 `plugins/MythicMobs/skills/` 里写了**真正的同名技能**，QS 立刻改用你的真技能，stub 让位。
- 所以你**永远不用担心 QS 把你精心写的 MM 技能冲掉**。

---

## 🎯 五、QS 调 MM 时，传过去什么？

QS 通过 `MythicExecutor`（底层用 `MythicBukkit` 的 `apiHelper.castSkill`）调 MM。它会把**目标**和**一堆变量**传给 MM。

### 5.1 目标：`@Target` / `@Trigger` 何时有？

**关键：只有 QS 技能里配了 `target:`，MM 才会拿到 `@Target`！**

| QS 技能这样配 | MM 这边 | 你在 MM 该用 |
|---|---|---|
| 配了 `target:`（如 `NEAREST` + `MONSTERS`） | QS 选好目标 → 作为 `@Target` 传入 | `@Target` |
| **没配** `target:` | **没有** `@Target` | `@EntitiesInRadius{r=4}` / `@Self` **自己取范围** |
| 被动技 | 攻击者等作为 `@Trigger` / `@Target` 传入 | `@Trigger` / `@Target` |

> ⚠️ 新手最常见的坑：MM 技能里写了 `@Target`，但 QS 技能没配 `target:`——结果 MM 找不到目标，技能「空放」。**没配 `target:` 就用 `@EntitiesInRadius` / `@Self`。**

### 5.2 变量：MM 里用 `<skill.var.名字>` 读

QS 注入这些变量，MM 的 YAML 里用 `<skill.var.NAME>` 读取（变量名已对照源码 `MythicExecutor.applyVariables` + `SkillCastRequestBridge` 核对）：

| 变量名 | 含义 |
|---|---|
| `mode` | 触发模式（如 `LEFT_CLICK`） |
| `source` | 触发来源（如 `qinhitems`） |
| `slot` | 物品槽位（命令桥等无槽位时为 `-1`） |
| `playerName` | 施法者玩家名（**就是 `playerName`，没有 `player`**） |
| `origin` | 固定 `=QinhSkills` |
| `logicOnly` | 固定 `true` |
| `toggle_state` | `on` / `off`（**仅 TOGGLE 开关技**有） |
| **技能 `variables:` / `levels.params:` 里配的所有键** | 如 `element`、`power`——你在 QS 技能定义里写的全透传（**原样、不带前缀**） |

> 数字会自动转成 MM 的**数值变量**（可参与运算），其余作字符串。这让你能用 `<skill.var.power>` 在 MM 里做等级缩放（虽然伤害最终交 AP，但你可以用它缩放粒子数量、范围等表现）。

> ⚠️ **两个高频误区（务必记牢）：**
> 1. **玩家名是 `<skill.var.playerName>`，不是 `<skill.var.player>`。** MM 侧没有 `player` 这个变量。
> 2. **MM 侧拿不到技能等级 `level`。** 等级只存在于脚本 `ctx`（`ctx.get("level")`）。想在 MM 按等级缩放，请在 QS 技能的 `levels.N.params:` 里传一个参数（如 `power: "1.2"`），MM 用 `<skill.var.power>` 读。
> 3. 这套 MM 变量名（参数**不带** `var_` 前缀、用 `playerName`）和**脚本** `ctx` 那套（参数**带** `var_` 前缀、用 `player`、有 `level`）是**两套**，别混。对照见 [脚本 API](../04-developer/script-api.md)。

---

## ⚖️ 六、MM 侧三条铁律

写 MM 技能时，这三条一条都不能破：

| ★ 铁律 | 为什么 |
|---|---|
| **`Cooldown` 一律 `0`** | 冷却由 QS 统一管。MM 再设冷却 = 双重冷却 |
| **`@Target` 仅当 QS 配了 `target:`** | 否则 MM 找不到目标空放（见 5.1） |
| **`damage{}` 只是触发伤害事件，数值交 AP** | QS / QI 都不写死伤害；AttributePlus 按攻击者**物品属性**结算最终数字 |

---

## 📄 七、完整范本：`QinhSkillsEcosystem.yml`（逐技能注解）

下面是 QS 首次启动释放到 `plugins/QinhSkills/integrations/mythic/QinhSkillsEcosystem.yml` 的**官方 MM 范本，原样照抄**。它就是「MM 侧该怎么写」的标准答案。

> 用法：复制到 `plugins/MythicMobs/skills/` 下，然后 `/mm reload`。一旦 MM 里有了这些同名技能，QS 的桥就**不再用占位消息**，改用你这里写的真实表现。

> 🛠️ **一处需要订正的注释（以本页 5.2 的变量表为准）：** 范本文件头部注释里写了 `<skill.var.player>` 和 `<skill.var.level>`，但实际 QS 注入 MM 的是 **`<skill.var.playerName>`**（玩家名），而 **`level` 不会传到 MM**。下面的范本技能体本身没有用到这两个变量，照抄无碍；但你自己写 MM 技能时，玩家名请用 `<skill.var.playerName>`，按等级缩放请走 `levels.params:` 传参（如 `<skill.var.power>`）。

```yaml
#==============================================================================
#  【对接示例 3/4】MythicMobs 技能  ←  QS 调用执行（真正的表现层）
#
#  把本文件复制到   plugins/MythicMobs/skills/   下，然后 /mm reload。
#  这些技能名和 QS 示例技能的 execution.mythic_skill 一一对应。一旦 MM 里存在同名技能，
#  QS 的 Mythic 桥就【不再用占位消息】，改用你这里写的真实表现(粒子/位移/伤害)。
#
#  ★ QS → MM 的"接口"(你在 MM 这边能拿到什么)：
#    1) 变量：QS 把技能变量注入,MM 内用  <skill.var.名字>  读。常见:
#         <skill.var.player>  施法者名      <skill.var.level>  技能等级
#         <skill.var.element> / <skill.var.power>  你在 QS variables:/levels.params: 里配的
#         <skill.var.toggle_state>  开关技能的 on/off
#    2) 目标：仅当 QS 技能里配了 target: 才会传 @Target / @Trigger！
#         配了的(如 blade_slash 的 NEAREST) → 用 @Target；
#         被动技(如 retaliate) → 攻击者作为 @Trigger / @Target 传入；
#         没配 target: 的(如 fire_wave) → 没有 @Target，请用 @EntitiesInRadius / @Self 自己取范围。
#    3) 施法者：@Self / @caster 就是放技能的玩家。
#
#  ⚠ 伤害数值不在这里写死、更不在 QS/QI 里：
#     QS、QinhItems 都【不内置属性/伤害】。下面的 damage 只是"打一下、触发伤害事件",
#     最终伤害由 AttributePlus(或你用的属性插件)按攻击者物品属性结算——AP 已接管原版伤害。
#     若你的属性插件提供专门的"按属性结算"MM 机制,按其文档替换 damage 行即可。
#
#  ★ Cooldown 一律设 0：冷却由 QS 统一管理,MM 这边别再设,免得双重冷却。
#  ★ 机制(粒子/音效/位移/光环…)种类极多,这里只用最基础的几个演示"如何接 QS 的数据",
#    完整机制清单见 MythicMobs Wiki。
#==============================================================================

# 火焰波 —— 自身周围 AOE(QS 没配 target,所以用 @EntitiesInRadius 取范围,不能用 @Target)
fire_wave:
  Cooldown: 0
  Skills:
  - effect:particles{particle=flame;amount=40;hSpread=2;vSpread=1;speed=0.05} @Origin
  - sound{sound=entity.blaze.shoot;volume=1;pitch=1} @Self
  - ignite{ticks=40} @EntitiesInRadius{r=4}
  - damage{amount=4} @EntitiesInRadius{r=4}   # 数值交 AP 结算;<skill.var.power> 可用于做等级缩放

# 刃斩 —— 单体(QS 里配了 target: NEAREST+MONSTERS,所以有 @Target = 最近的怪)
blade_slash:
  Cooldown: 0
  Skills:
  - sound{sound=entity.player.attack.sweep;volume=1;pitch=1} @Self
  - effect:particles{particle=crit;amount=12} @Target
  - damage{amount=6} @Target                  # @Target 由 QS 选定;伤害交 AP

# 演示斩 —— starter 技能,无 target,自身周围取怪
demo_slash:
  Cooldown: 0
  Skills:
  - sound{sound=entity.player.attack.strong;volume=1;pitch=1} @Self
  - damage{amount=3} @EntitiesInRadius{r=3}

# 演示蓄力斩 —— 吟唱完成后由 QS 调用(读条逻辑全在 QS,MM 只管"放出来"那一下)
demo_slash_charged:
  Cooldown: 0
  Skills:
  - sound{sound=entity.generic.explode;volume=1;pitch=1.2} @Self
  - effect:particles{particle=crit;amount=30} @Self
  - damage{amount=6} @EntitiesInRadius{r=3}

# 荆棘反击 —— 被动:QS 把"打你的实体"作为 @Trigger 传入
retaliate:
  Cooldown: 0
  Skills:
  - sound{sound=enchant.thorns.hit;volume=1;pitch=1} @Self
  - damage{amount=3} @Trigger                 # 反击攻击者;数值交 AP

# 疾冲 —— 位移技,不造成伤害
dash:
  Cooldown: 0
  Skills:
  - sound{sound=entity.player.attack.sweep;volume=1;pitch=1.6} @Self
  - effect:particles{particle=cloud;amount=20;speed=0.02} @Self
  - potion{type=SPEED;duration=30;level=4} @Self
  # ↑ 用"加速"示意。想要真正的瞬移/冲刺,改用 MM 的位移机制(lunge / velocity / leap 等,见 MM Wiki)。

# 护盾 —— 开关技(toggle),QS 传 <skill.var.toggle_state> = on / off
shield:
  Cooldown: 0
  Skills:
  - sound{sound=block.beacon.activate;volume=1;pitch=1.4} @Self
  - potion{type=ABSORPTION;duration=200;level=1} @Self
  # ↑ 想区分"开盾/撤盾",用 MM 条件(?)或拆成两个子技能按 <skill.var.toggle_state> 分支(见 MM Wiki)。

# 炎爆连舞 —— 连招起手/续段那一下(QS 连招里的 fire_combo_strike)
fire_combo_strike:
  Cooldown: 0
  Skills:
  - sound{sound=entity.blaze.hurt;volume=1;pitch=1.2} @Self
  - effect:particles{particle=flame;amount=8} @Self
  - damage{amount=3} @EntitiesInRadius{r=3}

# 炎爆连舞 —— 终结技(右→右→左 命中后由 QS 调用 fire_combo_blaze)
fire_combo_blaze:
  Cooldown: 0
  Skills:
  - sound{sound=entity.generic.explode;volume=1;pitch=1} @Self
  - effect:particles{particle=flame;amount=60;hSpread=3;vSpread=1} @Origin
  - ignite{ticks=60} @EntitiesInRadius{r=5}
  - damage{amount=10} @EntitiesInRadius{r=5}  # 终结大伤;数值交 AP
```

### 逐技能注解

| MM 技能 | QS 那侧是什么技能 | 目标怎么取 | 看点 |
|---|---|---|---|
| `fire_wave` | 自身 AOE，**没配** `target:` | `@EntitiesInRadius{r=4}` / `@Origin` | 没 target 就自取范围的范例 |
| `blade_slash` | 配了 `target: NEAREST` + `MONSTERS` | `@Target`（最近的怪） | 配了 target 才用 `@Target` |
| `demo_slash` | starter 技能，无 target | `@EntitiesInRadius{r=3}` | 最简单的入门技 |
| `demo_slash_charged` | **吟唱**完成后调用 | `@Self` 周围 | 读条逻辑全在 QS，MM 只管「放出来那一下」 |
| `retaliate` | **被动**（被攻击反击） | `@Trigger`（打你的人） | 被动技拿 `@Trigger` 的范例 |
| `dash` | 位移技 | `@Self` | 不造成伤害，用加速示意位移 |
| `shield` | **开关技 toggle** | `@Self` | 读 `<skill.var.toggle_state>` 区分开/关 |
| `fire_combo_strike` | **连招**起手 / 续段 | `@EntitiesInRadius{r=3}` | 连招的中间段 |
| `fire_combo_blaze` | **连招终结**（右→右→左 命中后） | `@EntitiesInRadius{r=5}` | 连招的终结大招 |

> 注意每个技能：**全部 `Cooldown: 0`**（冷却归 QS）、**`damage{}` 的数字只是「打一下」**（最终伤害归 AP）、**`@Target` 只出现在配了 `target:` 的 `blade_slash`**。这三点就是「MM 侧三铁律」的活教材。

---

## 🩺 八、排错清单

| 现象 | 可能原因 | 解决 |
|---|---|---|
| 技能只有占位文字 `[QinhSkills] 技能名` | MM 里没有同名技能 | 把 `QinhSkillsEcosystem.yml` 复制到 MM skills 目录 + `/mm reload` |
| 技能「空放」没目标 | MM 用了 `@Target` 但 QS 没配 `target:` | QS 配 `target:`，或 MM 改用 `@EntitiesInRadius` / `@Self` |
| 冷却乱套 / 比预期短或长 | MM 技能里设了 `Cooldown` ≠ 0 | MM 一律 `Cooldown: 0`，冷却交 QS |
| 伤害数字不对 | 期望 AP 结算却看 MM 写死值 | `damage{}` 只触发事件，去 AP 配属性 |
| 桥没接上 / 看不到日志 | 没开调试 | `config.yml` 设 `mythic.bridge_debug: true`，看 `/qs reload` 时的桥日志 |
| 我的真技能被覆盖了 | 不会发生 | QS **永不覆盖**同名 MM 技能；如怀疑，检查文件名是否真同名 |

---

## 继续阅读

- 不用 QI、用别的物品插件触发？→ [对接其他物品插件](./other-item-plugins.md)
- 想搞懂从按键到 MM 的完整链路 + 诊断 → [执行链路与事件](./cast-flow-events.md)
- 回去配物品触发 → [对接 QinhItems](./qinhitems-integration.md)
