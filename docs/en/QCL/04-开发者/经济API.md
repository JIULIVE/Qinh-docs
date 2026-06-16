> Previous: [脚本API.md](脚本API.md)　·　Next: [../05-参考/术语表.md](../05-参考/术语表.md)
> Related: [API概览.md](API概览.md) · [脚本API.md](脚本API.md) · [../02-服主指南/经济动作.md](../02-服主指南/经济动作.md) · [../03-外部插件对接/经济插件.md](../03-外部插件对接/经济插件.md)

# 💰 Economy API

QCL uses **`EconomyBridge`** to flatten economy backends like Vault / ExcellentEconomy / PlayerPoints into a single unified set of calls. This page covers the `com.qinhuai.corelib.economy` package: all `EconomyBridge` methods, the `EconomyProvider` interface, `EconomyTransactionResult` and error codes, the differences between the three backends, `selectProvider`, `parseMoneyRequirement`, `EconomyActionParser` / `EconomyGuiActions`, plus call examples and best practices.

For the server-admin-facing GUI economy action syntax see [../02-服主指南/经济动作.md](../02-服主指南/经济动作.md); for a detailed breakdown of backend integration differences see [../03-外部插件对接/经济插件.md](../03-外部插件对接/经济插件.md).

---

## 🌉 EconomyBridge

The economy facade (a Kotlin object; from Java use `INSTANCE`). All amount methods accept an optional `providerId` / `currencyId`: **if omitted, the default provider and default currency are used**.

### Lifecycle

| Method | Purpose |
| --- | --- |
| `init(plugin)` | Initialize (called by QCL) |
| `reloadFromConfig()` | Reload from config |
| `clear()` | Clean up |
| `isAvailable(): Boolean` | Whether an economy backend is available |

### Query / Operations

| Method | Signature | Returns |
| --- | --- | --- |
| `getBalance` | `getBalance(player: OfflinePlayer, providerId?, currencyId?)` | `Double` |
| `has` | `has(player, amount, providerId?, currencyId?)` | `Boolean` |
| `deposit` | `deposit(player, amount, providerId?, currencyId?)` | `EconomyTransactionResult` |
| `withdraw` | `withdraw(player, amount, providerId?, currencyId?)` | `EconomyTransactionResult` |
| `setBalance` | `setBalance(player, amount, providerId?, currencyId?)` | `EconomyTransactionResult` |

### Provider Selection / Info

| Method | Returns | Purpose |
| --- | --- | --- |
| `selectProvider(providerId?, currencyId?)` | `EconomyProvider?` | Select a specific provider (both omitted = default) |
| `getActiveProvider()` | `EconomyProvider?` | The currently active provider |
| `availableProviderIds()` | `List<String>` | All available provider ids |
| `getDefaultProviderId()` | `String` | Default provider id |
| `getDefaultCurrencyId()` | `String` | Default currency id |

### Parsing / Diagnostics

| Method | Returns | Purpose |
| --- | --- | --- |
| `parseMoneyRequirement(str)` | `MoneyRequirement` | Parse a requirement string into a structure |
| `diagnose()` | `DiagnosticResult<List<BridgeStatus>>` | Diagnose the status of each backend |
| `bridgeStatuses()` | Status list | Detailed status of each backend |

---

## 🔌 EconomyProvider Interface

Each economy backend implements an `EconomyProvider`:

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

In general you **do not need to implement** a provider yourself (unless you are wiring up a new economy backend). Day-to-day integration goes through `EconomyBridge`.

---

## 🧾 EconomyTransactionResult and Error Codes

```
EconomyTransactionResult(success, message?, code, suggestion, provider)
```

Construction helpers:

- `EconomyTransactionResult.ok(provider)` —— success.
- `EconomyTransactionResult.fail(message, code, suggestion, provider)` —— failure.
- `result.toDiagnostic(source)` —— convert to a diagnostic object.

### Common codes

| code | Meaning |
| --- | --- |
| `OK` | Success |
| `CURRENCY_REQUIRED` | The backend requires an explicit currency (e.g. ExcellentEconomy multi-currency), but no `currencyId` was passed |
| `INSUFFICIENT_FUNDS` | Insufficient balance |
| `NO_PROVIDER` | No economy backend available |

---

## 🏦 Differences Between the Three Backends

| Backend | Currency | Offline support | Key points |
| --- | --- | --- | --- |
| **Vault** | Single currency | ✅ Supports offline | No `currencyId` needed |
| **ExcellentEconomy (EE)** | Multi-currency | ❌ Online only | **Must specify `currencyId`**, otherwise reports `CURRENCY_REQUIRED`; offline players cannot be operated on |
| **PlayerPoints** | Points | ✅ Supports offline | Integer points; amounts are processed as integers |

