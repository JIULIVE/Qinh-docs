> Previous: [配置文件.md](配置文件.md) · Next: [GUI动作与条件速查.md](GUI动作与条件速查.md)
> Related: [脚本入门.md](脚本入门.md) · [经济动作.md](经济动作.md) · [GUI编程API.md](../04-开发者/GUI编程API.md) · [FAQ.md](../05-参考/FAQ.md)

# 🖼️ Custom GUI

This page teaches you how to build clickable menus (GUIs) for your server **purely with YAML**: main menus, shops, teleport hubs, online-player lists… without writing a single line of code. After reading it, you'll be able to copy out working menus.

---

## 📂 File Location & Loading

| Item | Description |
| --- | --- |
| Storage directory | `plugins/QinhCoreLib/guis/` |
| File format | Any `.yml` file; a single file can hold **multiple** GUIs |
| Auto-generated | On first startup, `example.yml` is generated as a demo |
| GUI ID | Each **top-level key** is the ID of one GUI |
| Open command | `/qcl gui <id>` |
| Reload command | `/qcl reload` (reloads all GUIs) |

> 💡 A single `.yml` file can contain multiple top-level keys, which is equivalent to defining multiple menus in one file. GUI IDs are unique server-wide — **don't reuse names** across different files.

Minimal example (file `plugins/QinhCoreLib/guis/menu.yml`):

```yaml
main_menu:                  # This is the GUI ID; open with /qcl gui main_menu
  title: "&6Main Menu"
  rows: 3
  items:
    "13":                   # Slot 13 (center of the second row)
      material: DIAMOND
      name: "&bClick me"
      click-actions:
        a1:
          type: message
          value: "&aYou clicked it!"
```

---

## 🧩 Two Placement Modes

QCL provides two ways to place items into slots. You can pick either one, or mix them:

| Mode | Field used | Best for |
| --- | --- | --- |
| **Standard mode** | `items` (key = slot number) | Fixed slots, simple menus |
| **Layout mode** | `layout` + `icons` (character pattern) | When you want to "draw" borders or symmetrical layouts |

### 🅰️ Standard Mode

Each key under `items` is a **slot number**. Slots start at `0`, with 9 per row. Keys support a single value, a range, or a comma-separated list, all mixed together:

```yaml
items:
  "0-8,9,17":               # 0 through 8, plus 9 and 17, all get the same item
    material: GRAY_STAINED_GLASS_PANE
    name: " "
  "13":
    material: EMERALD
    name: "&aConfirm"
```

### 🅱️ Layout Mode

`layout` is a pattern of **6 rows, 9 characters each**, where each character corresponds to one item in `icons`. A space `' '` is usually left empty.

```yaml
shop:
  title: "&2Shop"
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
      display:                # In layout mode, item fields go under display:
        material: BLACK_STAINED_GLASS_PANE
        name: " "
    "A":
      display:
        material: DIAMOND
        name: "&bDiamond 100￥"
      action_left: "take_money: 100 | Insufficient balance"   # icons-only: shorthand action
    "C":
      display:
        material: BARRIER
        name: "&cClose"
      action: "close"
```

> ⚠️ In layout mode, an item's `material`/`name`/`lore` and similar fields must be written under the `display:` **child node**.
> 💡 `icons` support shorthand action strings: `action` (any click), `action_left` (left click), `action_right` (right click), in the format `type: value`. For complex actions, it's still recommended to use `click-actions` under `display:` (see below).

---

## ⚙️ Full GUI Config Field Table (CustomGuiConfig)

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | Text | — | Menu title; supports `&` color codes, MiniMessage, and `{placeholders}` |
| `rows` | Number 1-6 | `6` | Number of rows; total slots = `rows × 9` |
| `update-interval` | Number (ticks) | `0` | Auto-refresh period; `0` = no refresh |
| `open-sound` | Text | — | Sound played on open, format `soundName,volume,pitch` |
| `close-sound` | Text | — | Sound played on close, same format as above |
| `items` | Map | — | **Standard mode** static items, key is the slot |
| `layout` | List | — | **Layout mode** character pattern (6 rows × 9 columns) |
| `icons` | Map | — | Layout mode: character → item mapping |
| `pagination` | Node | — | Pagination config (see below) |
| `dynamic-items` | Node | — | Dynamic slots (filled by a data source at runtime) |

### 🔊 open-sound / close-sound

Format `soundName,volume,pitch`, where volume and pitch are numbers:

```yaml
open-sound: "ENTITY_PLAYER_LEVELUP,1,1"
close-sound: "BLOCK_CHEST_CLOSE,1,1"
```

### 🔄 Auto-refresh (update-interval)

The unit is ticks (20 ticks = 1 second). Combined with changing placeholders like `{time}` or `{online}`, you can build dashboards that refresh in real time. `0` means never auto-refresh.

```yaml
update-interval: 20          # Refresh once per second
title: "&ePlayers online: {online}"
```

