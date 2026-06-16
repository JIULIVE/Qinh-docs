> 上一页：[配置文件.md](配置文件.md) · 下一页：[GUI动作与条件速查.md](GUI动作与条件速查.md)
> 相关：[脚本入门.md](脚本入门.md) · [经济动作.md](经济动作.md) · [GUI编程API.md](../04-开发者/GUI编程API.md) · [FAQ.md](../05-参考/FAQ.md)

# 🖼️ 自定义 GUI

本篇教你**纯靠 YAML** 给服务器搭建可点击的菜单（GUI）：主菜单、商店、传送站、在线玩家列表……不用写一行代码。看完你就能照抄出能跑的菜单。

---

## 📂 文件位置与加载

| 项目 | 说明 |
| --- | --- |
| 存放目录 | `plugins/QinhCoreLib/guis/` |
| 文件格式 | 任意 `.yml` 文件，一个文件可放**多个** GUI |
| 自动生成 | 首次启动时自动生成 `example.yml` 作示范 |
| GUI ID | 每个**顶级 key** 就是一个 GUI 的 ID |
| 打开命令 | `/qcl gui <id>` |
| 重载命令 | `/qcl reload`（重载全部 GUI） |

> 💡 一个 `.yml` 文件里可以写多个顶级 key，等于在一个文件里定义多个菜单。GUI ID 全服唯一，不同文件里**别重名**。

最小例子（文件 `plugins/QinhCoreLib/guis/menu.yml`）：

```yaml
main_menu:                  # 这个就是 GUI ID，用 /qcl gui main_menu 打开
  title: "&6主菜单"
  rows: 3
  items:
    "13":                   # 槽位 13（第二行正中）
      material: DIAMOND
      name: "&b点我"
      click-actions:
        a1:
          type: message
          value: "&a你点到了！"
```

---

## 🧩 两种摆放模式

QCL 提供两种把物品放进格子的方式，可以二选一，也能混用：

| 模式 | 用什么字段 | 适合 |
| --- | --- | --- |
| **标准模式** | `items`（key = 槽位号） | 槽位固定、菜单简单时 |
| **布局模式** | `layout` + `icons`（字符图案） | 想用「画图」方式排版边框、对称布局时 |

### 🅰️ 标准模式

`items` 下每个 key 是**槽位号**。槽位从 `0` 开始，一行 9 格。key 支持单个、范围、列表混写：

```yaml
items:
  "0-8,9,17":               # 0 到 8、再加 9 和 17，全部放同一个物品
    material: GRAY_STAINED_GLASS_PANE
    name: " "
  "13":
    material: EMERALD
    name: "&a确认"
```

### 🅱️ 布局模式

`layout` 是 **6 行、每行 9 个字符**的图案，每个字符对应 `icons` 里的一个物品。空格 `' '` 通常留空。

```yaml
shop:
  title: "&2商店"
  rows: 6
  layout:
    - "#########"
    - "#       #"
    - "#  AAA  #"
    - "#  AAA  #"
    - "#       #"
    - "####C####"
  icons:
    "#":
      display:                # 布局模式里物品字段放在 display: 之下
        material: BLACK_STAINED_GLASS_PANE
        name: " "
    "A":
      display:
        material: DIAMOND
        name: "&b钻石 100￥"
      action_left: "take_money: 100 | 余额不足"   # icons 专用：简写动作
    "C":
      display:
        material: BARRIER
        name: "&c关闭"
      action: "close"
```

> ⚠️ 布局模式下，物品的 `material`/`name`/`lore` 等字段必须写在 `display:` **子节点**里。
> 💡 `icons` 里支持简写动作字符串：`action`（任意点击）、`action_left`（左键）、`action_right`（右键），格式 `类型: 值`。复杂动作仍建议用 `display:` 下的 `click-actions`（见下）。

---

## ⚙️ GUI 配置字段全表（CustomGuiConfig）

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | 文本 | — | 菜单标题，支持 `&` 颜色码、MiniMessage、`{占位符}` |
| `rows` | 数字 1-6 | `6` | 行数；总格数 = `rows × 9` |
| `update-interval` | 数字(tick) | `0` | 自动刷新周期，`0` = 不刷新 |
| `open-sound` | 文本 | — | 打开时音效，格式 `声音名,音量,音调` |
| `close-sound` | 文本 | — | 关闭时音效，同上格式 |
| `items` | Map | — | **标准模式**静态物品，key 为槽位 |
| `layout` | 列表 | — | **布局模式**字符图案（6 行 9 列） |
| `icons` | Map | — | 布局模式：字符 → 物品映射 |
| `pagination` | 节点 | — | 分页配置（见下） |
| `dynamic-items` | 节点 | — | 动态槽位（运行时数据源填充） |

### 🔊 open-sound / close-sound

格式 `声音名,音量,音调`，音量与音调为数字：

```yaml
open-sound: "ENTITY_PLAYER_LEVELUP,1,1"
close-sound: "BLOCK_CHEST_CLOSE,1,1"
```

### 🔄 自动刷新（update-interval）

