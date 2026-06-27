> Previous: [自定义GUI.md](./custom-gui.md) · Next: [经济动作.md](./economy-actions.md)
> Related: [脚本入门.md](./scripting-intro.md) · [经济动作.md](./economy-actions.md) · [GUI编程API.md](../04-developer/gui-api.md)

# 🔎 GUI Actions & Conditions Quick Reference

This is a **pure quick-reference page**: all click actions (`type`) and all visibility conditions (`view-requirement`), each with a copy-paste-ready YAML snippet. For the basic GUI structure, read [自定义GUI.md](./custom-gui.md) first.

---

## 🖱️ Full Table of Click Action Types (ActionExecutor)

> `type` is **case-insensitive**. The spellings in the "Aliases" column below have exactly the same effect.

| type | Aliases | value format | Description |
| --- | --- | --- | --- |
| `command` | `cmd` | command (without `/`) | Run from the **console** |
| `console_command` | `console_cmd` | command | Run from the console (same as above) |
| `player_command` | `player_cmd` | command | Run **as the player** |
| `message` | `msg` | text (`&` codes + placeholders) | Send a message to the player |
| `broadcast` | — | text | Broadcast to the whole server |
| `sound` | — | `soundName,volume,pitch` | Play a sound |
| `open_gui` | `gui` | GUI id | Open another menu |
| `close` | — | empty | Close the menu |
| `refresh` | — | empty | Refresh the current menu |
| `teleport` | — | `x,y,z[,world]` | Teleport |
| `give_item` | — | `material:amount` | Give item |
| `take_item` | — | `material:amount` | Remove item |
| `clear_inventory` | — | empty | Clear inventory |
| `heal` | — | number (default full health) | Heal |
| `feed` | — | number (default 20) | Feed |
| `gamemode` | — | `SURVIVAL`/`CREATIVE`/`ADVENTURE`/`SPECTATOR` | Change game mode |
| `fly` | — | `true`/`false`/empty (toggle) | Toggle flight |
| `effect` | — | `effectName,durationTicks,level` | Apply potion effect |
| `give_money` | `givemoney` | see [经济动作.md](./economy-actions.md) | Give money |
| `take_money` | `takemoney`,`remove_money` | see [经济动作.md](./economy-actions.md) | Take money |
| `set_money` | `setmoney` | see [经济动作.md](./economy-actions.md) | Set balance |
| `javascript` | `js`,`run_script`,`script` | script reference or code | Run JS |

### 📋 Example for Each

```yaml
# command / console_command —— run from the console
buy:
  type: command
  value: "give {player} diamond 1"

# player_command —— run as the player
home:
  type: player_command
  value: "home"

# message —— send a message to the player
tip:
  type: message
  value: "&aWelcome, {player}!"

# broadcast —— broadcast to the whole server
ann:
  type: broadcast
  value: "&e{player} triggered the hidden easter egg!"

# sound —— soundName,volume,pitch
ding:
  type: sound
  value: "ENTITY_EXPERIENCE_ORB_PICKUP,1,1"

# open_gui —— open another menu
go:
  type: open_gui
  value: shop

# close —— close (leave value empty)
x:
  type: close

# refresh —— refresh the current menu
r:
  type: refresh

# teleport —— x,y,z[,world]
tp:
  type: teleport
  value: "100,64,-200,world"

# give_item / take_item —— material:amount
g:
  type: give_item
  value: "GOLDEN_APPLE:3"
t:
  type: take_item
  value: "DIRT:64"

# clear_inventory —— clear inventory
clr:
  type: clear_inventory

# heal —— number, leave empty for full health
h:
  type: heal
  value: "20"

# feed —— number, default 20
f:
  type: feed
  value: "20"

# gamemode
gm:
  type: gamemode
  value: "CREATIVE"

# fly —— true/false/empty toggles
fl:
  type: fly
  value: "true"

# effect —— effectName,durationTicks,level
buff:
  type: effect
  value: "SPEED,200,1"

# javascript —— script reference or inline code
js:
  type: javascript
  value: "myscript.js"
```

> 💰 The three economy actions `give_money` / `take_money` / `set_money` have a more complex value syntax (including provider, currency, failure message), documented separately in **[经济动作.md](./economy-actions.md)**.

---

## 🖱️ click-types Values

`click-types` determines which click method triggers this action; written as a list:

| Value | Meaning |
| --- | --- |
| `LEFT` | Left click |
| `RIGHT` | Right click |
| `MIDDLE` | Middle click |
| `ALL` / `ANY` | Any click method |

```yaml
click-actions:
  left_only:
    click-types: [LEFT]
    type: message
    value: "&aLeft click"
  any:
    click-types: [ALL]
    type: message
    value: "&7Any click works"
```

