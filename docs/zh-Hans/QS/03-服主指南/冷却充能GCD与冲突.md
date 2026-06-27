# 冷却、充能、GCD 与冲突

> 上一页：[目标与索敌](./targeting.md)　·　下一页：[消耗条件与变量](./cost-conditions-variables.md)

---

技能「放不出」有很多种原因。这一页讲清 **5 种基于时间的门控**——它们看着像，其实各管一摊：

| # | 机制 | 一句话 |
|---|---|---|
| 1 | **基础冷却** | 单个技能放完要等多久才能再放 |
| 2 | **冷却组** | 一组技能共享同一个冷却 |
| 3 | **充能** | 技能存几层，每放一次扣一层 |
| 4 | **GCD 全局冷却** | 放完任意技能后，所有技能短暂封禁 |
| 5 | **冲突组** | 「刚出手」的短锁，同组互斥一小会儿 |

> 🖼️ **[图片占位]** 一张「完整施放链路：silence→id解析→目标 ‖ 解锁→冷却→冷却组→GCD→资源→生命→冲突→条件 ‖ pre_js→校验→执行」的流程图　·　建议 `assets/gate-pipeline.png`

---

## 一、基础冷却（cooldown.base）

最简单的「二元冷却」：放完进 CD，CD 期间放不出。

```yaml
cooldown:
  base: 2500                     # 冷却 2500 ms = 2.5 秒（也可写顶层 cooldown_ms）
```

---

## 二、冷却组（cooldown.group）

多个技能**共享一个冷却**：组里任一技能放出，整组都进 CD。底层用 `cdgroup:<组名>` 这个键追踪。

```yaml
cooldown:
  base: 3000
  group: fire                    # 同 group:fire 的技能共享冷却（也可写顶层 cooldown_group）
```

> 检查逻辑：放技能时，取「技能自身冷却」与「所属冷却组冷却」**两者剩余的最大值**——哪个还没好，就以哪个为准。

适合「一套技能不能连放」的设计，比如三个火系技能共用 `group: fire`。

---

## 三、充能（cooldown.charges）

充能**替代二元冷却**：技能存若干层，每放一次扣 1 层，按 `base` 逐层恢复。`charges > 1` 时启用。

```yaml
cooldown:
  base: 4000                     # 每层 4 秒恢复
  charges: 3                     # 存 3 层；放一次扣 1 层，4 秒后回 1 层（也可写顶层 charges）
```

要点：

- 充能是**内存态设计**：`ChargeTracker` 用内存 `Map` 记层数、**不落盘**，所以玩家重新登录（relog）会**重置**为满层。
- **这是设计取舍，不是 bug**：相比之下，**冷却会落盘持久化**（防止玩家靠重登刷掉冷却）；充能则刻意只放内存，relog 回满层是可接受的代价（充能本就是"可囤几次的爆发"，不像硬冷却那样需要严防重登刷）。
- 占位符：`%qinhskills_<skill>_charges%`（当前层）、`%qinhskills_<skill>_max_charges%`（上限）。
- ⚠️ 充能技能**不适用** `ready_notify`（就绪提示）——那是二元冷却专属。

---

## 四、GCD 全局冷却（gcd.triggers_ms）

GCD = 放完此技后，**全角色所有技能**短暂封禁一小段时间（防一帧连放多个技能）。底层用 `gcd:global` 键。

```yaml
gcd:
  triggers_ms: 800               # 放完此技后，所有技能封禁 0.8 秒（0=不触发 GCD，也可写顶层 gcd_ms）
  ignore: false                  # true=本技能"不受"GCD（也可写顶层 ignore_gcd）
```

`gcd.ignore: true` 的用途：让某些技能**无视别人留下的 GCD** 直接放——瞬发位移、打断技常这么设，保证关键时刻按了就有。

---

## 五、冲突组（conflict_groups）

冲突组是**「刚出手」的短锁**，和冷却不同：施放后，同组的**其它**技能在一个短窗口内不可放，到点**自动解除**。窗口长度由 config.yml 控制：