> When the player interacts manually, you can also actively refresh the current menu using the `refresh` action (see the action reference).

---

## 📦 Full Item Field Table (CustomGuiItem)

| Field | Description |
| --- | --- |
| `material` | Item material, defaults to `STONE` |
| `item` | **Item source reference**; may contain `{placeholders}`; if set, it **takes priority over** `material` |
| `amount` | Quantity |
| `name` | Display name; supports color codes and placeholders |
| `lore` | Description list (multiple lines) |
| `custom-model-data` | Custom model data (for resource packs) |
| `view-requirement` | Visibility condition; if unmet, this slot is not shown (see below) |
| `click-actions` | Click actions (Map, see below) |

```yaml
"11":
  material: PLAYER_HEAD
  name: "&a{player}'s Profile"
  lore:
    - "&7Level: &f{level}"
    - "&7Health: &f{health}/{max_health}"
  amount: 1
  custom-model-data: 1001
```

> 💡 The `item` field can take an item source reference (such as items from other Qinh modules) and supports `{placeholders}`. See [物品源引用.md](物品源引用.md) for details.

---

## 🖱️ Click Action Structure (ClickAction)

Each **arbitrary key** under `click-actions` (the name is freely chosen, used to distinguish entries) is one action:

| Field | Description |
| --- | --- |
| `click-types` | List of triggering click types: `LEFT` `RIGHT` `MIDDLE` `ALL` `ANY` |
| `type` | Action type (case-insensitive; full table on the reference page) |
| `value` | Action parameter |
| `shift` | Optional; `true` = trigger **only on Shift + click** |

```yaml
click-actions:
  buy:
    click-types: [LEFT]
    type: take_money
    value: "100 | Insufficient balance"
  info:
    click-types: [RIGHT]
    type: message
    value: "&7Right-click to view details"
  quick_sell:
    click-types: [LEFT]
    shift: true               # Only Shift + left click
    type: command
    value: "sell all {player}"
```

> See **[GUI动作与条件速查.md](GUI动作与条件速查.md)** for the full list of action types with individual examples.
> For the `value` syntax of economy-related actions (`give_money` / `take_money` / `set_money`), see **[经济动作.md](经济动作.md)**.
> The `javascript` action lets you write arbitrary logic with scripts; see **[脚本入门.md](脚本入门.md)**.

---

## 👁️ Visibility Condition Structure (view-requirement)

Add a `view-requirement` to an item, and **when the condition is not met, this slot is simply not shown**. Useful for "admin-only buttons", "show the buy button only if the player has enough money", etc.

| Field | Description |
| --- | --- |
| `type` | Condition type (full table on the reference page) |
| `value` | Condition parameter |
| `negate` | Optional; `true` = invert (show only when unmet) |

```yaml
"22":
  material: COMMAND_BLOCK
  name: "&cAdmin Panel"
  view-requirement:
    type: permission
    value: "myserver.admin"     # Only players with this permission can see this slot
  click-actions:
    open:
      type: open_gui
      value: admin_panel
```

> For the full list of condition types, comparison operators, `negate` usage, and examples, see **[GUI动作与条件速查.md](GUI动作与条件速查.md)**.

---

## 🏷️ Full Placeholder Table (PlaceholderManager)

Use `{xxx}` inside text fields like `title`, `name`, `lore`, `value`, etc.:

### Player
| Placeholder | Meaning | Placeholder | Meaning |
| --- | --- | --- | --- |
| `{player}` | Player name | `{uuid}` | Player UUID |
| `{world}` | Current world | `{x}` `{y}` `{z}` | Coordinates |
| `{health}` | Current health | `{max_health}` | Max health |
| `{food}` | Hunger | `{level}` | Level |
| `{exp}` | Experience | | |

### Global
| Placeholder | Meaning |
| --- | --- |
| `{date}` | Date (`yyyy-MM-dd`) |
| `{time}` | Time (`HH:mm:ss`) |
| `{online}` | Online player count |
| `{max_players}` | Max player count |

### Pagination (only valid in pagination / templates)
| Placeholder | Meaning |
| --- | --- |
| `{page}` | Current page |
| `{max_page}` | Total pages |
| `{has_previous}` | Whether there is a previous page |
| `{has_next}` | Whether there is a next page |
| `{item_name}` | Current entry name |
| `{item_uuid}` | Current entry UUID |
| `{item_index}` | Current entry index |

> 🔌 **PAPI support**: when text contains `%`, it is resolved through PlaceholderAPI (requires PlaceholderAPI installed). In other words, `{}` are QCL built-in placeholders and `%...%` are PAPI placeholders — the two can coexist.

---

## 📑 Pagination (pagination)

Used to display a "data list" (such as online players) across multiple pages.