> You can also add `shift: true`, meaning the action only triggers on "Shift + click" (see [自定义GUI.md](./custom-gui.md)).

---

## 👁️ Full Table of Visibility Condition Types (ConditionChecker)

`view-requirement` structure: `type` + `value` + optional `negate` (`true` = invert; shows only when NOT met).

| type | Aliases | value | Description |
| --- | --- | --- | --- |
| `permission` | — | permission node | Whether the player has the permission |
| `has_item` | — | `material:amount` | Whether the inventory contains the item |
| `level` | — | comparator + number, e.g. `>=10` | Level |
| `money` | — | comparator + number`[:provider]`, e.g. `>=1000:money` | Balance |
| `health` | — | comparator + number | Health |
| `food` | — | comparator + number (0-20) | Hunger |
| `world` | — | world name | Current world |
| `gamemode` | — | `SURVIVAL`/`CREATIVE`/… | Game mode |
| `javascript` | `js`,`script` | script reference/code (returns boolean) | Custom |

### 🔢 Comparators
| Symbol | Meaning |
| --- | --- |
| `>=` | Greater than or equal (**default**, used when no symbol is given) |
| `<=` | Less than or equal |
| `>` | Greater than |
| `<` | Less than |
| `==` | Equal |

### 📋 Example for Each

```yaml
# permission —— shown only with the permission
view-requirement:
  type: permission
  value: "myserver.vip"

# has_item —— shown only when the inventory has 16 emeralds
view-requirement:
  type: has_item
  value: "EMERALD:16"

# level —— level >= 10
view-requirement:
  type: level
  value: ">=10"

# money —— balance >= 1000, using the money currency
view-requirement:
  type: money
  value: ">=1000:money"

# health —— health > 10
view-requirement:
  type: health
  value: ">10"

# food —— hunger < 6 (the "eat" button shows only when hungry)
view-requirement:
  type: food
  value: "<6"

# world —— shown only in world_nether
view-requirement:
  type: world
  value: "world_nether"

# gamemode —— shown only in survival mode
view-requirement:
  type: gamemode
  value: "SURVIVAL"

# javascript —— shown only when the script returns true
view-requirement:
  type: javascript
  value: "check_vip.js"
```

### 🔁 negate (invert)

`negate: true` inverts the condition — it **shows only when the condition is NOT met**. For example, a tip "shown only to non-admins":

```yaml
view-requirement:
  type: permission
  value: "myserver.admin"
  negate: true               # only players WITHOUT the admin permission see this slot
```

---

## 🍳 Common Combo Recipes

### Recipe A: Buy button (condition + take money + give item + message)

```yaml
"13":
  material: DIAMOND
  name: "&bBuy Diamond &7(100 coins)"
  view-requirement:               # if the player can't afford it, this slot simply doesn't show
    type: money
    value: ">=100"
  click-actions:
    pay:
      click-types: [LEFT]
      type: take_money
      value: "100 | Insufficient balance"
    give:
      click-types: [LEFT]
      type: give_item
      value: "DIAMOND:1"
    msg:
      click-types: [LEFT]
      type: message
      value: "&aPurchase successful, 100 coins deducted"
```

::: warning Caution
⚠️ The three actions above run in order. If you want an **atomic transaction** like "don't give the item if taking money fails", use a `javascript` action instead and write both the deduction and the item grant in a single script — see [脚本入门.md](./scripting-intro.md).
:::

### Recipe B: Admin-only button (permission)

```yaml
"26":
  material: COMMAND_BLOCK
  name: "&cAdmin Panel"
  view-requirement:
    type: permission
    value: "myserver.admin"       # only admins can see it
  click-actions:
    open:
      type: open_gui
      value: admin_panel
```

### Recipe C: Regular-player tip (permission + negate)

```yaml
"26":
  material: PAPER
  name: "&7You are not an admin"
  view-requirement:
    type: permission
    value: "myserver.admin"
    negate: true                  # only players without the permission see it
```

### Recipe D: Restore button (appears only when hungry + feed + heal + sound)

```yaml
"11":
  material: COOKED_BEEF
  name: "&aSupplies"
  view-requirement:
    type: food
    value: "<20"                  # shown only when not full
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

## 📖 Further Reading
- 🖼️ [自定义GUI.md](./custom-gui.md) — Full GUI structure and fields
- 💰 [经济动作.md](./economy-actions.md) — value syntax for the three economy actions
- 📜 [脚本入门.md](./scripting-intro.md) — `javascript` conditions and actions
- 🧰 [GUI编程API.md](../04-developer/gui-api.md) — Developer extension actions and data sources
