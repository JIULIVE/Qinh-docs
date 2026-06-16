> Previous: [API概览.md](API概览.md)　·　Next: [脚本API.md](脚本API.md)
> Related: [API概览.md](API概览.md) · [脚本API.md](脚本API.md) · [../02-服主指南/物品源引用.md](../02-服主指南/物品源引用.md) · [../03-外部插件对接/物品类插件.md](../03-外部插件对接/物品类插件.md)

# 🗡️ Item API

This page covers the `com.qinhuai.corelib.api.item` package in depth: how to use **`ItemManagerAPI`** for unified item fetching, register your own item module, write external item modules in **Groovy** (no plugin compilation needed), read/write item PDC metadata, and an introduction to the semantic layer `SemanticSpec`.

For the reference string syntax (`source:itemID`, JSON parameters, etc.) see [../02-服主指南/物品源引用.md](../02-服主指南/物品源引用.md); for which external plugins the unified item source hooks into, see [../03-外部插件对接/物品类插件.md](../03-外部插件对接/物品类插件.md).

---

## 🎛️ ItemManagerAPI

The item facade, a singleton. In Kotlin use `ItemManagerAPI.instance`, in Java use `ItemManagerAPI.INSTANCE`. Some fetch methods are **static** and can be called directly via `ItemManagerAPI.getHookItem(...)`.

### Registration methods

| Method | Signature | Purpose |
| --- | --- | --- |
| `register` | `register(plugin, module: ItemModule, vararg aliases)` | Register an item module and its aliases with the **plugin as owner** |
| `registerByOwner` | `registerByOwner(ownerKey, module, vararg aliases)` | Register with a **custom owner key** |
| `register` (source) | `register(source: ItemSource, vararg aliases)` | Wrap an `ItemSource` into an `ItemSourceModuleAdapter` and register it |
| `unregister` | `unregister(plugin)` / `unregister(ownerKey)` | Unregister all registrations of a given owner |
| `clear` | `clear()` | Clear all registrations |
| `aliases` | `aliases(): Set<String>` | All aliases currently registered |
| `registerBuiltinSources` | `registerBuiltinSources()` | Register the built-in item sources |

> **The owner concept**: when registering, you bind an owner (a plugin or a string key). When your plugin unloads/reloads, call `unregister(plugin)` to clear all aliases you registered in one shot, avoiding leftovers.

```kotlin
ItemManagerAPI.instance.register(this, MyItemModule(), "myitems", "mi")
// ...in the plugin's onDisable:
ItemManagerAPI.instance.unregister(this)
```

```java
ItemManagerAPI.INSTANCE.register(this, new MyItemModule(), "myitems", "mi");
```

### Fetch methods (static)

| Method | Signature | Returns |
| --- | --- | --- |
| `getHookItem` | `getHookItem(ref)` | `ItemStack?` |
| `getHookItem` | `getHookItem(ref, player)` | `ItemStack?` |
| `getHookItem` | `getHookItem(ref, player, amount)` | `ItemStack?` |
| `resolve` | `resolve(ref, player, amount): ResolveResult` | Structured result (recommended) |
| `diagnose` | `diagnose(ref, player): DiagnosticResult<ItemStack>` | Diagnostic result (for troubleshooting) |

```kotlin
val sword = ItemManagerAPI.getHookItem("qinhitems:excalibur", player, 1)
if (sword != null) player.inventory.addItem(sword)
```

```java
ItemStack sword = ItemManagerAPI.getHookItem("qinhitems:excalibur", player, 1);
```

`getHookItem` returns `null` on failure, with no reason given. **If you need to know why it failed, use `resolve`.**

---

## 🧾 ResolveResult and error codes

`resolve(ref, player, amount)` returns a `ResolveResult` with these fields:

| Field | Meaning |
| --- | --- |
| `success` | Whether it succeeded |
| `item` | The `ItemStack` on success |
| `code` | Error code (see table below) |
| `message` | Human-readable message |
| `source` | The item source that matched |
| `recoverable` | Whether it is recoverable (worth retrying/prompting rather than fatal) |
| `suggestion` | Fix suggestion text |
| `traceId` | Trace ID, to help locate it in the logs |

### Error codes

| code | Meaning |
| --- | --- |
| `OK` | Success |
| `PARSE_FAILED` | Reference string parsing failed (syntax error) |
| `MATERIAL_NOT_FOUND` | Parsed as a vanilla material but the material name does not exist |
| `SOURCE_NOT_FOUND` | The item source for the alias is not registered |
| `MODULE_BUILD_FAILED` | The source was found, but building the item threw an error |
| `ITEM_NOT_FOUND` | The source does not have this item ID |

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

> When troubleshooting you can also use `diagnose(ref, player)` to get a `DiagnosticResult<ItemStack>`, which contains a more complete diagnostic chain.

---

## 🧩 ItemModule: implementing your own item module

The interface is in `com.qinhuai.corelib.api.item.module`:

```kotlin
interface ItemModule {
    fun build(player: Player?, id: String): ItemStack?
    fun buildWithParams(player: Player?, id: String, paramsJson: String?): ItemStack?  // default implementation calls build
}
```

- `build(player, id)`: builds an `ItemStack` by item ID, returning `null` if it cannot be built.
- `buildWithParams(player, id, paramsJson)`: builds with JSON parameters (the parameter part of `source:id{...json...}` in a reference). **The default implementation just delegates to `build`**; only modules that need parameterization should override it.

