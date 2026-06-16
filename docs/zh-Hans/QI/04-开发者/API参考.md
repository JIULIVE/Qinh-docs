# API 完整参考（QinhItemsAPI + 门面）

> 所属：[开发者](./api-overview.md)　·　相关：[API 概览](./api-overview.md) · [事件](./events.md)

`com.qinhuai.items.api.QinhItemsAPI`（Kotlin object）。Java 调用带 `.INSTANCE`。下列签名为 Kotlin 写法。

---

## 1. 基础方法

```kotlin
const val API_VERSION = 1

fun isQinhItem(item: ItemStack): Boolean
fun getItemId(item: ItemStack): String?
fun getDefinition(item: ItemStack): QinhItemDefinition?
fun getProviders(item: ItemStack): Map<String, QinhProviderRef>
```

### 灵魂绑定与限制

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

#### 使用条件检查

```java
QinhItemsAPI.UseCheckResult r = QinhItemsAPI.INSTANCE.canUse(player, stack);
if (!r.getAllowed()) {
    java.util.List<String> reasons = r.getReasons();   // 不满足的原因（含中文）
}
```

`canUse` 会评估物品 `options.restrictions`（等级 / 权限 / 世界原生判，class/自定义委托给 `QinhItemUseCheckEvent`）。

---

## 2. 装配门面 `assembly()`

```kotlin
fun build(definitionId: String, amount: Int = 1): ItemStack?      // 全新生成
fun compile(definitionId: String, amount: Int = 1): ItemStack?    // 同 build
fun rebuild(item: ItemStack): ItemStack?                          // 重建（保留实例/种子）

fun readLayerPack(item: ItemStack, layerId: String): QinhLayerPatchPack?
fun layerStack(item: ItemStack): List<QinhLayerPatchPack>
fun applyLayerPatch(item: ItemStack, pack: QinhLayerPatchPack): Pair<ItemStack?, LayerWriteResult>
fun removeLayer(item: ItemStack, layerId: String): ItemStack
```

> 已弃用：`readLayer` / `writeLayer`（用 `readLayerPack` / `applyLayerPatch` 替代）。

层机制见 [层与装配](./layers-assembly.md)。`LayerWriteResult`：`OK` / `NOT_QINH_ITEM` / `DOMAIN_VIOLATION` / `PROVIDER_PATCH_FORBIDDEN`。

---

## 3. 变量门面 `variables()`

```kotlin
fun get(item: ItemStack): Map<String, String>
fun explain(item: ItemStack): Map<String, VariableTrace.Entry>
fun set(item, key, value, owner = OWNER_QI_ADMIN): Pair<ItemStack?, InstanceWriteResult>
fun setAll(item, values, owner = OWNER_QI_ADMIN): Pair<ItemStack?, InstanceWriteResult>
fun lock(item, key, owner): Boolean
fun unlock(item, key, owner): Boolean
fun refresh(item: ItemStack): ItemStack?
```

`InstanceWriteResult`：`OK` / `NOT_QINH_ITEM` / `LOCKED_BY_OTHER` / `DOMAIN_VIOLATION`。详见 [变量](../02-server-guide/variables.md#7-开发者-api)。

---

## 4. 动作门面 `actions()`

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

详见 [动作处理器开发](./handler-development.md)。

---

## 5. 层门面 `layers()`

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

`QinhLayerState` 提供类型安全取值：`string/int/long/double/boolean(key)`、`intOr/longOr/doubleOr/stringOr(key, fallback)`。

---

## 6. 桥门面 `bridge()`

```kotlin
fun providerSnapshot(item: ItemStack): ProviderSnapshot?
fun registerProviderBridge(bridge: QinhProviderBridge)
fun registerBridgeHook(id: String, hook: QinhBridgeHook)
fun parseProviders(snapshot: ProviderSnapshot): Map<String, BridgeParseResult>
```

详见 [Provider 与桥](./providers-bridges.md)。

---

## 7. 战斗门面 `combat()` → `QinhCombatAPI`

```kotlin
fun isEnabled(): Boolean
fun swingHitsVanilla(): Boolean
fun registerAttributeBackend(backend: AttributeBackend)
fun activeAttributeBackend(): AttributeBackend
fun refreshEquipmentAttributes(player: Player): Int
```

详见 [属性与数值](../02-server-guide/attributes-numbers.md#8-开发者读属性)。

---

## 8. 类型别名（API 再导出）

为方便引用，QI 在 `api` 包再导出了一批类型：

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

## 9. 常用数据类型

### QinhItemDefinition（节选）

物品模板。字段全表见 [物品定义](../02-server-guide/item-definition.md#2-顶层字段总表)。

### QinhItemInstanceData

```kotlin
data class QinhItemInstanceData(
    val values: Map<String,String>,        // 滚出的随机值
    val overrides: Map<String,String>,     // 运行时覆盖
    val overrideOwners: Map<String,String>,
    val locks: Map<String,String>,         // 变量锁 键→owner
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

## 10. 完整使用示例（市场插件）

```java
import com.qinhuai.items.api.QinhItemsAPI;
import org.bukkit.inventory.ItemStack;

// 玩家上架手中物品
ItemStack hand = player.getInventory().getItemInMainHand();
if (QinhItemsAPI.INSTANCE.isSoulbound(hand)) {
    player.sendMessage("§c绑定物品无法上架");
    return;
}
String qiId = QinhItemsAPI.INSTANCE.getItemId(hand);   // null = 非 QI 物品
// …序列化 hand 存进市场数据库…

// 买家购买、发放管理员配置的商品
ItemStack reward = QinhItemsAPI.INSTANCE.assembly().build("legendary_sword", 1);
if (reward != null) buyer.getInventory().addItem(reward);
```

> **存储建议**：玩家寄售直接序列化 `ItemStack`（NBT 完整保留），无需重建；管理员固定商品存「ID + 数量」，发放时 `build()` 现造拿最新模板。

---

## 下一步

- [事件大全](./events.md)
- [Provider 与桥](./providers-bridges.md)
- [层与装配](./layers-assembly.md)
