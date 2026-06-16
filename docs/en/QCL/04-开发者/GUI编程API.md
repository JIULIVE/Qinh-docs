> Related: [API概览.md](./api-overview.md) · [数据存储与占位符.md](./data-placeholders.md) · [../02-服主指南/自定义GUI.md](../02-server-guide/custom-gui.md) · [../05-参考/术语表.md](../05-reference/glossary.md)

# 🖼️ GUI Programming API (CustomGuiManager)

This page covers **programmatic** GUI operations — opening / rendering / feeding data using Kotlin code. For the GUI **YAML fields** (layout, icons, click actions, etc.), see the server-owner doc [../02-服主指南/自定义GUI.md](../02-server-guide/custom-gui.md); this page only covers the code side.

The core entry point is `CustomGuiManager`.

---

## 1. Initialization and config loading

```kotlin
CustomGuiManager.init(plugin)        // Usually called once in onEnable
CustomGuiManager.loadAllGuis()       // Load all GUI configs
CustomGuiManager.reloadAllGuis()     // Reload
CustomGuiManager.loadedGuiCount()    // Number already loaded
val config = CustomGuiManager.getGuiConfig("shop")   // Get a specific GUI config
```

---

## 2. Opening a GUI

### 2.1 openGui — open an already-loaded config GUI

```kotlin
CustomGuiManager.openGui(
    player,
    "shop",                           // GUI id
    placeholderProvider = null,       // Optional: placeholder provider for this open
    actionHandler = null              // Optional: action handler for this open
)
```

Both `placeholderProvider` and `actionHandler` are **optional**: pass them to use a dedicated one for this open, injecting different data / behavior into the same GUI across different scenarios.

### 2.2 openGuiFromConfig — open from a given config section, with session data

```kotlin
CustomGuiManager.openGuiFromConfig(
    player,
    section,                          // Config section
    guiId = "shop",
    sessionData = mapOf("page" to 1), // Session data, readable during render
    placeholderProvider = null,
    actionHandler = null
)
```

### 2.3 openDynamic — pure-code dynamic GUI

Reads no config, drawn entirely by code:

```kotlin
CustomGuiManager.openDynamic(
    player,
    rows = 3,                         // Number of rows
    title = "My Backpack",
    openSound = null,                 // Optional open sound
    closeSound = null,                // Optional close sound
    render = { gui, inventory ->
        // Fill items into gui / inventory here (see section 5, DynamicGui)
        gui.setItem(13, ItemStack(Material.DIAMOND)) { clickType ->
            player.sendMessage("Clicked the diamond: $clickType")
            false   // Return whether to refresh the interface
        }
    }
)
```

### 2.4 openDynamicFromConfig

`openDynamicFromConfig(...)` — takes the basic info (title / rows / sounds, etc.) from config, then draws content with code via `render`. It is a middle ground between the two above.

---

## 3. Registering custom placeholders

### 3.1 CustomGuiManager.registerPlaceholder

The simplest one: register a `key → player-related string` placeholder.

```kotlin
CustomGuiManager.registerPlaceholder("coins") { player ->
    getCoins(player).toString()
}
// Write this key in the GUI text; it gets replaced at render time
```

### 3.2 PlaceholderManager — layered placeholders

`PlaceholderManager` provides registration at three granularities:

| Method | Scope |
|---|---|
| `registerPlaceholder(...)` | Global placeholder |
| `registerGuiPlaceholder(...)` | Placeholder within a specific GUI |
| `registerItemPlaceholder(...)` | Placeholder for a specific item / slot |

```kotlin
PlaceholderManager.registerPlaceholder("server_name") { "Qinhuai Server" }
PlaceholderManager.registerGuiPlaceholder(/* guiId, key, resolver */)
PlaceholderManager.registerItemPlaceholder(/* ... */)
```

---

## 4. Wiring up a paginated data source (GuiDataProvider)