```yaml
# config.yml
gate:
  conflict_window_ms: 1000       # 冲突互斥窗口，默认 1000 ms
```

```yaml
# 技能里
conflict_groups:
  - melee_burst                  # 放完后 1 秒内，同组其它技能放不出
```

> **冷却 vs 冲突组的区别**：冷却锁的是「这个技能本身」要等很久；冲突组锁的是「同组别的技能」就一小会儿。冲突组解决的是「刚出手的瞬间别让另一个技能也插进来」。

---

## 六、五者对比表

| 机制 | 作用范围 | 典型用途 | 配置键 | 玩家感受 |
|---|---|---|---|---|
| 基础冷却 | 单个技能 | 控制单技能频率 | `cooldown.base` / `cooldown_ms` | 「这个技能还在转 CD」 |
| 冷却组 | 一组技能 | 一套技能不能连放 | `cooldown.group` / `cooldown_group` | 「放了 A，B C 也一起进 CD」 |
| 充能 | 单个技能 | 可囤几次的爆发/位移 | `cooldown.charges` / `charges` | 「还剩 2 层，可以再放两次」 |
| GCD 全局冷却 | 全角色所有技能 | 防一帧连放 | `gcd.triggers_ms` / `gcd_ms` | 「刚放完，所有技能短暂卡一下」 |
| 冲突组 | 同组其它技能 | 互斥窗口 | `conflict_groups` | 「刚出手那一下，同组别的放不出」 |

---

## 七、完整施放链路（任一不过即拦）

放一个技能要穿过三段检查：**进门控之前的三关**（在 `SkillCastService` 里）→ **门控 `gate.check` 内部的八关**（顺序固定）→ **门控之后的三关**（脚本 / 校验 / 执行）。任意一关不过就拦下、给玩家提示，并返回对应的 `CastResult`。

```
【门控之前·SkillCastService】
  silence 封锁 → 技能 id 解析 → target.required 无目标
        │            │                 │
   SILENCED   SKILL_NOT_FOUND       NO_TARGET
        ▼
【门控内·gate.check（固定顺序）】
  解锁 → 充能/基础冷却 → 冷却组 → GCD → 资源 → 生命/饥饿 → 冲突组 → 条件
        ▼
【门控之后】
  pre_js → 请求校验 → 执行(MM)
     │        │          │
 CONDITION  SCRIPT_     MYTHIC_
 _FAILED    BLOCKED     FAILED
```

### 门控之前的三关（在 `gate.check` 之前）

| 关卡 | 含义 | 不过时的结果码 |
|---|---|---|
| silence 封锁 | 玩家被沉默 / 技能封锁 | `SILENCED` |
| 技能 id 解析 | 给的技能 id 解析不到对应技能 | `SKILL_NOT_FOUND` |
| 目标（required） | `target.required: true` 却没锁到目标 | `NO_TARGET` |

### 门控内 `gate.check` 的八关（固定顺序）

| 关卡 | 不过时的结果码（CastResult） |
|---|---|
| 解锁 | `NOT_UNLOCKED` |
| 充能 / 基础冷却 | `ON_COOLDOWN` |
| 冷却组 | `ON_COOLDOWN` |
| GCD（除非本技 `gcd.ignore`） | `ON_COOLDOWN` |
| 资源 | `INSUFFICIENT_RESOURCE` |
| 生命 / 饥饿 | `INSUFFICIENT_RESOURCE` |
| 冲突组 | `CONFLICT` |
| 条件 | `CONDITION_FAILED` |

### 门控之后的三关

| 关卡 | 含义 | 不过时的结果码 |
|---|---|---|
| `pre_js` | 施放前脚本返回 false | `CONDITION_FAILED` |
| 请求校验 | 请求合法性校验未过 | `SCRIPT_BLOCKED` |
| 执行（MM） | MythicMobs 技能返回 `false` | `MYTHIC_FAILED` |

::: tip 提示
💡 顺序意味着：silence / 解析 / 目标最先查，MM 执行最后兜底。所以一个被沉默的玩家，连解锁、冷却都不会去算；一个没解锁的技能，连冷却都不会去算。GCD 这一关在 `gate.check` 内，但本技能若 `gcd.ignore: true` 则跳过它。
:::