单位是 tick（20 tick = 1 秒）。配合 `{time}`、`{online}` 等会变化的占位符，可以做出实时刷新的看板。`0` 表示从不自动刷新。

```yaml
update-interval: 20          # 每秒刷新一次
title: "&e在线人数：{online}"
```

> 玩家手动操作时也可以用 `refresh` 动作主动刷新当前菜单（见动作速查）。

---

## 📦 物品字段全表（CustomGuiItem）

| 字段 | 说明 |
| --- | --- |
| `material` | 物品材质，默认 `STONE` |
| `item` | **物品源引用**，可含 `{占位符}`；填了它就**优先于** `material` |
| `amount` | 数量 |
| `name` | 显示名，支持颜色码与占位符 |
| `lore` | 描述列表（多行） |
| `custom-model-data` | 自定义模型数据（材质包用） |
| `view-requirement` | 显隐条件，不满足则该格不显示（见下） |
| `click-actions` | 点击动作（Map，见下） |

```yaml
"11":
  material: PLAYER_HEAD
  name: "&a{player} 的资料"
  lore:
    - "&7等级：&f{level}"
    - "&7血量：&f{health}/{max_health}"
  amount: 1
  custom-model-data: 1001
```

> 💡 `item` 字段可填物品源引用（如其它 Qinh 模块的物品），并支持 `{占位符}`，详见 [物品源引用.md](物品源引用.md)。

---

## 🖱️ 点击动作结构（ClickAction）

`click-actions` 下每个 **任意 key**（名字随便取，用于区分）就是一条动作：

| 字段 | 说明 |
| --- | --- |
| `click-types` | 触发的点击方式列表：`LEFT` `RIGHT` `MIDDLE` `ALL` `ANY` |
| `type` | 动作类型（不区分大小写，全表见速查页） |
| `value` | 动作参数 |
| `shift` | 可选；`true` = **仅 Shift + 点击**时触发 |

```yaml
click-actions:
  buy:
    click-types: [LEFT]
    type: take_money
    value: "100 | 余额不足"
  info:
    click-types: [RIGHT]
    type: message
    value: "&7右键查看详情"
  quick_sell:
    click-types: [LEFT]
    shift: true               # 仅 Shift+左键
    type: command
    value: "sell all {player}"
```

> 动作类型完整列表与逐个示例见 **[GUI动作与条件速查.md](GUI动作与条件速查.md)**。
> 经济相关动作（`give_money` / `take_money` / `set_money`）的 value 写法见 **[经济动作.md](经济动作.md)**。
> `javascript` 动作让你用脚本写任意逻辑，见 **[脚本入门.md](脚本入门.md)**。

---

## 👁️ 显隐条件结构（view-requirement）

给物品加 `view-requirement`，**条件不满足时这一格直接不显示**。可用来做「管理员专属按钮」「钱够才显示购买键」等。

| 字段 | 说明 |
| --- | --- |
| `type` | 条件类型（全表见速查页） |
| `value` | 条件参数 |
| `negate` | 可选；`true` = 取反（不满足才显示） |

```yaml
"22":
  material: COMMAND_BLOCK
  name: "&c管理面板"
  view-requirement:
    type: permission
    value: "myserver.admin"     # 只有有这个权限的人能看到这格
  click-actions:
    open:
      type: open_gui
      value: admin_panel
```

> 条件类型完整列表、比较符、`negate` 用法与示例见 **[GUI动作与条件速查.md](GUI动作与条件速查.md)**。

---

## 🏷️ 占位符全表（PlaceholderManager）

在 `title`、`name`、`lore`、`value` 等文本里用 `{xxx}` 即可：

### 玩家类
| 占位符 | 含义 | 占位符 | 含义 |
| --- | --- | --- | --- |
| `{player}` | 玩家名 | `{uuid}` | 玩家 UUID |
| `{world}` | 所在世界 | `{x}` `{y}` `{z}` | 坐标 |
| `{health}` | 当前血量 | `{max_health}` | 最大血量 |
| `{food}` | 饥饿值 | `{level}` | 等级 |
| `{exp}` | 经验 | | |

### 全局类
| 占位符 | 含义 |
| --- | --- |
| `{date}` | 日期（`yyyy-MM-dd`） |
| `{time}` | 时间（`HH:mm:ss`） |
| `{online}` | 在线人数 |
| `{max_players}` | 最大玩家数 |

### 分页类（仅分页 / 模板里有效）
| 占位符 | 含义 |
| --- | --- |
| `{page}` | 当前页 |
| `{max_page}` | 总页数 |
| `{has_previous}` | 是否有上一页 |
| `{has_next}` | 是否有下一页 |
| `{item_name}` | 当前条目名 |
| `{item_uuid}` | 当前条目 UUID |
| `{item_index}` | 当前条目序号 |

> 🔌 **PAPI 支持**：当文本里含有 `%` 时，会走 PlaceholderAPI 解析（需安装 PlaceholderAPI）。即 `{}` 是 QCL 内置占位符，`%...%` 是 PAPI 占位符，二者可共存。

---

## 📑 分页（pagination）

