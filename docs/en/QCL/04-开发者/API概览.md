> Previous: [../03-外部插件对接/经济插件.md](../03-external-plugins/economy-plugins.md)　·　Next: [物品API.md](./item-api.md)
> Related: [物品API.md](./item-api.md) · [脚本API.md](./script-api.md) · [经济API.md](./economy-api.md) · [../03-外部插件对接/物品类插件.md](../03-external-plugins/item-plugins.md) · [../05-参考/术语表.md](../05-reference/glossary.md)

# 🧭 Developer API Overview

This page is the main entry point for developers integrating with QinhCoreLib (hereafter **QCL**). It targets developers writing Bukkit plugins in Java / Kotlin / Groovy, or writing external scripts/modules. After reading this page you will know: **which classes you may depend on, which ones you must not touch, how to declare the dependency, and how to obtain each facade entry point**. From there, jump to the individual API pages as needed.

The principle in one sentence: **depend only on the public API package, never couple to the internal implementation.**

---

## 📦 Public API boundary (apiJar)

QCL builds a separate **apiJar** (API artifact) that exports only the packages officially recognized as the "public contract." The two internal manifests `ApiBoundary` / `ApiJarManifest` decide which packages go into the apiJar. When integrating, you should:

- At compile time: depend on the apiJar (or these public packages within the main jar).
- At runtime: treat QCL as a dependency / soft dependency, and let the server load the actual implementation.

### Public API package list (11)

| Package | Owner | Purpose |
| --- | --- | --- |
| `com.qinhuai.corelib.api.item` | QCL core | Unified item source / item registration facade |
| `com.qinhuai.corelib.api.item.module` | QCL core | `ItemModule` item module interface |
| `com.qinhuai.corelib.script` | QCL core | GraalJS script bridge |
| `com.qinhuai.corelib.economy` | QCL core | Unified economy facade |
| `com.qinhuai.corelib.database` | QCL core | Database management |
| `com.qinhuai.corelib.pdc` | QCL core | PDC (PersistentDataContainer) service |
| `com.qinhuai.corelib.placeholder` | QCL core | PlaceholderAPI bridge |
| `com.qinhuai.items.api` | Submodule QinhItems | Item system public API |
| `com.qinhuai.skills.api` | Submodule QinhSkills | Skill system public API |
| `com.qinhuai.forge.api` | Submodule QinhForge | Forging system public API |
| `com.qinhuai.strengthen.api` | Submodule QinhStrengthen | Strengthening system public API |

> Whether a submodule's `*.api` package is available depends on whether the corresponding subplugin is installed on the server. When integrating with a submodule, always use a soft dependency plus a runtime presence check.

### Public API class list (12)

| Class | Package | Form | Role |
| --- | --- | --- | --- |
| `ItemManagerAPI` | `...api.item` | Singleton (Kotlin `instance` / Java `INSTANCE`) | Item module registration + unified item retrieval |
| `ItemModule` | `...api.item.module` | Interface | The interface a custom item module must implement |
| `QinhScriptApi` | `...corelib.script` | Injected object (named `qcl` in scripts) | Host capabilities callable from scripts |
| `EconomyBridge` | `...corelib.economy` | object (singleton) | Unified economy operations facade |
| `DatabaseManager` | `...corelib.database` | Manager | Database connection / access |
| `PdcServiceManager` | `...corelib.pdc` | Manager | Obtain the PDC service instance |
| `PapiBridge` | `...corelib.placeholder` | Bridge | Resolve / register PlaceholderAPI placeholders |
| `QinhItemsAPI` | `com.qinhuai.items.api` | Submodule facade | QinhItems public capabilities |
| `QinhActionBridges` | `com.qinhuai.items.api` | Submodule facade | Action bridge |
| `QinhSkillsAPI` | `com.qinhuai.skills.api` | Submodule facade | QinhSkills public capabilities |
| `QinhForgeAPI` | `com.qinhuai.forge.api` | Submodule facade | QinhForge public capabilities |
| `QinhStrengthenAPI` | `com.qinhuai.strengthen.api` | Submodule facade | QinhStrengthen public capabilities |

---

## ⛔ Internal package warning

Besides the 11 public packages above, QCL also has about **15 internal packages** (including `command`, `bootstrap`, `debug`, `item` (the implementation layer — note the distinction from `api.item`), `customgui`, etc.). They are **not a contract**:

- Class names, method signatures, and behavior may change without warning between minor versions.
- They are not included in the apiJar, which means there is explicitly no official compatibility guarantee.

> **Iron rule**: when integrating, only import classes from the public API packages. Once you import internal packages like `com.qinhuai.corelib.item.*` (without `api`), `...command`, or `...bootstrap`, the next QCL upgrade will very likely fail to compile or blow up at runtime — that's your problem, not a QCL bug.

---

## 🔗 Declaring the dependency

### plugin.yml

The relationship between QCL and the other Qinh modules:

