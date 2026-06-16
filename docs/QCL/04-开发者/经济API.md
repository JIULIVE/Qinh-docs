> 上一页：[脚本API.md](脚本API.md)　·　下一页：[../05-参考/术语表.md](../05-参考/术语表.md)
> 相关：[API概览.md](API概览.md) · [脚本API.md](脚本API.md) · [../02-服主指南/经济动作.md](../02-服主指南/经济动作.md) · [../03-外部插件对接/经济插件.md](../03-外部插件对接/经济插件.md)

# 💰 经济 API

QCL 用 **`EconomyBridge`** 把 Vault / ExcellentEconomy / PlayerPoints 等经济后端抹平成一套统一调用。本页讲 `com.qinhuai.corelib.economy` 包：`EconomyBridge` 全方法、`EconomyProvider` 接口、`EconomyTransactionResult` 与错误码、三后端差异、`selectProvider`、`parseMoneyRequirement`、`EconomyActionParser` / `EconomyGuiActions`，以及调用示例与最佳实践。

服主向的 GUI 经济动作写法见 [../02-服主指南/经济动作.md](../02-服主指南/经济动作.md)；后端接入差异详解见 [../03-外部插件对接/经济插件.md](../03-外部插件对接/经济插件.md)。

---

## 🌉 EconomyBridge

经济门面（Kotlin object，Java 用 `INSTANCE`）。所有金额方法都接受可选的 `providerId` / `currencyId`：**不传则用默认 provider 与默认货币**。

### 生命周期

| 方法 | 用途 |
| --- | --- |
| `init(plugin)` | 初始化（QCL 调） |
| `reloadFromConfig()` | 从配置重载 |
| `clear()` | 清理 |
| `isAvailable(): Boolean` | 是否有可用经济后端 |

### 查询/操作

| 方法 | 签名 | 返回 |
| --- | --- | --- |
| `getBalance` | `getBalance(player: OfflinePlayer, providerId?, currencyId?)` | `Double` |
| `has` | `has(player, amount, providerId?, currencyId?)` | `Boolean` |
| `deposit` | `deposit(player, amount, providerId?, currencyId?)` | `EconomyTransactionResult` |
| `withdraw` | `withdraw(player, amount, providerId?, currencyId?)` | `EconomyTransactionResult` |
| `setBalance` | `setBalance(player, amount, providerId?, currencyId?)` | `EconomyTransactionResult` |

### Provider 选择/信息

| 方法 | 返回 | 用途 |
| --- | --- | --- |
| `selectProvider(providerId?, currencyId?)` | `EconomyProvider?` | 选具体 provider（都不传=默认） |
| `getActiveProvider()` | `EconomyProvider?` | 当前活跃 provider |
| `availableProviderIds()` | `List<String>` | 全部可用 provider id |
| `getDefaultProviderId()` | `String` | 默认 provider id |
| `getDefaultCurrencyId()` | `String` | 默认货币 id |

### 解析/诊断

| 方法 | 返回 | 用途 |
| --- | --- | --- |
| `parseMoneyRequirement(str)` | `MoneyRequirement` | 把需求字符串解析成结构 |
| `diagnose()` | `DiagnosticResult<List<BridgeStatus>>` | 诊断各后端状态 |
| `bridgeStatuses()` | 状态列表 | 各后端状态明细 |

---

## 🔌 EconomyProvider 接口

每个经济后端实现一个 `EconomyProvider`：

```kotlin
interface EconomyProvider {
    val id: String
    fun isAvailable(): Boolean
    fun getBalance(player, currencyId?): Double
    fun has(player, amount, currencyId?): Boolean
    fun deposit(player, amount, currencyId?): EconomyTransactionResult
    fun withdraw(player, amount, currencyId?): EconomyTransactionResult
    fun setBalance(player, amount, currencyId?): EconomyTransactionResult
}
```

一般你**不需要自己实现** provider（除非接一个新经济后端）。日常对接通过 `EconomyBridge` 即可。

---

## 🧾 EconomyTransactionResult 与错误码

```
EconomyTransactionResult(success, message?, code, suggestion, provider)
```

构造工具：

- `EconomyTransactionResult.ok(provider)` —— 成功。
- `EconomyTransactionResult.fail(message, code, suggestion, provider)` —— 失败。
- `result.toDiagnostic(source)` —— 转诊断对象。

### 常见 code

| code | 含义 |
| --- | --- |
| `OK` | 成功 |
| `CURRENCY_REQUIRED` | 该后端需要明确指定货币（如 ExcellentEconomy 多货币），但没传 `currencyId` |
| `INSUFFICIENT_FUNDS` | 余额不足 |
| `NO_PROVIDER` | 没有可用经济后端 |

---

## 🏦 三后端差异