> See [../03-外部插件对接/经济插件.md](../03-外部插件对接/经济插件.md) for details.

---

## 🧮 parseMoneyRequirement

Parses a requirement string into a `MoneyRequirement(providerId, currencyId, operator, amount)`:

```kotlin
val req = EconomyBridge.parseMoneyRequirement(">=100")
// operator=">=", amount=100.0, provider/currency use defaults

val req2 = EconomyBridge.parseMoneyRequirement("excellenteconomy:gold:>=50")
// providerId="excellenteconomy", currencyId="gold", operator=">=", amount=50.0
```

Syntax: `[provider:][currency:]<operator><amount>`. Used for "condition requires the player to have a certain amount of money" type checks.

---

## 🛒 EconomyActionParser / EconomyGuiActions

### EconomyActionParser

`EconomyActionParser.parse(value)` → `EconomyActionSpec(amount, providerId?, currencyId?, failMessage?)`, parses the value string in a GUI action into a structure (for the value syntax see [../02-服主指南/经济动作.md](../02-服主指南/经济动作.md)).

```kotlin
val spec = EconomyActionParser.parse("excellenteconomy:gold:500")
// amount=500, providerId="excellenteconomy", currencyId="gold"
```

### EconomyGuiActions

The economy executor for GUI click actions:

| Method | Corresponding action |
| --- | --- |
| `giveMoney` | `give_money` |
| `takeMoney` | `take_money` (checks balance first; does not deduct if insufficient) |
| `setMoney` | `set_money` |

---

## 🧪 Call Examples

### Query balance / check

```kotlin
val bal = EconomyBridge.getBalance(player)
if (EconomyBridge.has(player, 100.0)) {
    // has at least 100
}
```

```java
double bal = EconomyBridge.INSTANCE.getBalance(player, null, null);
boolean ok = EconomyBridge.INSTANCE.has(player, 100.0, null, null);
```

### Withdraw (handling insufficient balance)

```kotlin
val r = EconomyBridge.withdraw(player, 100.0)
when {
    r.success -> player.sendMessage("扣款成功")
    r.code == "INSUFFICIENT_FUNDS" -> player.sendMessage("余额不足：${r.message}")
    r.code == "NO_PROVIDER" -> logger.warning("没有可用经济后端")
    else -> player.sendMessage("交易失败：${r.message}（${r.suggestion}）")
}
```

### Deposit / set balance

```kotlin
EconomyBridge.deposit(player, 50.0)
EconomyBridge.setBalance(player, 0.0)
```

### Handling CURRENCY_REQUIRED (multi-currency backend)

```kotlin
var r = EconomyBridge.withdraw(player, 50.0)   // no currency specified
if (r.code == "CURRENCY_REQUIRED") {
    // multi-currency backends like EE must specify currencyId and retry
    r = EconomyBridge.withdraw(player, 50.0, "excellenteconomy", "gold")
}
```

### Specifying provider / currency

```kotlin
val provider = EconomyBridge.selectProvider("excellenteconomy", "gold")
if (provider != null && provider.isAvailable()) {
    provider.withdraw(player, 50.0, "gold")
}
```

---

## ✅ Best Practices

- **Always check the returned `code`**, don't just look at `success`—`CURRENCY_REQUIRED` / `NO_PROVIDER` need to be handled differently.
- **Use `withdraw` to deduct; it already checks the balance internally**; don't `getBalance` yourself and then deduct (there's a race condition).
- **For multi-currency backends (EE) always pass `currencyId`**, otherwise `CURRENCY_REQUIRED`; and you can only operate on online players.
- **PlayerPoints uses integer points**; passing a decimal will be processed as an integer, so keep this in mind when designing reward amounts.
- At startup, use `isAvailable()` / `diagnose()` to confirm the backend is ready and give the server admin a clear error.
- Use `result.message` for prompts shown to players, and `result.code` + `result.suggestion` for pinpointing issues in logs.

---

## 📚 Further Reading

- [../02-服主指南/经济动作.md](../02-服主指南/经济动作.md) —— the value syntax for `give_money` / `take_money` / `set_money` in GUIs.
- [../03-外部插件对接/经济插件.md](../03-外部插件对接/经济插件.md) —— integration details and differences for Vault / EE / PlayerPoints.
- [脚本API.md](脚本API.md) —— `qcl.economyHas/Withdraw/Deposit` in scripts.
- [../05-参考/术语表.md](../05-参考/术语表.md) —— quick term reference.
