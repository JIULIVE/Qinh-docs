> 上一页：[自定义GUI.md](./custom-gui.md) · 下一页：[经济动作.md](./economy-actions.md)
> 相关：[脚本入门.md](./scripting-intro.md) · [经济动作.md](./economy-actions.md) · [GUI编程API.md](../04-developer/gui-api.md)

# 🔎 GUI 动作与条件速查

这是一页**纯速查表**：所有点击动作（`type`）、所有显隐条件（`view-requirement`），每个都附可直接照抄的 YAML 片段。GUI 基本结构请先看 [自定义GUI.md](./custom-gui.md)。

---

## 🖱️ 点击动作类型全表（ActionExecutor）

> `type` **不区分大小写**。下表「别名」列里的写法效果完全相同。

| type | 别名 | value 格式 | 说明 |
| --- | --- | --- | --- |
| `command` | `cmd` | 命令（不带 `/`） | **控制台**执行 |
| `console_command` | `console_cmd` | 命令 | 控制台执行（同上） |
| `player_command` | `player_cmd` | 命令 | 以**玩家身份**执行 |
| `message` | `msg` | 文本（`&`码+占位符） | 给玩家发消息 |
| `broadcast` | — | 文本 | 全服广播 |
| `sound` | — | `声音名,音量,音调` | 播放声音 |
| `open_gui` | `gui` | GUI id | 打开另一个菜单 |
| `close` | — | 空 | 关闭菜单 |
| `refresh` | — | 空 | 刷新当前菜单 |
| `teleport` | — | `x,y,z[,世界]` | 传送 |
| `give_item` | — | `材料:数量` | 给物品 |
| `take_item` | — | `材料:数量` | 移除物品 |
| `clear_inventory` | — | 空 | 清空背包 |
| `heal` | — | 数字（默认满血） | 治疗 |
| `feed` | — | 数字（默认 20） | 喂食 |
| `gamemode` | — | `SURVIVAL`/`CREATIVE`/`ADVENTURE`/`SPECTATOR` | 改游戏模式 |
| `fly` | — | `true`/`false`/空（切换） | 飞行开关 |
| `effect` | — | `效果名,时长tick,等级` | 给药水效果 |
| `give_money` | `givemoney` | 见[经济动作.md](./economy-actions.md) | 给钱 |
| `take_money` | `takemoney`,`remove_money` | 见[经济动作.md](./economy-actions.md) | 扣钱 |
| `set_money` | `setmoney` | 见[经济动作.md](./economy-actions.md) | 设置余额 |
| `javascript` | `js`,`run_script`,`script` | 脚本引用或代码 | 执行 JS |

### 📋 逐条示例

```yaml
# command / console_command —— 控制台执行
buy:
  type: command
  value: "give {player} diamond 1"

# player_command —— 玩家身份执行
home:
  type: player_command
  value: "home"

# message —— 给玩家发消息
tip:
  type: message
  value: "&a欢迎，{player}！"

# broadcast —— 全服广播
ann:
  type: broadcast
  value: "&e{player} 触发了隐藏彩蛋！"

# sound —— 声音名,音量,音调
ding:
  type: sound
  value: "ENTITY_EXPERIENCE_ORB_PICKUP,1,1"

# open_gui —— 打开另一个菜单
go:
  type: open_gui
  value: shop

# close —— 关闭（value 留空）
x:
  type: close

# refresh —— 刷新当前菜单
r:
  type: refresh

# teleport —— x,y,z[,世界]
tp:
  type: teleport
  value: "100,64,-200,world"

# give_item / take_item —— 材料:数量
g:
  type: give_item
  value: "GOLDEN_APPLE:3"
t:
  type: take_item
  value: "DIRT:64"

# clear_inventory —— 清空背包
clr:
  type: clear_inventory

# heal —— 数字，留空则满血
h:
  type: heal
  value: "20"

# feed —— 数字，默认 20
f:
  type: feed
  value: "20"

# gamemode
gm:
  type: gamemode
  value: "CREATIVE"

# fly —— true/false/空切换
fl:
  type: fly
  value: "true"

# effect —— 效果名,时长tick,等级
buff:
  type: effect
  value: "SPEED,200,1"

# javascript —— 脚本引用或内联代码
js:
  type: javascript
  value: "myscript.js"
```

> 💰 `give_money` / `take_money` / `set_money` 三个经济动作的 value 写法较复杂（含 provider、currency、失败提示），单独整理在 **[经济动作.md](./economy-actions.md)**。

---

## 🖱️ click-types 取值

`click-types` 决定哪种点击方式会触发这条动作，写成列表：

| 取值 | 含义 |
| --- | --- |
| `LEFT` | 左键 |
| `RIGHT` | 右键 |
| `MIDDLE` | 中键 |
| `ALL` / `ANY` | 任意点击方式 |

```yaml
click-actions:
  left_only:
    click-types: [LEFT]
    type: message
    value: "&a左键"
  any:
    click-types: [ALL]
    type: message
    value: "&7怎么点都行"
```

