# Complete API Reference (QinhItemsAPI + facades)

> Belongs to: [Developers](./api-overview.md)　·　Related: [API Overview](./api-overview.md) · [Events](./events.md)

`com.qinhuai.items.api.QinhItemsAPI` (Kotlin object). Java calls use `.INSTANCE`. The signatures below are written in Kotlin style.

---

## 1. Basic methods

```kotlin
const val API_VERSION = 1

fun isQinhItem(item: ItemStack): Boolean
fun getItemId(item: ItemStack): String?
fun getDefinition(item: ItemStack): QinhItemDefinition?
fun getProviders(item: ItemStack): Map<String, QinhProviderRef>
```

### Soulbinding and restrictions

```kotlin
data class UseCheckResult(val allowed: Boolean, val reasons: List<String> = emptyList())

fun isSoulbound(item: ItemStack): Boolean
fun getSoulboundOwner(item: ItemStack): java.util.UUID?
fun bindSoulbound(item: ItemStack, owner: Player, level: Int = 0)
fun clearSoulbound(item: ItemStack)

fun canUse(player: Player, item: ItemStack): UseCheckResult
fun evaluateNativeRestriction(player: Player, raw: String): Boolean?
fun meetsPassiveRequirements(player: Player, item: ItemStack): Boolean
```

#### Use-condition check

```java
QinhItemsAPI.UseCheckResult r = QinhItemsAPI.INSTANCE.canUse(player, stack);
if (!r.getAllowed()) {
    java.util.List<String> reasons = r.getReasons();   // Reasons that were not met (may contain Chinese)
}
```

`canUse` evaluates the item's `options.restrictions` (level / permission / world native checks; class/custom checks are delegated to `QinhItemUseCheckEvent`).

---

## 2. Assembly facade `assembly()`

```kotlin
fun build(definitionId: String, amount: Int = 1): ItemStack?      // Generate brand new
fun compile(definitionId: String, amount: Int = 1): ItemStack?    // Same as build
fun rebuild(item: ItemStack): ItemStack?                          // Rebuild (preserves instance/seed)

fun readLayerPack(item: ItemStack, layerId: String): QinhLayerPatchPack?
fun layerStack(item: ItemStack): List<QinhLayerPatchPack>
fun applyLayerPatch(item: ItemStack, pack: QinhLayerPatchPack): Pair<ItemStack?, LayerWriteResult>
fun removeLayer(item: ItemStack, layerId: String): ItemStack
```

> Deprecated: `readLayer` / `writeLayer` (use `readLayerPack` / `applyLayerPatch` instead).

For the layer mechanism see [Layers and Assembly](./layers-assembly.md). `LayerWriteResult`: `OK` / `NOT_QINH_ITEM` / `DOMAIN_VIOLATION` / `PROVIDER_PATCH_FORBIDDEN`.

---

## 3. Variables facade `variables()`

```kotlin
fun get(item: ItemStack): Map<String, String>
fun explain(item: ItemStack): Map<String, VariableTrace.Entry>
fun set(item, key, value, owner = OWNER_QI_ADMIN): Pair<ItemStack?, InstanceWriteResult>
fun setAll(item, values, owner = OWNER_QI_ADMIN): Pair<ItemStack?, InstanceWriteResult>
fun lock(item, key, owner): Boolean
fun unlock(item, key, owner): Boolean
fun refresh(item: ItemStack): ItemStack?
```