- **The other Qinh modules (QinhItems/QinhSkills/...) hard-depend on QCL** — they cannot run without QCL.
- **Your third-party plugin**: choose a hard or soft dependency as needed.

```yaml
# Hard dependency: your plugin won't load without QCL
depend:
  - QinhCoreLib

# Or soft dependency: use it if present, degrade gracefully if absent
softdepend:
  - QinhCoreLib
```

### Maven (compile-time dependency, provided by the server at runtime)

```xml
<dependency>
    <groupId>com.qinhuai</groupId>
    <artifactId>QinhCoreLib</artifactId>
    <version>1.2.0</version>
    <scope>provided</scope>
</dependency>
```

> `provided` means "needed to compile, but don't bundle it" — at runtime the implementation is provided by QCL on the server. If an official standalone apiJar classifier is available, prefer depending on the apiJar to ensure you only compile against the public packages.

---

## 🚪 Obtaining each facade entry point

Below is a one-liner for "getting the entry point" of each public facade, written in both Kotlin and Java.

### Kotlin

```kotlin
import com.qinhuai.corelib.api.item.ItemManagerAPI
import com.qinhuai.corelib.economy.EconomyBridge
import com.qinhuai.corelib.script.QinhScriptBridge
import com.qinhuai.corelib.pdc.PdcServiceManager
import com.qinhuai.corelib.placeholder.PapiBridge
import com.qinhuai.corelib.database.DatabaseManager

val items   = ItemManagerAPI.instance        // Item facade (singleton)
val economy = EconomyBridge                   // Economy facade (object, use directly)
val script  = QinhScriptBridge                // Script bridge
val pdc     = PdcServiceManager.get()         // PDC service
// PapiBridge / DatabaseManager are obtained the same way via their official static entry points
```

### Java

```java
import com.qinhuai.corelib.api.item.ItemManagerAPI;
import com.qinhuai.corelib.economy.EconomyBridge;
import com.qinhuai.corelib.script.QinhScriptBridge;
import com.qinhuai.corelib.pdc.PdcServiceManager;

ItemManagerAPI items = ItemManagerAPI.INSTANCE;   // Singleton: use INSTANCE in Java
// EconomyBridge / QinhScriptBridge are Kotlin objects: in Java, use the INSTANCE field as well
EconomyBridge economy = EconomyBridge.INSTANCE;
var pdc = PdcServiceManager.get();
```

> Note the Java-side syntax for Kotlin singletons: an `object` / companion `instance` is generally accessed via `XXX.INSTANCE`. `ItemManagerAPI` uses `instance` in Kotlin and `INSTANCE` in Java.

---

## 🧪 Minimal integration example

Below is a minimal runnable skeleton: in `onEnable`, get the item facade to hand an item to a player, and check a balance.

### Kotlin

```kotlin
import com.qinhuai.corelib.api.item.ItemManagerAPI
import com.qinhuai.corelib.economy.EconomyBridge
import org.bukkit.entity.Player
import org.bukkit.plugin.java.JavaPlugin

class MyAddon : JavaPlugin() {
    override fun onEnable() {
        if (server.pluginManager.getPlugin("QinhCoreLib") == null) {
            logger.warning("QinhCoreLib not detected; some features unavailable")
            return
        }
        logger.info("QCL item aliases: " + ItemManagerAPI.instance.aliases())
    }

    fun reward(player: Player) {
        // Unified retrieval: regardless of whether the source is vanilla or any external plugin
        val item = ItemManagerAPI.getHookItem("qinhitems:excalibur", player, 1)
        if (item != null) player.inventory.addItem(item)

        // Check balance
        if (EconomyBridge.has(player, 100.0)) {
            EconomyBridge.withdraw(player, 100.0)
        }
    }
}
```

### Java

```java
import com.qinhuai.corelib.api.item.ItemManagerAPI;
import com.qinhuai.corelib.economy.EconomyBridge;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

public void reward(Player player) {
    ItemStack item = ItemManagerAPI.getHookItem("qinhitems:excalibur", player, 1);
    if (item != null) player.getInventory().addItem(item);

    if (EconomyBridge.INSTANCE.has(player, 100.0, null, null)) {
        EconomyBridge.INSTANCE.withdraw(player, 100.0, null, null);
    }
}
```

> When calling a Kotlin method with default parameters from Java (e.g. `has(player, amount, providerId?, currencyId?)`), you must explicitly pass `null` for the optional parameters.

---

## 📚 Further reading

- [物品API.md](./item-api.md) — full `ItemManagerAPI` methods, `ItemModule` implementation, Groovy external item modules, item metadata read/write.
- [脚本API.md](./script-api.md) — `QinhScriptBridge` / `qcl` / `ctx`, calling scripts from the host and passing variables, the sandbox.
- [经济API.md](./economy-api.md) — full `EconomyBridge` methods, differences between the three backends, error-code handling.
- [../03-外部插件对接/物品类插件.md](../03-external-plugins/item-plugins.md) — which external item plugins the unified item source connects to.
- [../05-参考/术语表.md](../05-reference/glossary.md) — quick glossary.
