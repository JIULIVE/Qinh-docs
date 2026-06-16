> 上一页：[API概览.md](./api-overview.md)　·　下一页：[脚本API.md](./script-api.md)
> 相关：[API概览.md](./api-overview.md) · [脚本API.md](./script-api.md) · [../02-服主指南/物品源引用.md](../02-server-guide/item-source-references.md) · [../03-外部插件对接/物品类插件.md](../03-external-plugins/item-plugins.md)

# 🗡️ 物品 API

本页讲透 `com.qinhuai.corelib.api.item` 包：怎么用 **`ItemManagerAPI`** 统一取物、注册自己的物品模块、用 **Groovy** 写外部物品模块（无需编译插件）、读写物品 PDC 元数据，以及语义层 `SemanticSpec` 简介。

引用字符串语法（`源:物品ID`、JSON 参数等）见 [../02-服主指南/物品源引用.md](../02-server-guide/item-source-references.md)；统一物品源接了哪些外部插件见 [../03-外部插件对接/物品类插件.md](../03-external-plugins/item-plugins.md)。

---

## 🎛️ ItemManagerAPI

物品门面，单例。Kotlin 用 `ItemManagerAPI.instance`，Java 用 `ItemManagerAPI.INSTANCE`。部分取物方法是**静态**的，可直接 `ItemManagerAPI.getHookItem(...)`。

### 注册类方法

| 方法 | 签名 | 用途 |
| --- | --- | --- |
| `register` | `register(plugin, module: ItemModule, vararg aliases)` | 以**插件为 owner** 注册物品模块及其别名 |
| `registerByOwner` | `registerByOwner(ownerKey, module, vararg aliases)` | 以**自定义 owner key** 注册 |
| `register`（源） | `register(source: ItemSource, vararg aliases)` | 把一个 `ItemSource` 包装成 `ItemSourceModuleAdapter` 注册 |
| `unregister` | `unregister(plugin)` / `unregister(ownerKey)` | 注销某 owner 的全部注册 |
| `clear` | `clear()` | 清空全部注册 |
| `aliases` | `aliases(): Set<String>` | 当前已注册的全部别名 |
| `registerBuiltinSources` | `registerBuiltinSources()` | 注册内置物品源 |

> **owner 概念**：注册时绑定一个 owner（插件或字符串 key），你的插件卸载/重载时用 `unregister(plugin)` 一次性清掉自己注册的全部别名，避免残留。

```kotlin
ItemManagerAPI.instance.register(this, MyItemModule(), "myitems", "mi")
// ...插件 onDisable：
ItemManagerAPI.instance.unregister(this)
```

```java
ItemManagerAPI.INSTANCE.register(this, new MyItemModule(), "myitems", "mi");
```

### 取物类方法（静态）

| 方法 | 签名 | 返回 |
| --- | --- | --- |
| `getHookItem` | `getHookItem(ref)` | `ItemStack?` |
| `getHookItem` | `getHookItem(ref, player)` | `ItemStack?` |
| `getHookItem` | `getHookItem(ref, player, amount)` | `ItemStack?` |
| `resolve` | `resolve(ref, player, amount): ResolveResult` | 结构化结果（推荐） |
| `diagnose` | `diagnose(ref, player): DiagnosticResult<ItemStack>` | 诊断结果（排错用） |

```kotlin
val sword = ItemManagerAPI.getHookItem("qinhitems:excalibur", player, 1)
if (sword != null) player.inventory.addItem(sword)
```

```java
ItemStack sword = ItemManagerAPI.getHookItem("qinhitems:excalibur", player, 1);
```

`getHookItem` 失败时返回 `null`，拿不到原因。**需要知道为什么失败就用 `resolve`。**

---

## 🧾 ResolveResult 与错误码

`resolve(ref, player, amount)` 返回 `ResolveResult`，字段：

| 字段 | 含义 |
| --- | --- |
| `success` | 是否成功 |
| `item` | 成功时的 `ItemStack` |
| `code` | 错误码（见下表） |
| `message` | 人类可读信息 |
| `source` | 命中的物品源 |
| `recoverable` | 是否可恢复（值得重试/提示而非致命） |
| `suggestion` | 修复建议文本 |
| `traceId` | 追踪 ID，便于在日志里定位 |

### 错误码