`InstanceWriteResult`: `OK` / `NOT_QINH_ITEM` / `LOCKED_BY_OTHER` / `DOMAIN_VIOLATION`. See [Variables](../02-server-guide/variables.md#7-开发者-api) for details.

---

## 4. Actions facade `actions()`

```kotlin
fun registerHandler(handler: QinhActionHandler)
fun handler(handlerId: String): QinhActionHandler?
fun table(itemId: String): ActionTable?
fun tableForItem(item: ItemStack): ActionTable?
fun dispatch(player: Player, item: ItemStack, trigger: String): ActionDispatchService.DispatchReport?
fun reloadTables(): Int
fun tableCount(): Int
fun registerPayloadSchema(handlerId: String, block: PayloadSchemaBuilder.() -> Unit)
fun payloadSchema(handlerId: String): PayloadSchema?
fun hasPayloadSchema(handlerId: String): Boolean
```

See [Action Handler Development](./handler-development.md) for details.

---

## 5. Layers facade `layers()`

```kotlin
fun ids(item: ItemStack): List<String>
fun has(item: ItemStack, layerId: String): Boolean
fun read(item: ItemStack, layerId: String): QinhLayerState?
fun all(item: ItemStack): List<QinhLayerState>
fun string(item, layerId, key): String?
fun int(item, layerId, key): Int?
fun long(item, layerId, key): Long?
fun double(item, layerId, key): Double?
```

`QinhLayerState` provides type-safe value access: `string/int/long/double/boolean(key)`, `intOr/longOr/doubleOr/stringOr(key, fallback)`.

---

## 6. Bridge facade `bridge()`

```kotlin
fun providerSnapshot(item: ItemStack): ProviderSnapshot?
fun registerProviderBridge(bridge: QinhProviderBridge)
fun registerBridgeHook(id: String, hook: QinhBridgeHook)
fun parseProviders(snapshot: ProviderSnapshot): Map<String, BridgeParseResult>
```

See [Provider and Bridge](./providers-bridges.md) for details.

---

## 7. Combat facade `combat()` → `QinhCombatAPI`

```kotlin
fun isEnabled(): Boolean
fun swingHitsVanilla(): Boolean
fun registerAttributeBackend(backend: AttributeBackend)
fun activeAttributeBackend(): AttributeBackend
fun refreshEquipmentAttributes(player: Player): Int
```

See [Attributes and Values](../02-server-guide/attributes-numbers.md#8-开发者读属性) for details.

---

## 8. Type aliases (API re-exports)

For convenient referencing, QI re-exports a batch of types in the `api` package:

```kotlin
// QinhActionBridges.kt
typealias ActionRef / ActionTable / ActionTriggerDef
typealias QinhActionHandler / QinhActionContext / ActionDispatchResult
typealias QinhActionTriggerEvent / QinhActionDispatchedEvent
typealias QISkillUseEvent / QISkillBridge

// QinhItemBridges.kt
typealias QinhProviderBridge / QinhExternalItemResolver / QinhBridgeHook
typealias ProviderSnapshot / BridgeParseResult / QinhItemCompiledEvent
```

---

## 9. Common data types

### QinhItemDefinition (excerpt)

Item template. For the full field table see [Item Definition](../02-server-guide/item-definition.md#2-顶层字段总表).

### QinhItemInstanceData

```kotlin
data class QinhItemInstanceData(
    val values: Map<String,String>,        // Rolled random values
    val overrides: Map<String,String>,     // Runtime overrides
    val overrideOwners: Map<String,String>,
    val locks: Map<String,String>,         // Variable locks key→owner
    val seed: Long?,
    val soulboundOwner: String?,
    val soulboundLevel: Int,
) {
    companion object {
        const val OWNER_QI_CORE = "qi_core"
        const val OWNER_QI_ADMIN = "qi_admin"
        const val OWNER_QI_UI = "qi_ui"
        fun read(item: ItemStack): QinhItemInstanceData
        fun write(item: ItemStack, data: QinhItemInstanceData)
    }
}
```

---

## 10. Complete usage example (marketplace plugin)

```java
import com.qinhuai.items.api.QinhItemsAPI;
import org.bukkit.inventory.ItemStack;

// Player lists the item in their hand
ItemStack hand = player.getInventory().getItemInMainHand();
if (QinhItemsAPI.INSTANCE.isSoulbound(hand)) {
    player.sendMessage("§cSoulbound items cannot be listed");
    return;
}
String qiId = QinhItemsAPI.INSTANCE.getItemId(hand);   // null = not a QI item
// …serialize hand and store it in the marketplace database…

// Buyer purchases; deliver the admin-configured product
ItemStack reward = QinhItemsAPI.INSTANCE.assembly().build("legendary_sword", 1);
if (reward != null) buyer.getInventory().addItem(reward);
```

> **Storage advice**: For player consignments, serialize the `ItemStack` directly (NBT fully preserved), no rebuild needed; for fixed admin products, store "ID + amount" and `build()` at delivery time to freshly craft from the latest template.

---

## Next step

- [Event Catalog](./events.md)
- [Provider and Bridge](./providers-bridges.md)
- [Layers and Assembly](./layers-assembly.md)
