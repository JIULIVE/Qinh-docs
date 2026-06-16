# API Overview & Integration

> Belongs to: [Developer](./api-overview.md)　·　Subpages: [API Reference](./api-reference.md) · [Events](./events.md) · [Action Handler Development](./handler-development.md)

This chapter is for plugin developers: how to depend on QI, where the entry point is, and how the API is layered. For full method signatures, see [API Reference](./api-reference.md).

---

## 1. Depending on QI

The QI runtime is already installed on the server; you only need a **compile-time dependency** (`provided`) — don't bundle it into your own jar.

### Install to local Maven

```bash
mvn install:install-file -Dfile=QinhItems-1.1.0.jar -DgroupId=com.qinhuai -DartifactId=QinhItems -Dversion=1.1.0 -Dpackaging=jar
```

### pom.xml

```xml
<dependency>
  <groupId>com.qinhuai</groupId>
  <artifactId>QinhItems</artifactId>
  <version>1.1.0</version>
  <scope>provided</scope>
</dependency>
```

### plugin.yml

```yaml
softdepend: [QinhItems]
```

> If compilation reports `com.qinhuai.corelib.*` missing, also install-file + provided-reference **QinhCoreLib** (a few members of QI's API reference CoreLib types).

---

## 2. Entry Point: `QinhItemsAPI`

```
Package: com.qinhuai.items.api
Class:   QinhItemsAPI   (Kotlin object singleton)
```

- **Java** calls with `.INSTANCE`: `QinhItemsAPI.INSTANCE.isQinhItem(stack)`
- **Kotlin** directly: `QinhItemsAPI.isQinhItem(stack)`

API version constant: `QinhItemsAPI.API_VERSION = 1`.

---

## 3. Layered Facades

QI's API is split into several facades, accessed by responsibility:

| Facade | How to get | What it manages |
|---|---|---|
| Base | `QinhItemsAPI.xxx` | Item identification, definition lookup, soulbinding, canUse, fetching providers |
| Assembly | `QinhItemsAPI.assembly()` | Building items, rebuilding, layer patches |
| Variables | `QinhItemsAPI.variables()` | Get / set / lock variables, tracing, refresh |
| Actions | `QinhItemsAPI.actions()` | Registering handlers, action tables, dispatch, payload schema |
| Layers | `QinhItemsAPI.layers()` | Reading layer state and values |
| Bridge | `QinhItemsAPI.bridge()` | Registering / querying Provider bridges |
| Combat | `QinhItemsAPI.combat()` | Combat / attribute refresh (= `QinhCombatAPI`) |

For full signatures, see [API Reference](./api-reference.md).

---

## 4. The Four Most Common Tasks

### Build an item

```java
ItemStack item = QinhItemsAPI.INSTANCE.assembly().build("itemId", count);
// Returns null if the ID doesn't exist
```

### Check whether it's a QI item / get the ID

```java
boolean isQi = QinhItemsAPI.INSTANCE.isQinhItem(stack);
String id    = QinhItemsAPI.INSTANCE.getItemId(stack);   // Returns null if not a QI item
```

### Check soulbinding (a must for markets / mail)

```java
boolean bound = QinhItemsAPI.INSTANCE.isSoulbound(stack);
java.util.UUID owner = QinhItemsAPI.INSTANCE.getSoulboundOwner(stack);
```

### Register an action handler

```kotlin
QinhItemsAPI.actions().registerHandler(object : QinhActionHandler {
    override val handlerId = "myplugin:hello"
    override fun dispatch(ctx: QinhActionContext): ActionDispatchResult {
        ctx.player.sendMessage("payload=${ctx.payload}")
        return ActionDispatchResult.HANDLED
    }
})
```

---

## 5. Availability & Null Values

- All generation / reads return `null` when "the ID doesn't exist" or "it's not a QI item" — always null-check.
- Don't call into QI when it isn't enabled: use `Bukkit.getPluginManager().getPlugin("QinhItems")` to check liveness, or rely on `softdepend` load ordering.
- Item identification / reverse lookup (item → id) is **only in QI's API**; CoreLib doesn't have it.

---

## 6. Choosing an Integration Route

| You want to… | Use | Section |
|---|---|---|
| Build items by ID, reverse-look-up item ownership | QI `assembly()` / `isQinhItem` | [API Reference](./api-reference.md) |
| Resolve items via `qi:id` / `qinhitems:id` prefixes | CoreLib `ItemManagerAPI.getHookItem(ref)` | [Integration](./integration.md) |
| Attach external-system data to items | Provider + Bridge | [Provider & Bridge](./providers-bridges.md) |
| Custom logic after a trigger | Action handlers | [Action Handler Development](./handler-development.md) |
| Listen to item lifecycle | Events | [Events](./events.md) |
| Socketing / inlay / enhancement (state after modifying an item) | Layer API | [Layers & Assembly](./layers-assembly.md) |
| Ready-made code for markets / mail / lotteries / enhancement, etc. | — | [API Cookbook](./api-recipes.md) |
| Integrate AP / QinhSkills / gem backends | — | [Integration in Practice](./integration-howto.md) |

---

## Next Steps

- [Full API Reference](./api-reference.md)
- [Event Compendium](./events.md)
