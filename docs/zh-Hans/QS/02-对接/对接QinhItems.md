# 对接 QinhItems：在物品里加 `qinhskills:cast` 动作

> 上一页：[对接总览](./integration-overview.md)　·　下一页：[对接 MythicMobs](./mythicmobs-integration.md)

这一页教你：**用 QinhItems（QI）做一把武器，让它按键释放 QS 技能。** 这是最「原生」的接法——QI 出厂就内置了 `qinhskills:cast` 这个动作处理器（handler），不需要装别的桥。

读完你会知道：怎么在物品 YAML 里写这个动作、`handler:` / `payload:` 为什么**必须用展开写法**、物品按键怎么和技能触发对应、payload 的三种写法、以及一份逐段讲解的完整范本。

> 先回顾铁律：**QI 只负责把「按键」变成「放某个技能」，它不写技能逻辑、不算伤害、不直接调 MM。** 详见 [对接总览](./integration-overview.md)。

---

## 🧩 一、动作长什么样：最小骨架

在 QI 物品 YAML 里，「按键触发技能」写在 `actions.triggers` 段。最小骨架：

```yaml
my_item:
  actions:
    triggers:
      left_click:                    # 触发器名（自定义，随便起）
        trigger:
          atom: left_click           # 触发原子：玩家做什么动作
        refs:                        # 按顺序执行的处理器引用
          - handler: qinhskills:cast # 固定 handler，把技能交给 QS
            payload: "blade_slash"   # payload = QS 技能 id
```

读法：**玩家左键 → QI 捕获 → 调 handler `qinhskills:cast` → 把 payload `blade_slash` 交给 QS → QS 跑门控后调 MM 放技能。**

---

## ⚠️ 二、最容易踩的坑：`handler` 含冒号，必须用展开写法

QI 的动作引用支持两种写法。但 `qinhskills:cast` 这个 handler id **本身就含一个冒号**，所以你**只能**用「展开写法」：

✅ **正确（展开写法，handler / payload 分两行）：**

```yaml
refs:
  - handler: qinhskills:cast
    payload: "blade_slash"
```

❌ **错误（单行简写）：**

```yaml
refs:
  - "qinhskills:cast: blade_slash"   # ☠ 会被「第一个冒号」拆错！
```

> 为什么？单行简写的格式是 `<handler>: <payload>`，YAML 解析时会按**第一个冒号**切分。而 `qinhskills:cast` 自己就有冒号，于是会被错误地切成 handler=`qinhskills`、payload=`cast: blade_slash`，完全错位。**记住：凡是 handler id 含冒号，一律用 `handler:` / `payload:` 展开写法。**

---

## 🎮 三、物品按键（atom） ↔ 技能触发（trigger.primary）

QI 物品上能用的**触发原子（atom）**，和 QS 技能里的 `trigger.primary` 是一一对应的概念。常用对应表：

| QI 物品 atom | 含义 | 对应 QS `trigger.primary` |
|---|---|---|
| `left_click` | 左键（挥动，最可靠） | `LEFT_CLICK` |
| `right_click` | 右键 | `RIGHT_CLICK` |
| `shift_left_click` | 潜行 + 左键 | `SHIFT_LEFT_CLICK` |
| `shift_right_click` | 潜行 + 右键 | `SHIFT_RIGHT_CLICK` |
| `shift_toggle` | 潜行切换（开关技常用） | `SHIFT_TOGGLE` |

> 💡 **最佳实践：让物品 atom 和技能的 `trigger.primary` 对上。** 比如技能 `dash` 配的是 `trigger.primary: SHIFT_RIGHT_CLICK`，那物品就用 `shift_right_click` 触发它。
>
> 如果**对不上**会怎样？QS 不会报错——它会**回退到技能的入口节点**，技能仍然能放，只是连招 / 分支可能走不到你预期的那条。所以「对不上仍能放，但最好对上」。

> 🖼️ **[图片占位]** 五种 atom 对应的玩家操作示意（左键 / 右键 / 潜行组合 / 切换）　·　建议 `assets/qi-atom-triggers.png`

---

## 📦 四、payload 的三种写法

物品传给 QS 的 `payload`，由 QS 内部的 `PayloadParser` 解析，支持**三种**写法。技能 id 一律会被转成小写。

| 写法 | 例子 | 解析结果 |
|---|---|---|
| **① 纯技能 id** | `payload: "fire_wave"` | `skill = fire_wave` |
| **② 带触发模式** | `payload: "fire_wave:RIGHT_CLICK"` | `skill = fire_wave`，`triggerMode = RIGHT_CLICK` |
| **③ JSON** | `payload: '{"skill":"demo_slash_charged","source":"qinhitems","context":{"mode":"LEFT_CLICK"}}'` | `skill = demo_slash_charged`，外加 `source` / `context.mode` |

