# graph 与连招

> 上一页：[技能定义全字段](./skill-definition-fields.md)　·　下一页：[施法模式与吟唱](./cast-modes-channeling.md)

这一页讲 **graph（执行图）怎么写、节点怎么选、连招（combo）的底层原理**。读完你能做出"右 → 右 → 左放终结技"这类连招。

graph 听起来高级，其实最简单的技能就一个"入口节点"。连招才是 graph 真正发光的地方——我们一步步来。

> 🖼️ **[图片占位]** 一张连招状态流转图（IDLE → 起手 → COMBO_WINDOW → 续段 / 终结）　·　建议 `assets/combo-state-flow.png`

---

## 🗺️ graph 是什么

graph 回答一件事：**"在某个状态下按了某个键，走哪个节点、放哪个 MM 技能。"**

它放在 `plugins/QinhSkills/graphs/<分类>/xxx.graph.yml`，结构如下：

```yaml
graph_id: <小写，和技能 graph.entry 对齐>
entry: <入口节点名>
nodes:
  <node_id>:
    skill_id: <可选，默认 = nodeId>
    mythic_skill: <必需，真正执行的 MM 技能>
    require_state: <默认 IDLE>
    triggers: [<TriggerType...>]
combos:        # 可选，做连招才写
  - id: <连招 id>
    inputs: [<TriggerType...>]
    window_ms: <默认 800>
    finalize_skill: <本 graph 里某个 node id>
```

### 顶层字段

| 字段 | 说明 |
|---|---|
| `graph_id` | 图的 id，**全小写**，要和技能的 `graph.entry` 对齐 |
| `entry` | 入口节点名（玩家空闲起手时走它） |
| `nodes` | 所有节点 |
| `combos` | 连招定义（可选） |

### 节点字段（nodes.\<node_id\>）

| 字段 | 必需 | 默认 | 说明 |
|---|---|---|---|
| `skill_id` | 否 | = nodeId | 该节点对应的技能 id |
| `mythic_skill` | **是** | — | 真正执行的 MM 技能 |
| `require_state` | 否 | `IDLE` | 走此节点所需状态（见下方状态机） |
| `triggers` | 否 | `[RIGHT_CLICK]` | 命中哪些 TriggerType 走此节点 |

`require_state` 取值：`IDLE` / `CASTING` / `COMBO_WINDOW` / `RECOVERY` / `LOCKED` / `INTERRUPTED`。

---

## 🧩 最简单的 graph：一个入口节点

非连招技能，graph 就一个入口节点。这是 `fire_wave` 的 graph，**逐字段照抄即可**：

```yaml
graph_id: fire_wave             # 要和技能文件 graph.entry 同名
entry: fire_wave                # 入口节点名

nodes:
  fire_wave:                    # 入口节点（名字 = entry）
    skill_id: fire_wave
    mythic_skill: fire_wave     # 真正执行的 MM 技能
    require_state: IDLE         # 需要"空闲"状态才能从这里起手
    triggers:                   # 命中这些键就走本节点（可多写几个键）
      - RIGHT_CLICK
```

必须和技能文件 `fire_wave.yml` 对上：

| graph 里 | 技能 yml 里 | 关系 |
|---|---|---|
| graph `graph_id` / graph `entry` / 入口节点 node_id | `graph.entry` | **四处同名** = `fire_wave`（技能 `graph.entry` == graph `graph_id` == graph `entry` == 入口节点名） |
| 节点 `mythic_skill` | `execution.mythic_skill` | 一致 |
| 节点 `require_state` | `state.required` | 一致 |
| 节点 `triggers` | `trigger.primary` | triggers 要**包含** primary |

::: tip 提示
💡 99% 的简单技能，graph 就这样一个节点，写完几乎不用再碰。
:::

---

## 🎯 节点选择逻辑

当玩家按键，QS 怎么决定走哪个节点？规则在 `SkillGraphResolver.findNodeByTrigger`，**三步回退**：

```text
① 先找：trigger 命中 且 require_state == 当前状态  的节点
        ↓ 没有
② 再找：任意 trigger 命中的节点
        ↓ 没有
③ 回退：entry 入口节点
```

| 步骤 | 匹配条件 | 用途 |
|---|---|---|
| ① | trigger 命中 **且** 状态匹配 | **连招的关键**——靠状态区分起手 / 续段 |
| ② | 只要 trigger 命中 | 状态对不上时的兜底 |
| ③ | 都不命中 | 总有入口节点保底，不会"按了没反应" |

::: tip 提示
💡 **第 ① 步是连招能成立的核心。** 同一个右键，在 `IDLE` 命中起手节点，在 `COMBO_WINDOW` 命中续段节点——靠的就是 `require_state` 不同。
:::

---

## 🔄 状态机：连招的舞台

QS 给每个玩家维护一个状态机。连招全靠这几个状态切换：

```text
IDLE ──IDLE 时按键起手成功──► CASTING
CASTING ──成功且该技能有 combo──► COMBO_WINDOW
COMBO_WINDOW ──窗口内继续按──► 续段 / 触发终结技
COMBO_WINDOW ──超过 window_ms 没续上──► IDLE   (连招断)
任意状态 ──/qs silence N──► LOCKED   (沉默封锁，N 秒后回 IDLE)
```