| code | 含义 |
| --- | --- |
| `OK` | 成功 |
| `PARSE_FAILED` | 引用字符串解析失败（语法错误） |
| `MATERIAL_NOT_FOUND` | 当作原版材料解析但材料名不存在 |
| `SOURCE_NOT_FOUND` | 别名对应的物品源未注册 |
| `MODULE_BUILD_FAILED` | 源找到了，但构建物品时抛错 |
| `ITEM_NOT_FOUND` | 源里没有这个物品 ID |

```kotlin
val result = ItemManagerAPI.resolve("qinhitems:excalibur", player, 1)
if (result.success) {
    player.inventory.addItem(result.item!!)
} else {
    logger.warning("取物失败[${result.code}] ${result.message} -> ${result.suggestion} (trace=${result.traceId})")
}
```

```java
var result = ItemManagerAPI.resolve("qinhitems:excalibur", player, 1);
if (result.getSuccess()) {
    player.getInventory().addItem(result.getItem());
} else {
    getLogger().warning(result.getCode() + ": " + result.getMessage());
}
```

> 排错时还可以用 `diagnose(ref, player)` 拿 `DiagnosticResult<ItemStack>`，包含更完整的诊断链路。

---

## 🧩 ItemModule：实现自己的物品模块

接口在 `com.qinhuai.corelib.api.item.module`：

```kotlin
interface ItemModule {
    fun build(player: Player?, id: String): ItemStack?
    fun buildWithParams(player: Player?, id: String, paramsJson: String?): ItemStack?  // 默认实现调 build
}
```

- `build(player, id)`：按物品 ID 构建一个 `ItemStack`，构建不出返回 `null`。
- `buildWithParams(player, id, paramsJson)`：带 JSON 参数构建（引用里 `源:id{...json...}` 的参数部分）。**默认实现直接转调 `build`**，需要参数化的模块才覆写。

### Kotlin 实现

```kotlin
import com.qinhuai.corelib.api.item.module.ItemModule
import org.bukkit.Material
import org.bukkit.entity.Player
import org.bukkit.inventory.ItemStack

class MyItemModule : ItemModule {
    override fun build(player: Player?, id: String): ItemStack? {
        return when (id) {
            "ruby" -> ItemStack(Material.RED_DYE)
            "sapphire" -> ItemStack(Material.LAPIS_LAZULI)
            else -> null
        }
    }

    override fun buildWithParams(player: Player?, id: String, paramsJson: String?): ItemStack? {
        // 需要参数就解析 paramsJson；不需要可不覆写，走默认转调 build
        return build(player, id)
    }
}
```

### Java 实现

```java
public class MyItemModule implements ItemModule {
    @Override
    public ItemStack build(Player player, String id) {
        switch (id) {
            case "ruby": return new ItemStack(Material.RED_DYE);
            default: return null;
        }
    }
    // buildWithParams 有默认实现，可不重写
}
```

注册（见上文）后，服主即可用 `myitems:ruby` 这样的引用取到你的物品。

---

## 🪶 Groovy 外部物品模块（免编译）

QCL 支持把物品模块写成 **Groovy 脚本**丢进数据目录，**无需打包成插件**，启动或 `/qcl reload` 时自动加载。机制由 `ItemManagerBootstrap.reloadExternalModules` 驱动。

### 目录

```
plugins/QinhCoreLib/item-modules/*.groovy
```

仓库自带两个示例可参考改造：

- `OraxenModule.groovy.example`
- `RPGItemsModule.groovy.example`

> 把 `.example` 后缀去掉（改成 `.groovy`）才会被加载。

### 模板

Groovy 脚本要：(1) 提供一个实现 `ItemModule` 的类；(2) 提供静态 `onGroovyRegister()` / `onGroovyUnregister()` 调用门面完成注册/注销。

```groovy
import com.qinhuai.corelib.api.item.ItemManagerAPI
import com.qinhuai.corelib.api.item.module.ItemModule
import org.bukkit.Material
import org.bukkit.entity.Player
import org.bukkit.inventory.ItemStack

class MyGroovyItems implements ItemModule {

    ItemStack build(Player player, String id) {
        switch (id) {
            case "coin":  return new ItemStack(Material.GOLD_NUGGET)
            case "token": return new ItemStack(Material.IRON_NUGGET)
            default:      return null
        }
    }

    ItemStack buildWithParams(Player player, String id, String paramsJson) {
        return build(player, id)
    }
}

// QCL 加载时调用：注册模块 + 别名
static void onGroovyRegister() {
    ItemManagerAPI.instance.register(new MyGroovyItems(), "mygroovy")
}

// QCL 卸载/重载前调用：清理
static void onGroovyUnregister() {
    ItemManagerAPI.instance.unregister("mygroovy")
}
```