JSON 写法识别的键：

| JSON 键 | 必填 | 含义 |
|---|---|---|
| `skill` | ✅ 必填 | 技能 id |
| `source` | 可选 | 触发来源标记（如 `qinhitems`），会作为变量传给 MM |
| `context.mode` | 可选 | 触发模式（如 `LEFT_CLICK`） |

> 📌 三种写法选哪个？日常用 **① 纯技能 id** 就够了。要让 MM 那边能读到 `source` / `mode` 做分支时，才用 ③ JSON。

---

## 📄 五、完整范本：`qinhitems_action_example.yml` 逐段讲解

下面是 QS 首次启动释放到 `plugins/QinhSkills/integrations/qinhitems_action_example.yml` 的**官方范本，原样照抄**。它造一把武器：**左键放「刃斩」、潜行+右键放「疾冲」**。

> 用法：把这份内容复制到 `plugins/QinhItems/items/` 下（可改文件名），然后 `/qi reload`。

```yaml
#==============================================================================
#  【对接示例 1/4】QinhItems 物品  →  触发 QS 技能
#
#  把本文件复制到   plugins/QinhItems/items/   下(可改名)，然后  /qi reload。
#  它造一把武器:左键放「刃斩」、潜行+右键放「疾冲」。按键由 QI 捕获，经 handler
#  qinhskills:cast 发给 QS，QS 跑完门控(解锁/冷却/消耗/目标)后交 MythicMobs 出效果。
#
#  ★ 关键分工(务必理解,后面三个示例同此)：
#     QinhItems = 把"按键"变成"放某个技能"(本文件干的事)，不写技能逻辑、不算伤害。
#     QinhSkills= 解锁/冷却/消耗/目标/连招 等门控，然后调 MM。
#     MythicMobs= 真正的粒子/位移/伤害表现(见对接示例 3)。
#     属性插件(AttributePlus 等) = 算最终伤害数值。
#  ⚠ QI 和 QS 都【不内置任何属性 / 伤害】。武器攻击力写在 providers.ap 交给 AttributePlus。
#==============================================================================

# 顶层键 = 物品ID(全局唯一)；改完执行 /qi reload 生效
demo_fire_blade:
  type: weapon                       # 物品类型(对应 items/weapon.yml 那一套规则)
  material: golden_sword             # 底物材质(原版材质名)
  display_name: "<gold>炎刃剑</gold>" # 悬浮名(MiniMessage 或 &色码)
  item_name: "炎刃剑"
  tier: RARE                         # 品质 COMMON/UNCOMMON/RARE/EPIC/LEGENDARY
  lore:
    - ""
    - "<gray>左键:刃斩   ｜   潜行+右键:疾冲</gray>"
    - "<dark_gray>技能表现由 MythicMobs 呈现，伤害由属性插件结算</dark_gray>"

  # 物品属性 → 交给 AttributePlus(QI 不内置数值)。
  # ⚠ 键必须是 AP 里配置的"显示名"(AP 默认只有「物理伤害」；其余属性要先在
  #    plugins/AttributePlus/attribute.yml 里定义好,否则不生效)。
  providers:
    ap:
      value:
        物理伤害: 50                  # 普攻伤害由 AP 应用;技能伤害同样走 AP(QI 这边只是声明数值)

  options:
    glow: false
    max_stack_size: 1

  # 动作:按键 → 触发技能
  actions:
    triggers:
      # 左键最可靠(挥动随时触发)。这里对应 QS 里 trigger.primary: LEFT_CLICK 的「刃斩」
      left_click:
        trigger:
          atom: left_click           # 可用原子:left_click / right_click / shift_left_click / shift_right_click / shift_toggle
        # cooldown: 1s               # (可选)QI 侧动作冷却;技能真正的冷却建议在 QS 技能文件里配,别两边重复
        refs:
          # ⚠ handler 固定 qinhskills:cast(本身含冒号)——必须用 handler:/payload: 的展开写法,
          #    不能写成 "- qinhskills:cast: xxx" 的单行简写(会被首个冒号拆错)
          - handler: qinhskills:cast
            payload: "blade_slash"   # payload = QS 技能id;也支持 JSON 写法: '{"skill":"blade_slash"}'

      # 潜行+右键 → 疾冲(QS 里 dash 的 trigger.primary 正是 SHIFT_RIGHT_CLICK)
      shift_right_click:
        trigger:
          atom: shift_right_click
        refs:
          - handler: qinhskills:cast
            payload: "dash"

#------------------------------------------------------------------------------
# 排查提示:
#  · payload 的技能必须是【玩家已解锁】的——QS 默认未解锁会拦下并提示。测试可
#    /qs unlock blade_slash，或写进 QS config.yml 的 unlock.starter_skills，或 unlock.default_all: true。
#  · 物品按键的 atom 最好和 QS 技能的 trigger.primary 对应(对不上时 QS 会回退到入口节点,仍能放)。
#  · 别在同一动作里再写 mythicmobs:cast —— MM 一律由 QS 调，避免 QI/QS/MM 三方抢权。
#  · 完整验收:  /qs reload → /qi reload → /qi give @p demo_fire_blade → 左键/潜行右键试放。
#==============================================================================
```