用来把「数据列表」（如在线玩家）分页展示。

| 字段 | 说明 |
| --- | --- |
| `source-type` | 数据源类型，内置 `online_players` |
| `source-value` | 传给数据源的参数 |
| `item-slots` | 分页条目占用的槽位（支持范围） |
| `previous-page-slot` | 上一页按钮槽位 |
| `next-page-slot` | 下一页按钮槽位 |
| `page-info-slot` | 可选，页码信息槽位 |
| `item-template` | 每条数据的物品模板（可用分页占位符） |
| `default-action` | 模板自身无 `click-actions` 时的默认动作 |

完整示例见下方「在线玩家分页」配方。

---

## 🛡️ 你需要知道的两个机制

### ⏱️ 150ms 点击节流
菜单内置 **150ms 防连点节流**：同一玩家 150 毫秒内的重复点击会被忽略。所以「连点刷物品」「连点扣钱多次」这类问题 QCL 已替你挡住了，无需自己加冷却。

### 📥 嵌套打开菜单（open_gui）
用 `open_gui` 动作可以从一个菜单跳到另一个菜单，搭出多级菜单树：

```yaml
click-actions:
  goto_shop:
    type: open_gui
    value: shop               # 打开 ID 为 shop 的菜单
```

---

## 📋 完整可照抄示例

### 示例 1：主菜单（标准模式 + 嵌套跳转）

```yaml
main_menu:
  title: "&6&l服务器主菜单"
  rows: 3
  open-sound: "BLOCK_CHEST_OPEN,1,1"
  items:
    "0-26":                        # 整页先铺玻璃板做背景
      material: GRAY_STAINED_GLASS_PANE
      name: " "
    "11":
      material: EMERALD
      name: "&a商店"
      lore:
        - "&7点击进入商店"
      click-actions:
        open:
          click-types: [ALL]
          type: open_gui
          value: shop
    "13":
      material: ENDER_PEARL
      name: "&b传送大厅"
      click-actions:
        tp:
          type: command          # 控制台执行，{player} 自动替换
          value: "spawn {player}"
        msg:
          type: message
          value: "&a正在传送你回主城…"
    "15":
      material: PLAYER_HEAD
      name: "&e在线玩家"
      click-actions:
        open:
          type: open_gui
          value: online_list
    "22":
      material: BARRIER
      name: "&c关闭"
      click-actions:
        close:
          type: close
```

### 示例 2：商店（带显隐条件 + 经济动作）

```yaml
shop:
  title: "&2&l钻石商店"
  rows: 3
  items:
    "0-26":
      material: BLACK_STAINED_GLASS_PANE
      name: " "
    "13":
      material: DIAMOND
      name: "&b购买钻石"
      lore:
        - "&7价格：&e100 金币"
        - "&7左键购买一颗"
      view-requirement:           # 余额不足 100 就不显示这格
        type: money
        value: ">=100"
      click-actions:
        buy:
          click-types: [LEFT]
          type: take_money
          value: "100 | 余额不足，需要 100 金币"
        give:
          click-types: [LEFT]
          type: give_item
          value: "DIAMOND:1"
        ok:
          click-types: [LEFT]
          type: message
          value: "&a购买成功！"
    "22":
      material: ARROW
      name: "&c返回"
      click-actions:
        back:
          type: open_gui
          value: main_menu
```

> ⚠️ 同一格上的多条动作（`buy`/`give`/`ok`）会**按顺序全部执行**。务必把扣钱放在给物品之前；若想做「钱不够则整体不执行」，可在 `take_money` 失败时它本身就不会再扣，但 `give_item` 仍是独立动作——更稳妥的「条件式购买」请用脚本，见 [脚本入门.md](脚本入门.md) 与速查页的「购买按钮配方」。

### 示例 3：在线玩家分页

```yaml
online_list:
  title: "&9在线玩家 &7({page}/{max_page})"
  rows: 6
  update-interval: 40              # 每 2 秒刷新一次列表
  items:
    "45-53":
      material: GRAY_STAINED_GLASS_PANE
      name: " "
  pagination:
    source-type: online_players
    item-slots: "0-44"             # 头像铺前 5 行
    previous-page-slot: 45
    next-page-slot: 53
    page-info-slot: 49
    item-template:
      material: PLAYER_HEAD
      name: "&a{item_name}"
      lore:
        - "&7点击操作（序号 {item_index}）"
      default-action:              # 模板自身没写 click-actions 时用这个
        type: message
        value: "&7你选择了 {item_name}"
```

---

## 📖 继续阅读
- ➡️ [GUI动作与条件速查.md](GUI动作与条件速查.md) — 所有点击动作 / 显隐条件的逐条示例
- 💰 [经济动作.md](经济动作.md) — `give_money` / `take_money` / `set_money` 的完整语法
- 📜 [脚本入门.md](脚本入门.md) — 用 `javascript` 写自定义条件与动作
- 🧰 [GUI编程API.md](../04-开发者/GUI编程API.md) — 开发者从代码注册动态数据源
- ❓ [FAQ.md](../05-参考/FAQ.md) — 常见问题