| 状态 | 含义 |
|---|---|
| `IDLE` | 空闲，可正常起手 |
| `CASTING` | 施放中 |
| `COMBO_WINDOW` | **连招窗口**，此窗内的输入算"续段" |
| `RECOVERY` | 后摇（预留） |
| `LOCKED` | 被沉默（silence），放不出任何技能 |
| `INTERRUPTED` | 吟唱 / 施放被打断 |

---

## 🥋 连招原理（重点）

连招由三样东西配合：**多个节点** + **`require_state` 区分起手 / 续段** + **`combos` 段**。

**核心机制**：

1. 起手节点 `require_state: IDLE`；续段 / 终结节点用**同样的 trigger** 但 `require_state: COMBO_WINDOW`。
2. 起手成功后玩家进入 `COMBO_WINDOW`，此时同一个键会因为状态不同而命中续段节点（节点选择逻辑第 ① 步）。
3. `ComboResolver` 匹配前会先检查 **`当前状态 == combo.state_required`**（默认 `COMBO_WINDOW`）——状态不符则**跳过该 combo**。
4. 状态匹配后，`ComboResolver` 只保留"距离现在 ≤ `window_ms`"的历史输入（**滑动窗口**），再看其最后 N 个是否等于 `combo.inputs`；相等即触发 `finalize_skill` 那个节点。也就是说，**整套序列从第一下到最后一下的总跨度必须 ≤ `window_ms`**，否则最早那下会被淘汰、连招判定失败。

### combos 段字段

| 字段 | 必需 | 默认 | 说明 |
|---|---|---|---|
| `id` | 是 | — | 连招 id |
| `inputs` | 是 | — | **完整输入序列**（含起手那一下） |
| `window_ms` | 否 | `800` | 整套序列的**滑动时间窗口**；从第一下到最后一下的总跨度须 ≤ 此值，否则最早那下被淘汰、连招断 |
| `state_required` | 否 | `COMBO_WINDOW` | 触发该连招所需的玩家状态；**一般无需配置**（源码字段名 `state_required`） |
| `finalize_skill` | 是 | — | **必须是本 graph nodes 里的一个 node id** ⚠ 字段名是 `finalize_skill`，不是 `_id` |

---

## 🔥 完整连招示例：右 → 右 → 左

下面复现 `fire_combo_finisher` 这套连招的**全部三个文件**，逐字段照抄。

### 文件 1：技能定义 `skills/combo/fire_combo_finisher.yml`

```yaml
id: fire_combo_finisher
display: "&c&l炎爆连舞"

meta:
  category: combo
  type: active
  rank: advanced
trigger:
  primary: RIGHT_CLICK          # 起手键
state:
  required: IDLE
graph:
  entry: fire_combo_finisher
execution:
  mythic_skill: fire_combo_strike   # 起手那一下的 MM 技能；要和入口节点 mythic_skill 一致

type: active
max_level: 1

cooldown:
  base: 0                       # ★ 连招技冷却设 0，连段才按得出（真正冷却放到终结技的 MM 技能里）

# 不写 resource：起手不收蓝，避免连段中途断蓝。真要收费就配在终结技对应的 MM 技能里。
```

### 文件 2：graph `graphs/combo/fire_combo_finisher.graph.yml`

```yaml
graph_id: fire_combo_finisher
entry: fire_combo_finisher

nodes:
  fire_combo_finisher:          # ① 起手节点（空闲时右键）
    skill_id: fire_combo_finisher
    mythic_skill: fire_combo_strike
    require_state: IDLE
    triggers:
      - RIGHT_CLICK

  fire_combo_chain:             # ② 连段中再次右键的"普通斩"（连招窗口内）
    skill_id: fire_combo_chain
    mythic_skill: fire_combo_strike
    require_state: COMBO_WINDOW
    triggers:
      - RIGHT_CLICK

  fire_combo_blaze:             # ③ 终结技节点（被下面 combos.finalize_skill 指向）
    skill_id: fire_combo_blaze
    mythic_skill: fire_combo_blaze
    require_state: COMBO_WINDOW
    triggers:
      - LEFT_CLICK

# 连段定义：在连招窗口内，最近输入凑齐 inputs 序列 → 放 finalize_skill 节点
combos:
  - id: blaze
    inputs: [RIGHT_CLICK, RIGHT_CLICK, LEFT_CLICK]   # 完整输入序列（含起手那一下）
    window_ms: 1500             # 整套序列的时间窗口(ms)：从第一下到最后一下要在这个时间内打完
    finalize_skill: fire_combo_blaze                 # ⚠ 必须是上面 nodes 里真实存在的节点名
```

### 三个节点各管什么

| 节点 | `require_state` | `triggers` | 角色 |
|---|---|---|---|
| `fire_combo_finisher` | `IDLE` | `RIGHT_CLICK` | ① 起手（空闲时右键） |
| `fire_combo_chain` | `COMBO_WINDOW` | `RIGHT_CLICK` | ② 续段（窗口内再右键） |
| `fire_combo_blaze` | `COMBO_WINDOW` | `LEFT_CLICK` | ③ 终结（窗口内左键，被 combo 指向） |