> ⚙ **生命 / 饥饿门控的精确判定**（血祭 / 饿祭类消耗）：
> - **血量**：当 `player.health <= healthCost` 时**放不出**——即血量**正好等于**消耗值也不行（用 `<=`），避免把自己扣死。
> - **饥饿**：当 `foodLevel < hungerCost` 时放不出（用 `<`，严格小于才拦）。
>
> 两者任一不足都返回 `INSUFFICIENT_RESOURCE`。

---

## 八、就绪提示（ready_notify）

冷却结束的**那一刻**，给玩家发 actionbar + 音效。⚠️ **仅二元冷却技能有效，充能技能不适用**。

```yaml
ready_notify:
  enabled: true
  sound: block.note_block.pling           # 音效 id（点号/下划线都行）
  message: "&7{skill} &f已就绪"            # {skill} 替换成显示名
```

---

## 九、玩家提示文案（ON_COOLDOWN）

`ON_COOLDOWN` 拦下时，QS 其实只发**一条** `cooldownInfo()` 消息，按技能类型**二选一**：

| 技能类型 | 文案 | 说明 |
|---|---|---|
| **普通冷却**（二元冷却） | `§c技能冷却中 §7还需 {time}` | `{time}` 取「技能自身冷却 / 冷却组 / GCD」**三者剩余的最大值** |
| **充能技能** | `§c充能 §e{avail}§7/§e{max}` | 充能层数显示；**未满时尾随** ` §7(下一层 {time})`，满则不带 |

::: tip 提示
💡 别把它理解成三种独立文案——底层就两种：普通冷却一条、充能技能一条（充能那条满 / 未满只差结尾的「下一层」后缀）。三个冷却来源（技能 / 冷却组 / GCD）对普通冷却而言是合并取最大剩余、只显示一行。
:::

---

## 十、复现：blade_slash 的相关段（标准范例）

来自自带示例 `skills/combat/blade_slash.yml`，把冷却 / GCD / 冲突 / 就绪提示集于一身：

```yaml
cooldown:
  base: 2500                     # 基础冷却 2.5 秒

# 全局冷却(GCD)：放完此技后 0.8 秒内放任何技能都被拦
gcd:
  triggers_ms: 800

# 冷却就绪提示：冷却结束那一刻发 actionbar + 音效（仅"二元冷却"技能有效；充能技不适用）
ready_notify:
  enabled: true
  sound: block.note_block.pling           # 音效 id（点号/下划线都行）
  message: "&7{skill} &f已就绪"            # {skill} 替换成显示名

# 互斥组：放完后短时间内（config.yml gate.conflict_window_ms，默认 1 秒）同组其它技能不可放
conflict_groups:
  - melee_burst
```

充能写法对照（来自 `movement/dash` 思路，与上面互斥）：

```yaml
cooldown:
  base: 4000
  charges: 2                     # 存 2 层；用充能就别再指望 ready_notify
gcd:
  ignore: true                   # 位移技常设：不受别人的 GCD 影响
```

---

## ✅ 自检清单

- [ ] 单技能频率 → `cooldown.base`；一套技能联动 → `cooldown.group`。
- [ ] 想让技能可囤几次 → `cooldown.charges`（记得它 relog 重置、不支持就绪提示）。
- [ ] 怕一帧连放 → 给关键技能配 `gcd.triggers_ms`；位移/打断技配 `gcd.ignore: true`。
- [ ] 「刚出手别插队」用 `conflict_groups`，不是冷却。
- [ ] `ready_notify` 只给二元冷却技能开。

---

## 继续阅读

- 下一页：[消耗条件与变量](./cost-conditions-variables.md) —— 门控顺序里的「资源 / 生命饥饿 / 条件」细讲。
- [目标与索敌](./targeting.md) —— 门控之前，先选好打谁。
- [施法模式与吟唱](./cast-modes-channeling.md) —— `channel` 的起手/完成扣费与进 CD 时机。
- [技能定义全字段](./skill-definition-fields.md) —— 所有字段速查。