> 另有 `shift: true` 可叠加，表示「仅 Shift + 点击」时才触发（见 [自定义GUI.md](./custom-gui.md)）。

---

## 👁️ 显隐条件类型全表（ConditionChecker）

`view-requirement` 结构：`type` + `value` + 可选 `negate`（`true` = 取反，不满足才显示）。

| type | 别名 | value | 说明 |
| --- | --- | --- | --- |
| `permission` | — | 权限节点 | 是否拥有权限 |
| `has_item` | — | `材料:数量` | 背包是否有该物品 |
| `level` | — | 比较符+数字，如 `>=10` | 等级 |
| `money` | — | 比较符+数字`[:provider]`，如 `>=1000:money` | 余额 |
| `health` | — | 比较符+数字 | 血量 |
| `food` | — | 比较符+数字（0-20） | 饥饿 |
| `world` | — | 世界名 | 所在世界 |
| `gamemode` | — | `SURVIVAL`/`CREATIVE`/… | 游戏模式 |
| `javascript` | `js`,`script` | 脚本引用/代码（返回布尔） | 自定义 |

### 🔢 比较符
| 符号 | 含义 |
| --- | --- |
| `>=` | 大于等于（**默认**，不写符号时按此） |
| `<=` | 小于等于 |
| `>` | 大于 |
| `<` | 小于 |
| `==` | 等于 |

### 📋 逐条示例

```yaml
# permission —— 有权限才显示
view-requirement:
  type: permission
  value: "myserver.vip"

# has_item —— 背包里有 16 个绿宝石才显示
view-requirement:
  type: has_item
  value: "EMERALD:16"

# level —— 等级 >= 10
view-requirement:
  type: level
  value: ">=10"

# money —— 余额 >= 1000，指定 money 货币
view-requirement:
  type: money
  value: ">=1000:money"

# health —— 血量 > 10
view-requirement:
  type: health
  value: ">10"

# food —— 饥饿 < 6（饿了才显示「吃东西」按钮）
view-requirement:
  type: food
  value: "<6"

# world —— 仅在 world_nether 显示
view-requirement:
  type: world
  value: "world_nether"

# gamemode —— 仅生存模式显示
view-requirement:
  type: gamemode
  value: "SURVIVAL"

# javascript —— 脚本返回 true 才显示
view-requirement:
  type: javascript
  value: "check_vip.js"
```

### 🔁 negate 取反

`negate: true` 把条件反过来——**不满足时才显示**。例如「不是管理员的人才看到的提示」：

```yaml
view-requirement:
  type: permission
  value: "myserver.admin"
  negate: true               # 没有 admin 权限的人才看到这格
```

---

## 🍳 常见组合配方

### 配方 A：购买按钮（条件 + 扣钱 + 给物品 + 提示）

```yaml
"13":
  material: DIAMOND
  name: "&b购买钻石 &7(100 金币)"
  view-requirement:               # 钱不够这格直接不显示
    type: money
    value: ">=100"
  click-actions:
    pay:
      click-types: [LEFT]
      type: take_money
      value: "100 | 余额不足"
    give:
      click-types: [LEFT]
      type: give_item
      value: "DIAMOND:1"
    msg:
      click-types: [LEFT]
      type: message
      value: "&a购买成功，已扣除 100 金币"
```

> ⚠️ 上面三条动作按顺序执行。若想做到「扣钱失败就不发物品」这种**原子事务**，请改用 `javascript` 动作把扣钱与发物品写在一个脚本里，见 [脚本入门.md](./scripting-intro.md)。

### 配方 B：管理员专属按钮（permission）

```yaml
"26":
  material: COMMAND_BLOCK
  name: "&c管理面板"
  view-requirement:
    type: permission
    value: "myserver.admin"       # 只有管理员能看到
  click-actions:
    open:
      type: open_gui
      value: admin_panel
```

### 配方 C：普通玩家提示（permission + negate）

```yaml
"26":
  material: PAPER
  name: "&7你不是管理员"
  view-requirement:
    type: permission
    value: "myserver.admin"
    negate: true                  # 没权限的人才看到
```

### 配方 D：回血按钮（饿了才出现 + 喂食 + 治疗 + 音效）

```yaml
"11":
  material: COOKED_BEEF
  name: "&a补给"
  view-requirement:
    type: food
    value: "<20"                  # 没吃饱才显示
  click-actions:
    feed:
      type: feed
      value: "20"
    heal:
      type: heal
    sound:
      type: sound
      value: "ENTITY_PLAYER_BURP,1,1"
```

---

## 📖 继续阅读
- 🖼️ [自定义GUI.md](./custom-gui.md) — GUI 完整结构与字段
- 💰 [经济动作.md](./economy-actions.md) — 经济三动作的 value 语法
- 📜 [脚本入门.md](./scripting-intro.md) — `javascript` 条件与动作
- 🧰 [GUI编程API.md](../04-developer/gui-api.md) — 开发者扩展动作与数据源