| Field | Description |
| --- | --- |
| `source-type` | Data source type; built-in `online_players` |
| `source-value` | Parameter passed to the data source |
| `item-slots` | Slots occupied by paginated entries (ranges supported) |
| `previous-page-slot` | Slot for the previous-page button |
| `next-page-slot` | Slot for the next-page button |
| `page-info-slot` | Optional, slot for page-number info |
| `item-template` | Item template for each data entry (pagination placeholders available) |
| `default-action` | Default action when the template itself has no `click-actions` |

See the "Online Player Pagination" recipe below for a complete example.

---

## 🛡️ Two Mechanisms You Should Know

### ⏱️ 150ms Click Throttle
Menus have a built-in **150ms anti-spam throttle**: repeated clicks by the same player within 150 milliseconds are ignored. So issues like "spam-clicking to dupe items" or "spam-clicking to charge money multiple times" are already blocked by QCL — you don't need to add your own cooldown.

### 📥 Opening Nested Menus (open_gui)
Use the `open_gui` action to jump from one menu to another, building a multi-level menu tree:

```yaml
click-actions:
  goto_shop:
    type: open_gui
    value: shop               # Opens the menu with ID shop
```

---

## 📋 Complete Copy-Paste Examples

### Example 1: Main Menu (standard mode + nested jumps)

```yaml
main_menu:
  title: "&6&lServer Main Menu"
  rows: 3
  open-sound: "BLOCK_CHEST_OPEN,1,1"
  items:
    "0-26":                        # Fill the whole page with glass panes as background first
      material: GRAY_STAINED_GLASS_PANE
      name: " "
    "11":
      material: EMERALD
      name: "&aShop"
      lore:
        - "&7Click to enter the shop"
      click-actions:
        open:
          click-types: [ALL]
          type: open_gui
          value: shop
    "13":
      material: ENDER_PEARL
      name: "&bTeleport Hall"
      click-actions:
        tp:
          type: command          # Executed from console; {player} is auto-replaced
          value: "spawn {player}"
        msg:
          type: message
          value: "&aTeleporting you back to spawn…"
    "15":
      material: PLAYER_HEAD
      name: "&eOnline Players"
      click-actions:
        open:
          type: open_gui
          value: online_list
    "22":
      material: BARRIER
      name: "&cClose"
      click-actions:
        close:
          type: close
```

### Example 2: Shop (with visibility conditions + economy actions)

```yaml
shop:
  title: "&2&lDiamond Shop"
  rows: 3
  items:
    "0-26":
      material: BLACK_STAINED_GLASS_PANE
      name: " "
    "13":
      material: DIAMOND
      name: "&bBuy Diamond"
      lore:
        - "&7Price: &e100 coins"
        - "&7Left-click to buy one"
      view-requirement:           # If balance is below 100, this slot is not shown
        type: money
        value: ">=100"
      click-actions:
        buy:
          click-types: [LEFT]
          type: take_money
          value: "100 | Insufficient balance, 100 coins required"
        give:
          click-types: [LEFT]
          type: give_item
          value: "DIAMOND:1"
        ok:
          click-types: [LEFT]
          type: message
          value: "&aPurchase successful!"
    "22":
      material: ARROW
      name: "&cBack"
      click-actions:
        back:
          type: open_gui
          value: main_menu
```

> ⚠️ Multiple actions on the same slot (`buy`/`give`/`ok`) are **all executed in order**. Be sure to place the money deduction before giving the item; if you want "do nothing at all when there isn't enough money", note that `take_money` itself won't deduct when it fails, but `give_item` is still an independent action — for a more robust "conditional purchase", use a script: see [脚本入门.md](脚本入门.md) and the "Buy Button Recipe" on the reference page.

### Example 3: Online Player Pagination

```yaml
online_list:
  title: "&9Online Players &7({page}/{max_page})"
  rows: 6
  update-interval: 40              # Refresh the list every 2 seconds
  items:
    "45-53":
      material: GRAY_STAINED_GLASS_PANE
      name: " "
  pagination:
    source-type: online_players
    item-slots: "0-44"             # Lay heads across the first 5 rows
    previous-page-slot: 45
    next-page-slot: 53
    page-info-slot: 49
    item-template:
      material: PLAYER_HEAD
      name: "&a{item_name}"
      lore:
        - "&7Click to act (index {item_index})"
      default-action:              # Used when the template itself has no click-actions
        type: message
        value: "&7You selected {item_name}"
```

---

## 📖 Continue Reading
- ➡️ [GUI动作与条件速查.md](GUI动作与条件速查.md) — Item-by-item examples of all click actions / visibility conditions
- 💰 [经济动作.md](经济动作.md) — Full syntax for `give_money` / `take_money` / `set_money`
- 📜 [脚本入门.md](脚本入门.md) — Write custom conditions and actions with `javascript`
- 🧰 [GUI编程API.md](../04-开发者/GUI编程API.md) — For developers: register dynamic data sources from code
- ❓ [FAQ.md](../05-参考/FAQ.md) — Frequently asked questions