| 后端 | 货币 | 离线支持 | 关键点 |
| --- | --- | --- | --- |
| **Vault** | 单货币 | ✅ 支持离线 | 不需要 `currencyId` |
| **ExcellentEconomy（EE）** | 多货币 | ❌ 仅在线 | **必须指定 `currencyId`**，否则报 `CURRENCY_REQUIRED`；离线玩家不可操作 |
| **PlayerPoints** | 点券 | ✅ 支持离线 | 整数点券，金额会按整数处理 |

> 详见 [../03-外部插件对接/经济插件.md](../03-外部插件对接/经济插件.md)。

---

## 🧮 parseMoneyRequirement

把需求字符串解析成 `MoneyRequirement(providerId, currencyId, operator, amount)`：

```kotlin
val req = EconomyBridge.parseMoneyRequirement(">=100")
// operator=">=", amount=100.0, provider/currency 用默认

val req2 = EconomyBridge.parseMoneyRequirement("excellenteconomy:gold:>=50")
// providerId="excellenteconomy", currencyId="gold", operator=">=", amount=50.0
```

语法：`[provider:][currency:]<操作符><金额>`。用于「条件要求玩家有多少钱」这类判定。

---

## 🛒 EconomyActionParser / EconomyGuiActions

### EconomyActionParser

`EconomyActionParser.parse(value)` → `EconomyActionSpec(amount, providerId?, currencyId?, failMessage?)`，把 GUI 动作里的 value 字符串解析成结构（值语法见 [../02-服主指南/经济动作.md](../02-服主指南/经济动作.md)）。

```kotlin
val spec = EconomyActionParser.parse("excellenteconomy:gold:500")
// amount=500, providerId="excellenteconomy", currencyId="gold"
```

### EconomyGuiActions

GUI 点击动作的经济执行器：

| 方法 | 对应动作 |
| --- | --- |
| `giveMoney` | `give_money` |
| `takeMoney` | `take_money`（先查余额，不足不扣） |
| `setMoney` | `set_money` |

---

## 🧪 调用示例

### 查余额 / 判断

```kotlin
val bal = EconomyBridge.getBalance(player)
if (EconomyBridge.has(player, 100.0)) {
    // 够 100
}
```

```java
double bal = EconomyBridge.INSTANCE.getBalance(player, null, null);
boolean ok = EconomyBridge.INSTANCE.has(player, 100.0, null, null);
```

### 扣款（处理余额不足）

```kotlin
val r = EconomyBridge.withdraw(player, 100.0)
when {
    r.success -> player.sendMessage("扣款成功")
    r.code == "INSUFFICIENT_FUNDS" -> player.sendMessage("余额不足：${r.message}")
    r.code == "NO_PROVIDER" -> logger.warning("没有可用经济后端")
    else -> player.sendMessage("交易失败：${r.message}（${r.suggestion}）")
}
```

### 存款 / 设置余额

```kotlin
EconomyBridge.deposit(player, 50.0)
EconomyBridge.setBalance(player, 0.0)
```

### 处理 CURRENCY_REQUIRED（多货币后端）

```kotlin
var r = EconomyBridge.withdraw(player, 50.0)   // 没指定货币
if (r.code == "CURRENCY_REQUIRED") {
    // EE 这类多货币后端必须指定 currencyId 重试
    r = EconomyBridge.withdraw(player, 50.0, "excellenteconomy", "gold")
}
```

### 指定 provider/货币

```kotlin
val provider = EconomyBridge.selectProvider("excellenteconomy", "gold")
if (provider != null && provider.isAvailable()) {
    provider.withdraw(player, 50.0, "gold")
}
```

---

## ✅ 最佳实践

- **永远检查返回的 `code`**，不要只看 `success`——`CURRENCY_REQUIRED` / `NO_PROVIDER` 需要差异化处理。
- **扣款用 `withdraw`，它内部已先查余额**；不要自己 `getBalance` 再扣（有竞态）。
- **多货币后端（EE）务必传 `currencyId`**，否则 `CURRENCY_REQUIRED`；且只能对在线玩家操作。
- **PlayerPoints 是整数点券**，传小数会被按整数处理，设计奖励金额时注意。
- 启动时用 `isAvailable()` / `diagnose()` 确认后端就绪，给服主清晰的报错。
- 给玩家的提示用 `result.message`，给日志的定位用 `result.code` + `result.suggestion`。

---

## 📚 继续阅读

- [../02-服主指南/经济动作.md](../02-服主指南/经济动作.md) —— GUI 里 `give_money` / `take_money` / `set_money` 的 value 写法。
- [../03-外部插件对接/经济插件.md](../03-外部插件对接/经济插件.md) —— Vault / EE / PlayerPoints 接入细节与差异。
- [脚本API.md](脚本API.md) —— 脚本里 `qcl.economyHas/Withdraw/Deposit`。
- [../05-参考/术语表.md](../05-参考/术语表.md) —— 名词速查。
