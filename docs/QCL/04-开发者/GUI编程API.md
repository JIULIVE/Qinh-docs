> 相关：[API概览.md](API概览.md) · [数据存储与占位符.md](数据存储与占位符.md) · [../02-服主指南/自定义GUI.md](../02-服主指南/自定义GUI.md) · [../05-参考/术语表.md](../05-参考/术语表.md)

# 🖼️ GUI 编程 API（CustomGuiManager）

本页讲**编程式**操作 GUI —— 用 Kotlin 代码打开 / 渲染 / 填数据。GUI 的 **YAML 字段**（布局、图标、点击动作等）请看服主文档 [../02-服主指南/自定义GUI.md](../02-服主指南/自定义GUI.md)，本页只讲代码这一面。

核心入口是 `CustomGuiManager`。

---

## 一、初始化与配置加载

```kotlin
CustomGuiManager.init(plugin)        // 通常在 onEnable 调一次
CustomGuiManager.loadAllGuis()       // 加载所有 GUI 配置
CustomGuiManager.reloadAllGuis()     // 重载
CustomGuiManager.loadedGuiCount()    // 已加载数量
val config = CustomGuiManager.getGuiConfig("shop")   // 取某个 GUI 配置
```

---

## 二、打开 GUI

### 2.1 openGui —— 打开已加载的配置 GUI

```kotlin
CustomGuiManager.openGui(
    player,
    "shop",                           // GUI id
    placeholderProvider = null,       // 可选：本次打开的占位符提供方
    actionHandler = null              // 可选：本次打开的动作处理器
)
```

`placeholderProvider` 与 `actionHandler` 都是**可选**的：传了就用本次专属的，给同一个 GUI 在不同场景下注入不同数据 / 行为。

### 2.2 openGuiFromConfig —— 从指定配置段打开，可带会话数据

```kotlin
CustomGuiManager.openGuiFromConfig(
    player,
    section,                          // 配置段
    guiId = "shop",
    sessionData = mapOf("page" to 1), // 会话数据，渲染时可读
    placeholderProvider = null,
    actionHandler = null
)
```

### 2.3 openDynamic —— 纯代码动态 GUI

不读配置，完全由代码绘制：

```kotlin
CustomGuiManager.openDynamic(
    player,
    rows = 3,                         // 行数
    title = "我的背包",
    openSound = null,                 // 可选打开音效
    closeSound = null,                // 可选关闭音效
    render = { gui, inventory ->
        // 在这里往 gui / inventory 填物品（见第五节 DynamicGui）
        gui.setItem(13, ItemStack(Material.DIAMOND)) { clickType ->
            player.sendMessage("点了钻石：$clickType")
            false   // 返回是否刷新界面
        }
    }
)
```

### 2.4 openDynamicFromConfig

`openDynamicFromConfig(...)` —— 从配置取标题 / 行数 / 音效等基础信息，再用代码 `render` 绘制内容，是上面两者的折中。

---

## 三、注册自定义占位符

### 3.1 CustomGuiManager.registerPlaceholder

最简单的一种：注册一个 `key → 玩家相关字符串` 的占位符。

```kotlin
CustomGuiManager.registerPlaceholder("coins") { player ->
    getCoins(player).toString()
}
// GUI 文本里写这个 key，渲染时即被替换
```

### 3.2 PlaceholderManager —— 分层占位符

`PlaceholderManager` 提供三个粒度的注册：

| 方法 | 作用范围 |
|---|---|
| `registerPlaceholder(...)` | 全局占位符 |
| `registerGuiPlaceholder(...)` | 某个 GUI 内的占位符 |
| `registerItemPlaceholder(...)` | 某个物品 / 槽位的占位符 |

```kotlin
PlaceholderManager.registerPlaceholder("server_name") { "秦淮服" }
PlaceholderManager.registerGuiPlaceholder(/* guiId, key, resolver */)
PlaceholderManager.registerItemPlaceholder(/* ... */)
```

---

## 四、接入分页数据源（GuiDataProvider）

当 GUI 要展示一长串可翻页的内容（在线玩家、商品、排行榜等）时，实现 `GuiDataProvider`。它有两个子接口：

### 4.1 GuiPaginationListProvider —— 分页列表

```kotlin
interface GuiPaginationListProvider : GuiDataProvider {
    fun loadEntries(player: Player, gui: /*Gui*/, sourceValue: String): List<GuiPaginationEntry>
}
```

`loadEntries` 返回一串 `GuiPaginationEntry`，框架负责分页展示。

`GuiPaginationEntry` 字段：

| 字段 | 说明 |
|---|---|
| `placeholders: Map` | 本条目的占位符（填进图标的名称 / lore） |
| `displayItem`（可空） | 直接指定展示物品 |
| `leftAction`（可空） | 左键动作 |
| `rightAction`（可空） | 右键动作 |
| `action`（可空） | 通用动作 |

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

> 🔌 **内置数据源 `online_players`**：QCL 自带一个在线玩家数据源，GUI 配置里直接引用 `online_players` 即可分页列出在线玩家，无需自己实现。

### 4.2 GuiDynamicSlotProvider —— 动态单槽

```kotlin
interface GuiDynamicSlotProvider : GuiDataProvider {
    fun loadItem(/* player, gui, ... */): ItemStack
}
```

某个槽位的物品需要按玩家 / 实时状态变化时用它（如「当前队伍图标」）。

---

## 五、DynamicGui —— 代码绘制

`openDynamic` / `openDynamicFromConfig` 给你的 `gui` 是一个 `DynamicGui`，用 `setItem` 往槽里放物品并挂点击回调：

```kotlin
gui.setItem(slot, itemStack) { clickType ->
    // 处理点击
    when (clickType) {
        ClickType.LEFT  -> doBuy(player)
        ClickType.RIGHT -> doInfo(player)
        else            -> {}
    }
    true   // 返回 Boolean：true = 点击后刷新界面，false = 不刷新
}
```

- 第三个参数是**点击回调** `(clickType) -> Boolean`。
- 返回值表示**是否刷新**：`true` 重绘界面（适合切页、改状态），`false` 保持不变。

完整动态 GUI 示例：

```kotlin
CustomGuiManager.openDynamic(
    player,
    rows = 6,
    title = "商店",
    render = { gui, inventory ->
        shopItems.forEachIndexed { i, item ->
            gui.setItem(i, item.icon) { click ->
                if (click == ClickType.LEFT) {
                    buy(player, item)
                    true     // 买完刷新（更新库存 / 余额显示）
                } else false
            }
        }
    }
)
```

---

## 六、placeholderProvider / actionHandler 注入小结

打开 GUI 时可注入两类回调，让**同一个 GUI 配置**适配不同场景：

- `placeholderProvider` —— 本次打开专属的占位符来源（覆盖 / 补充全局占位符）。
- `actionHandler` —— 本次打开专属的动作处理器（点击时走它）。

```kotlin
CustomGuiManager.openGui(player, "profile",
    placeholderProvider = { key -> profileData[key] },
    actionHandler = myActionHandler
)
```

---

## 📖 继续阅读

- [../02-服主指南/自定义GUI.md](../02-服主指南/自定义GUI.md) —— GUI 的 YAML 字段与服主配置
- [数据存储与占位符.md](数据存储与占位符.md) —— PapiBridge 与 %qcl_xxx% 占位符
- [动作与技能桥.md](动作与技能桥.md) —— 点击动作背后的动作系统
- [../05-参考/术语表.md](../05-参考/术语表.md) —— 术语定义