### Kotlin implementation

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
        // parse paramsJson if you need parameters; if not, don't override and let the default delegate to build
        return build(player, id)
    }
}
```

### Java implementation

```java
public class MyItemModule implements ItemModule {
    @Override
    public ItemStack build(Player player, String id) {
        switch (id) {
            case "ruby": return new ItemStack(Material.RED_DYE);
            default: return null;
        }
    }
    // buildWithParams has a default implementation and need not be overridden
}
```

After registering (see above), the server owner can fetch your item with a reference like `myitems:ruby`.

---

## 🪶 Groovy external item modules (no compilation)

QCL supports writing item modules as **Groovy scripts** dropped into the data directory, **without packaging them into a plugin**; they are loaded automatically at startup or on `/qcl reload`. The mechanism is driven by `ItemManagerBootstrap.reloadExternalModules`.

### Directory

```
plugins/QinhCoreLib/item-modules/*.groovy
```

The repository ships two examples you can adapt:

- `OraxenModule.groovy.example`
- `RPGItemsModule.groovy.example`

> Remove the `.example` suffix (rename to `.groovy`) for it to be loaded.

### Template

A Groovy script must: (1) provide a class that implements `ItemModule`; (2) provide static `onGroovyRegister()` / `onGroovyUnregister()` that call the facade to perform registration/unregistration.

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

// Called when QCL loads: register the module + aliases
static void onGroovyRegister() {
    ItemManagerAPI.instance.register(new MyGroovyItems(), "mygroovy")
}

// Called before QCL unloads/reloads: cleanup
static void onGroovyUnregister() {
    ItemManagerAPI.instance.unregister("mygroovy")
}
```

After registering, the reference `mygroovy:coin` fetches a gold nugget. After editing the script, run `/qcl reload` to hot-reload it, with no server restart needed.

> Note: the `register(module, "alias")` overload without a plugin parameter corresponds to the `register(source: ItemSource, vararg aliases)` path / the register-by-owner-key path—the example registers directly by alias, and unregisters correspondingly with `unregister("alias/ownerKey")`.

---

## 🔍 ItemReferenceParser: parsing references

`ItemReferenceParser.parse(ref)` splits a reference string into a structure:

```
Parsed(alias, itemId, paramsJson?)
```

| Field | Meaning |
| --- | --- |
| `alias` | Source alias (e.g. `qinhitems`) |
| `itemId` | Item ID (e.g. `excalibur`) |
| `paramsJson` | Optional JSON parameter string |

```kotlin
val parsed = ItemReferenceParser.parse("qinhitems:excalibur{\"tier\":3}")
println(parsed.alias)      // qinhitems
println(parsed.itemId)     // excalibur
println(parsed.paramsJson) // {"tier":3}
```

For the full reference syntax (separators, JSON parameters, vanilla material fallback, etc.) see [../02-服主指南/物品源引用.md](../02-服主指南/物品源引用.md).

---

## 🏷️ Item metadata: ItemMetadata / TypeManager

Write data into the item's PDC (`PersistentDataContainer`), persisted along with the item.

### ItemMetadata / ItemMetadataManager

`ItemMetadataManager.get(namespace)` gives you a reader/writer for a given namespace, then `setString` / `getInt` / ... to read and write. The underlying key looks like `qinhcorelib:namespace_key`.

```kotlin
val meta = ItemMetadataManager.get("myaddon")
meta.setString(item, "owner", player.name)
meta.setInt(item, "level", 5)

val owner = meta.getString(item, "owner")
val level = meta.getInt(item, "level")
```

> Use a namespace to isolate your own data and avoid key-name collisions with other plugins.

### TypeManager: item type markers

`TypeManager` stamps a `qcl_type` marker onto the PDC, used to identify "what type of item this is":

| Method | Purpose |
| --- | --- |
| `setType(item, type)` | Stamp a type marker on the item |
| `getType(item)` | Read the type |
| `isType(item, type)` | Check whether it is a given type |

```kotlin
TypeManager.setType(item, "weapon")
if (TypeManager.isType(item, "weapon")) {
    // it's a weapon, run weapon logic
}
```

---

## 🧬 Semantic layer: SemanticSpec (introduction)

The `semantic` package provides a set of **cross-module unified spec descriptions**, abstracting items/skills/forging/effects/actions/conditions into unified Specs, so that modules can recognize each other without directly depending on each other's implementation classes.

- Spec types: `ItemSpec`, `SkillSpec`, `ForgeSpec`, `EffectSpec`, `ActionSpec`, `ConditionSpec`.
- Unified fields: `id`, `namespace`, `version`, `tags`, `variables`, `qualifiedId`.
- Registry: `SemanticSpecRegistry.register / get / all / clear`.
- Validation: `SpecValidator` → `SpecValidationResult` (containing a list of `SpecIssue`).
- Adaptation: `SemanticAdapters` provides placeholder adapters (`registerItem` / `registerSkill` / ...); **each module adapts and registers on its own**, and CoreLib does not directly depend on concrete implementation classes.

```kotlin
val spec = SemanticSpecRegistry.get("myaddon:ruby")
SemanticSpecRegistry.all().forEach { println(it.qualifiedId) }
```

> The semantic layer is a thin abstraction for "letting different modules reach a consensus about the same thing." Ordinary integration work won't need it; it's only needed for cross-module integration (for example, letting the forging system recognize your item spec).

---

## 📚 Further reading

- [脚本API.md](脚本API.md) —— scripts can also use `qcl.itemParse` / `qcl.itemGive` to fetch items.
- [经济API.md](经济API.md) —— pair with item fetching to charge fees and grant rewards.
- [../02-服主指南/物品源引用.md](../02-服主指南/物品源引用.md) —— full reference string syntax.
- [../03-外部插件对接/物品类插件.md](../03-外部插件对接/物品类插件.md) —— which external item sources are hooked in by default.