注册后引用 `mygroovy:coin` 即可取到金粒。改完脚本执行 `/qcl reload` 即可热重载，无需重启服务器。

> 注：`register(模块, "别名")` 这种不带 plugin 参数的重载，对应 `register(source: ItemSource, vararg aliases)` / 以 owner key 注册的路径——示例里直接以别名注册，注销时用 `unregister("别名/ownerKey")` 对应清理。

---

## 🔍 ItemReferenceParser：解析引用

`ItemReferenceParser.parse(ref)` 把引用字符串拆成结构：

```
Parsed(alias, itemId, paramsJson?)
```

| 字段 | 含义 |
| --- | --- |
| `alias` | 源别名（如 `qinhitems`） |
| `itemId` | 物品 ID（如 `excalibur`） |
| `paramsJson` | 可选 JSON 参数串 |

```kotlin
val parsed = ItemReferenceParser.parse("qinhitems:excalibur{\"tier\":3}")
println(parsed.alias)      // qinhitems
println(parsed.itemId)     // excalibur
println(parsed.paramsJson) // {"tier":3}
```

完整的引用语法（分隔符、JSON 参数、原版材料回退等）见 [../02-服主指南/物品源引用.md](../02-server-guide/item-source-references.md)。

---

## 🏷️ 物品元数据：ItemMetadata / TypeManager

把数据写进物品的 PDC（`PersistentDataContainer`），随物品持久化。

### ItemMetadata / ItemMetadataManager

`ItemMetadataManager.get(namespace)` 拿到某命名空间下的读写器，再 `setString` / `getInt` / ... 读写。底层 key 形如 `qinhcorelib:namespace_key`。

```kotlin
val meta = ItemMetadataManager.get("myaddon")
meta.setString(item, "owner", player.name)
meta.setInt(item, "level", 5)

val owner = meta.getString(item, "owner")
val level = meta.getInt(item, "level")
```

> 用命名空间隔离自己的数据，避免和别的插件键名撞车。

### TypeManager：物品类型标记

`TypeManager` 在 PDC 上打 `qcl_type` 标记，用来标识「这是一件什么类型的物品」：

| 方法 | 用途 |
| --- | --- |
| `setType(item, type)` | 给物品打类型标记 |
| `getType(item)` | 读类型 |
| `isType(item, type)` | 判断是否为某类型 |

```kotlin
TypeManager.setType(item, "weapon")
if (TypeManager.isType(item, "weapon")) {
    // 是武器，走武器逻辑
}
```

---

## 🧬 语义层：SemanticSpec（简介）

`semantic` 包提供一套**跨模块统一的规格描述**，把物品/技能/锻造/效果/动作/条件抽象成统一 Spec，便于各模块互相识别而不直接依赖彼此的实现类。

- 规格类型：`ItemSpec`、`SkillSpec`、`ForgeSpec`、`EffectSpec`、`ActionSpec`、`ConditionSpec`。
- 统一字段：`id`、`namespace`、`version`、`tags`、`variables`、`qualifiedId`。
- 注册表：`SemanticSpecRegistry.register / get / all / clear`。
- 校验：`SpecValidator` → `SpecValidationResult`（含 `SpecIssue` 列表）。
- 适配：`SemanticAdapters` 提供占位适配（`registerItem` / `registerSkill` / ...），**各模块自行适配后注册**，CoreLib 不直接依赖具体实现类。

```kotlin
val spec = SemanticSpecRegistry.get("myaddon:ruby")
SemanticSpecRegistry.all().forEach { println(it.qualifiedId) }
```

> 语义层是「让不同模块对同一件东西达成共识」的薄抽象层。一般业务对接用不到，做跨模块集成（比如让锻造系统识别你的物品规格）时才需要。

---

## 📚 继续阅读

- [脚本API.md](./script-api.md) —— 脚本里也能 `qcl.itemParse` / `qcl.itemGive` 取物。
- [经济API.md](./economy-api.md) —— 配合取物做收费发奖。
- [../02-服主指南/物品源引用.md](../02-server-guide/item-source-references.md) —— 引用字符串完整语法。
- [../03-外部插件对接/物品类插件.md](../03-external-plugins/item-plugins.md) —— 内置接了哪些外部物品源。