When a GUI needs to display a long, page-turnable list of content (online players, products, leaderboards, etc.), implement `GuiDataProvider`. It has two sub-interfaces:

### 4.1 GuiPaginationListProvider — paginated list

```kotlin
interface GuiPaginationListProvider : GuiDataProvider {
    fun loadEntries(player: Player, gui: /*Gui*/, sourceValue: String): List<GuiPaginationEntry>
}
```

`loadEntries` returns a list of `GuiPaginationEntry`; the framework handles paginated display.

`GuiPaginationEntry` fields:

| Field | Description |
|---|---|
| `placeholders: Map` | This entry's placeholders (filled into the icon's name / lore) |
| `displayItem` (nullable) | Directly specify the display item |
| `leftAction` (nullable) | Left-click action |
| `rightAction` (nullable) | Right-click action |
| `action` (nullable) | General action |

```kotlin
class FriendListProvider : GuiPaginationListProvider {
    override fun loadEntries(player: Player, gui: Gui, sourceValue: String): List<GuiPaginationEntry> {
        return getFriends(player).map { friend ->
            GuiPaginationEntry(
                placeholders = mapOf(
                    "name" to friend.name,
                    "status" to friend.statusText()
                ),
                leftAction  = "tp ${friend.name}",
                rightAction = "msg ${friend.name}"
            )
        }
    }
}
```

> 🔌 **Built-in data source `online_players`**: QCL ships with an online-players data source. Just reference `online_players` directly in the GUI config to paginate the online players — no need to implement it yourself.

### 4.2 GuiDynamicSlotProvider — dynamic single slot

```kotlin
interface GuiDynamicSlotProvider : GuiDataProvider {
    fun loadItem(/* player, gui, ... */): ItemStack
}
```

Use this when a slot's item needs to change per player / real-time state (e.g. "current party icon").

---

## 5. DynamicGui — drawing with code

The `gui` given to you by `openDynamic` / `openDynamicFromConfig` is a `DynamicGui`. Use `setItem` to place an item into a slot and attach a click callback:

```kotlin
gui.setItem(slot, itemStack) { clickType ->
    // Handle the click
    when (clickType) {
        ClickType.LEFT  -> doBuy(player)
        ClickType.RIGHT -> doInfo(player)
        else            -> {}
    }
    true   // Return Boolean: true = refresh the interface after the click, false = don't refresh
}
```

- The third parameter is the **click callback** `(clickType) -> Boolean`.
- The return value indicates **whether to refresh**: `true` redraws the interface (good for switching pages, changing state), `false` keeps it unchanged.

Full dynamic GUI example:

```kotlin
CustomGuiManager.openDynamic(
    player,
    rows = 6,
    title = "Shop",
    render = { gui, inventory ->
        shopItems.forEachIndexed { i, item ->
            gui.setItem(i, item.icon) { click ->
                if (click == ClickType.LEFT) {
                    buy(player, item)
                    true     // Refresh after buying (update stock / balance display)
                } else false
            }
        }
    }
)
```

---

## 6. Summary of placeholderProvider / actionHandler injection

When opening a GUI you can inject two kinds of callbacks, letting **the same GUI config** adapt to different scenarios:

- `placeholderProvider` — the placeholder source dedicated to this open (overrides / supplements the global placeholders).
- `actionHandler` — the action handler dedicated to this open (clicks go through it).

```kotlin
CustomGuiManager.openGui(player, "profile",
    placeholderProvider = { key -> profileData[key] },
    actionHandler = myActionHandler
)
```

---

## 📖 Continue reading

- [../02-服主指南/自定义GUI.md](../02-server-guide/custom-gui.md) — GUI YAML fields and server-owner configuration
- [数据存储与占位符.md](./data-placeholders.md) — PapiBridge and %qcl_xxx% placeholders
- [动作与技能桥.md](./actions-skill-bridge.md) — the action system behind click actions
- [../05-参考/术语表.md](../05-reference/glossary.md) — terminology definitions