### 逐段拆解

| 段落 | 在干什么 | 注意点 |
|---|---|---|
| `demo_fire_blade:` | 物品 id（全局唯一） | 改完要 `/qi reload` |
| `type` / `material` / `display_name` / `tier` / `lore` | 物品外观 | 跟普通 QI 物品一样，与技能无关 |
| `providers.ap.value.物理伤害: 50` | 把攻击力交给 **AttributePlus** | ⚠ 键名必须是 AP 里定义好的「显示名」；QI 自己不算伤害 |
| `actions.triggers.left_click` | 左键 → 刃斩 | atom `left_click` 对应技能 `blade_slash` 的 `trigger.primary: LEFT_CLICK` |
| `# cooldown: 1s`（被注释掉） | QI 侧动作冷却 | ⚠ **故意注释掉**——冷却让 QS 管，别两边重复 |
| `handler: qinhskills:cast` / `payload: "blade_slash"` | 把技能交给 QS | 展开写法，payload 是技能 id |
| `shift_right_click` → `payload: "dash"` | 潜行右键 → 疾冲 | atom `shift_right_click` 对应 `dash` 的 `trigger.primary: SHIFT_RIGHT_CLICK` |

---

## 🚫 六、两个「千万别做」

| 别做的事 | 为什么 | 应该怎样 |
|---|---|---|
| **别在 QI 和 QS 两边都配冷却** | 会双重冷却 / 互相打架 | **冷却让 QS 管**（写在技能文件里）。范本里 QI 的 `cooldown:` 是注释掉的 |
| **别在同一动作里再加 `mythicmobs:cast`** | 会造成 QI / QS / MM 三方抢权（架构分裂） | **MM 一律由 QS 调**。物品里只写 `qinhskills:cast`，绝不直接调 MM |

> 这两条都是「四方分工铁律」的直接推论：**QS 是唯一的冷却数据真实源，MM 永远由 QS 驱动。** 详见 [对接 MythicMobs → 为何不直接调 MM](./mythicmobs-integration.md)。

---

## 🩺 七、排错清单

按键放不出技能？逐项排查：

| 现象 | 可能原因 | 解决 |
|---|---|---|
| 提示「技能未解锁」 | payload 的技能玩家没解锁 | `/qs unlock blade_slash`；或配 `unlock.starter_skills`；或 `unlock.default_all: true` |
| 按键完全没反应 | handler 写成了单行简写被拆错 | 改成 `handler:` / `payload:` 展开写法（见第二节） |
| 按键没反应 + 控制台无日志 | 没 `/qi reload`；或 atom 不对 | 重载；核对 atom 拼写 |
| 技能放出来只有一条文字 `[QinhSkills] 技能名` | MM 里没有同名技能 | 去 [对接 MythicMobs](./mythicmobs-integration.md) 配 MM 表现 |
| 连招 / 分支没走到预期那条 | atom 与技能 `trigger.primary` 对不上 | 让 atom 对应技能的 `trigger.primary` |
| `qinhskills:cast` handler 不存在 | QS 比 QI 先加载且没补注册 | 一般会自动补注册；实在不行 `/qs reload` → `/qi reload` |

---

## ✅ 八、验收命令

照这个顺序敲一遍，就能端到端验证通了：

```text
/qs reload                          # 重载 QS（技能、解锁、桥）
/qi reload                          # 重载 QI（物品、动作绑定）
/qi give @p demo_fire_blade         # 把范本武器给自己
# 然后：左键试放「刃斩」，潜行+右键试放「疾冲」
```

> 如果技能放出来只有占位文字而没有粒子/伤害，那说明 QS 这侧已经通了，只差 MM 表现——这正是下一页要补的。

---

## 继续阅读

- 配技能的 MM 表现（粒子 / 伤害 / 位移） → [对接 MythicMobs](./mythicmobs-integration.md)
- 不用 QI、用别的物品插件？ → [对接其他物品插件](./other-item-plugins.md)
- 想搞懂「按键 → 放出技能」中间发生了什么 → [执行链路与事件](./cast-flow-events.md)