> 注意 ① 和 ② 的 trigger 都是 `RIGHT_CLICK`，靠 `require_state` 区分——这正是连招原理的落地。

---

## 🚶 逐步走查：右 → 右 → 左

跟着这张表走一遍，连招怎么跑就彻底清楚了：

| 步骤 | 玩家操作 | 当前状态 | 节点选择（三步逻辑） | 走哪个节点 | 放的 MM 技能 | 状态变化 |
|---|---|---|---|---|---|---|
| 1 | 右键 | `IDLE` | ① RIGHT_CLICK 命中 + 状态 IDLE → `fire_combo_finisher` | 起手 | `fire_combo_strike` | 起手成功且有 combo → **进 COMBO_WINDOW** |
| 2 | 右键 | `COMBO_WINDOW` | ① RIGHT_CLICK 命中 + 状态 COMBO_WINDOW → `fire_combo_chain` | 续段 | `fire_combo_strike` | 刷新窗口，保持 COMBO_WINDOW |
| 3 | 左键 | `COMBO_WINDOW` | 最近输入 = [右,右,左] == `inputs` 且在 `window_ms` 内 → 触发 `finalize_skill` | 终结 `fire_combo_blaze` | `fire_combo_blaze` | 连招完成 → 回 IDLE |

::: tip 提示
💡 第 3 步，QS 不是简单"左键命中哪个节点"，而是 `ComboResolver` 发现**最近三个输入恰好凑成 `[RIGHT_CLICK, RIGHT_CLICK, LEFT_CLICK]`**，直接放出 `finalize_skill` 指向的 `fire_combo_blaze` 节点。
:::

**如果中途超时呢？** 第 1 步右键后，超过 `window_ms`（这里 1500ms）没按出第 2 下 → 状态回 `IDLE`，连招断，下一次右键又从起手重新开始。

---

## ⚠️ 连招常见坑

| 坑 | 现象 | 解法 |
|---|---|---|
| **`finalize_skill` 不是 node id** | 终结技放不出 / reload 报错 | `finalize_skill` 必须**完全等于** `nodes` 里某个节点名（不是 MM 技能名，不是 `_id`） |
| **字段名写成 `finalize_skill_id`** | 连招永远不触发 | 字段名就是 **`finalize_skill`**，别加 `_id` |
| **`window_ms` 太短** | 手速跟不上，连招老断 | 调大 `window_ms`（默认全局 `combo_window_ms` 是 800ms，单条 combo 可覆盖） |
| **续段节点忘了 `require_state: COMBO_WINDOW`** | 续段被当成起手，连招凑不齐 | 续段 / 终结节点务必写 `require_state: COMBO_WINDOW` |
| **连招技能配了冷却** | 起手进 CD，第二下被拦，连段断 | 连招技 `cooldown.base: 0`，真正冷却交给终结技的 MM 技能 |
| **起手不收蓝写了 resource** | 中途断蓝连不下去 | 起手技不写 `resource`，收费放到终结技 MM 技能里 |

---

## 🔠 TriggerType 全集

`trigger.primary`、节点 `triggers`、连招 `inputs`、被动内部都用这套枚举（**大小写敏感，原样照抄**）：

| 触发 | 含义 |
|---|---|
| `RIGHT_CLICK` / `LEFT_CLICK` | 右键 / 左键 |
| `SHIFT_RIGHT_CLICK` / `SHIFT_LEFT_CLICK` | 潜行右键 / 潜行左键 |
| `SHIFT_TOGGLE` | 潜行开关 |
| `DOUBLE_RIGHT_CLICK` / `DOUBLE_LEFT_CLICK` | 双击右键 / 双击左键 |
| `HOLD_RIGHT_CLICK` / `HOLD_LEFT_CLICK` | 长按右键 / 长按左键 |
| `PASSIVE` | 被动 |
| `COMMAND` | 命令 |
| `API` | 外部 API |
| `CI_TEST` | 内部测试用 |

---

## ✅ 小结

- graph 决定"按某键 → 走某节点 → 放某 MM 技能"；简单技能就一个入口节点。
- 节点选择三步回退：状态+trigger 都中 → 仅 trigger 中 → 回退 entry。
- 连招 = 起手节点（`IDLE`）+ 续段节点（同 trigger 但 `COMBO_WINDOW`）+ `combos` 段。
- `combos.finalize_skill` 必须是本 graph 里**真实存在的 node id**。
- 连招技 `cooldown.base: 0`，否则起手进 CD 把连段拦断。

---

## 继续阅读

- 技能定义所有字段 → [技能定义全字段](./skill-definition-fields.md)
- 文件目录与命名 → [技能文件结构](./skill-file-structure.md)
- 状态机 / 沉默 / 管线全貌 → [核心概念](../01-getting-started/core-concepts.md)
- 吟唱 / 开关施法模式 → [施法模式与吟唱](./cast-modes-channeling.md)
- 被动技能触发 → [被动技能](./passive-skills.md)
