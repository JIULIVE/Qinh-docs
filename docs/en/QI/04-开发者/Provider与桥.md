# Provider & Bridge

> Belongs to: [Developer](API概览.md)　·　Related: [Attributes & Values](../02-服主指南/属性与数值.md) · [Integration](集成.md)

A Provider is an "external system payload" attached to an item, and a Bridge is the "bridge" that interprets it. This mechanism lets QI items carry arbitrary third-party system data without coupling.

---

## 1. Provider Data Model

```kotlin
data class QinhProviderRef(val payload: Map<String, String>) {
    fun primary(): String                     // Get the primary payload
    companion object {
        val ALLOWED_CARRIER_KEYS = setOf("value", "raw", "data", "payload")
        fun ofSingle(carrier: String, content: String): QinhProviderRef
        fun downgradeSemanticMap(semantic: Map<String,String>): QinhProviderRef
    }
}
```

- A Provider is an **opaque payload**: QI does not interpret it, only stores and passes it through.
- The key is the system ID (`ap` / `perm_effects` / `legendinlay` / `magicgem` / your plugin ID).
- Each provider must have exactly one **carrier key** (`value` / `raw` / `data` / `payload`, semantically equivalent).
- If semantic keys are mixed in (such as `set` / `slot`), they are packed into `value`.

---

## 2. YAML → Provider

`ProviderRefLoader` loads from YAML, scanning the paths: `providers`, `capabilities.integrations`, `capabilities.providers`.

```yaml
providers:
  ap:
    value: '{"attack_damage":18.5}'
  legendinlay:
    set: sword_set                  # Semantic key → packed into value
    slot: enhanced_1
    sockets: [normal, bainian]
    socket_lores:
      normal: "Ten-Year Soul Ring socket"
  mythicmobs:
    value: "FireSlash"
```

A node can be a string, a sub-section, or a number / boolean (auto-converted to a string + `raw` carrier).

```kotlin
ProviderRefLoader.loadFromYaml(yaml): Map<String, QinhProviderRef>
ProviderRefLoader.mergeProviders(base, overlay): Map<String, QinhProviderRef>
```

---

## 3. ProviderSnapshot

An immutable snapshot of an item's providers, used by bridges during parsing:

```kotlin
data class ProviderSnapshot(
    val itemId: String,
    val contentHash: String,
    val configVersion: Int,
    val providers: Map<String, QinhProviderRef>,
) {
    fun provider(id: String): QinhProviderRef?
    companion object { fun fromDefinition(def): ProviderSnapshot }
}
```

```kotlin
val snap = QinhItemsAPI.bridge().providerSnapshot(item)
```

---

## 4. Bridge Abstraction

```kotlin
interface QinhProviderBridge {
    val providerId: String
    fun isAvailable(): Boolean                          // Whether the external plugin is loaded
    fun parse(snapshot: ProviderSnapshot): BridgeParseResult?
}

data class BridgeParseResult(
    val providerId: String,
    val externalReference: String? = null,              // Raw payload
    val displayHints: Map<String, String> = emptyMap(), // Parsed display hints
)
```

### Implementing a Bridge

```kotlin
object MyBridge : QinhProviderBridge {
    override val providerId = "myplugin"
    override fun isAvailable() = Bukkit.getPluginManager().isPluginEnabled("MyPlugin")
    override fun parse(snapshot: ProviderSnapshot): BridgeParseResult? {
        val ref = snapshot.provider("myplugin") ?: return null
        val blob = ref.primary()
        return BridgeParseResult("myplugin", blob, mapOf("parsed" to "..."))
    }
}

// Register
QinhItemsAPI.bridge().registerProviderBridge(MyBridge)
```

Built-in QI examples: `MagicGemProviderBridge`, `LegendinlayProviderBridge`, `ApProviderBridgeDemo`.

---

## 5. Bridge Hooks & External Resolvers

```kotlin
// Post-processing after item compilation (e.g. registering the item into an external system)
interface QinhBridgeHook {
    fun onItemCompiled(event: QinhItemCompiledEvent)
}
QinhItemsAPI.bridge().registerBridgeHook("my-hook", hook)

// Let an item reference an external item system (e.g. "mmoi:sword_1")
interface QinhExternalItemResolver {
    val prefix: String
    fun resolve(reference: String): ItemStack?
}
```

Registering an external resolver goes through `QinhIntegrationRegistry.registerExternalResolver(...)`, see [Integration](集成.md).

---

## 6. Zero-Mutation Constraint at Compile Time

A bridge **must not modify the item** during item compilation. `QinhBridgeSandbox` sets `compiling=true` at compile time, and `guardMutation()` intercepts illegal mutations. A bridge's `parse()` should be pure read-only.

---

## 7. Registry

```kotlin
QinhIntegrationRegistry.registerProviderBridge(bridge)
QinhIntegrationRegistry.providerBridge(id): QinhProviderBridge?
QinhIntegrationRegistry.providerBridges(): Collection<QinhProviderBridge>
QinhIntegrationRegistry.dispatchItemCompiled(event)
```

---

## Next Steps

- [Integration](集成.md): QinhSkills / Legendinlay / MagicGem bridge examples
- [Layers & Assembly](层与装配.md): the difference between layers and Providers
