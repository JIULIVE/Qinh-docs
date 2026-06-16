# Provider 与 Bridge 桥接

> 所属：[开发者](./api-overview.md)　·　相关：[属性与数值](../02-server-guide/attributes-numbers.md) · [集成](./integration.md)

Provider 是挂在物品上的「外部系统载荷」，Bridge 是解读它的「桥」。这套机制让 QI 物品能携带任意第三方系统数据而不耦合。

---

## 1. Provider 数据模型

```kotlin
data class QinhProviderRef(val payload: Map<String, String>) {
    fun primary(): String                     // 取主载荷
    companion object {
        val ALLOWED_CARRIER_KEYS = setOf("value", "raw", "data", "payload")
        fun ofSingle(carrier: String, content: String): QinhProviderRef
        fun downgradeSemanticMap(semantic: Map<String,String>): QinhProviderRef
    }
}
```

- Provider 是**不透明载荷**：QI 不解读，只存储传递。
- 键名是系统 ID（`ap` / `perm_effects` / `legendinlay` / `magicgem` / 你的插件 ID）。
- 每个 provider 必须正好一个**载体键**（`value` / `raw` / `data` / `payload`，语义等价）。
- 若混入语义键（如 `set` / `slot`），会被打包进 `value`。

---

## 2. YAML → Provider

`ProviderRefLoader` 从 YAML 加载，扫描路径：`providers`、`capabilities.integrations`、`capabilities.providers`。

```yaml
providers:
  ap:
    value: '{"attack_damage":18.5}'
  legendinlay:
    set: sword_set                  # 语义键 → 打包进 value
    slot: enhanced_1
    sockets: [normal, bainian]
    socket_lores:
      normal: "十年魂环孔位"
  mythicmobs:
    value: "FireSlash"
```

节点可以是字符串、子段、数字 / 布尔（自动转字符串 + `raw` 载体）。

```kotlin
ProviderRefLoader.loadFromYaml(yaml): Map<String, QinhProviderRef>
ProviderRefLoader.mergeProviders(base, overlay): Map<String, QinhProviderRef>
```

---

## 3. ProviderSnapshot

物品 providers 的不可变快照，桥解析时用：

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

## 4. Bridge 抽象

```kotlin
interface QinhProviderBridge {
    val providerId: String
    fun isAvailable(): Boolean                          // 外部插件是否加载
    fun parse(snapshot: ProviderSnapshot): BridgeParseResult?
}

data class BridgeParseResult(
    val providerId: String,
    val externalReference: String? = null,              // 原始载荷
    val displayHints: Map<String, String> = emptyMap(), // 解析出的显示提示
)
```

### 实现一个桥

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

// 注册
QinhItemsAPI.bridge().registerProviderBridge(MyBridge)
```

QI 内置示例：`MagicGemProviderBridge`、`LegendinlayProviderBridge`、`ApProviderBridgeDemo`。

---

## 5. 桥钩子与外部解析器

```kotlin
// 物品编译后处理（如把物品注册进外部系统）
interface QinhBridgeHook {
    fun onItemCompiled(event: QinhItemCompiledEvent)
}
QinhItemsAPI.bridge().registerBridgeHook("my-hook", hook)

// 让物品引用外部物品系统（如 "mmoi:sword_1"）
interface QinhExternalItemResolver {
    val prefix: String
    fun resolve(reference: String): ItemStack?
}
```

注册外部解析器走 `QinhIntegrationRegistry.registerExternalResolver(...)`，见 [集成](./integration.md)。

---

## 6. 编译期零变更约束

桥在物品编译期间**不得修改物品**。`QinhBridgeSandbox` 在编译时设 `compiling=true`，`guardMutation()` 拦截违规修改。桥的 `parse()` 应是纯读取。

---

## 7. 注册表

```kotlin
QinhIntegrationRegistry.registerProviderBridge(bridge)
QinhIntegrationRegistry.providerBridge(id): QinhProviderBridge?
QinhIntegrationRegistry.providerBridges(): Collection<QinhProviderBridge>
QinhIntegrationRegistry.dispatchItemCompiled(event)
```

---

## 下一步

- [集成](./integration.md)：QinhSkills / Legendinlay / MagicGem 桥实例
- [层与装配](./layers-assembly.md)：层 vs Provider 的区别
