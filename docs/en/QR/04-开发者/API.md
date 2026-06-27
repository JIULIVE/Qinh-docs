# QinhRuinsAPI

> In: [Developer](./api.md)　·　Same group: [Events](./events.md) · [Affix Scripts](./affix-scripting.md) · [Provider & Bridges](./providers-bridges.md) · [Placeholders](./placeholders.md) · [Data Storage](./data-storage.md)
> Back: [Core Concepts](../01-getting-started/core-concepts.md)

This page is for plugin developers: how to depend on QR, where the entry point is, and which methods it exposes. QR's public facade is the singleton `QinhRuinsAPI`, centered on querying and generating "anchors" (a ruin instance that really exists in a world). For terminology see [Core Concepts](../01-getting-started/core-concepts.md).

---

## 1. Depending on QR

The QR runtime is already installed on the server; you only need a **compile-time dependency** (`provided`) — don't bundle it into your own jar. QR hard-depends on **QinhCoreLib (QCL)**, and some APIs (e.g. the keystone item source) reference CoreLib types.

### Install to local Maven

```bash
mvn install:install-file -Dfile=QinhRuins-1.0.0.jar -DgroupId=com.qinhuai -DartifactId=QinhRuins -Dversion=1.0.0 -Dpackaging=jar
```

### pom.xml

```xml
<dependency>
  <groupId>com.qinhuai</groupId>
  <artifactId>QinhRuins</artifactId>
  <version>1.0.0</version>
  <scope>provided</scope>
</dependency>
```

> If compilation reports missing `com.qinhuai.corelib.*`, also install-file **QinhCoreLib** and reference it as `provided`.

### plugin.yml

```yaml
softdepend: [QinhRuins]
```

Use `softdepend` to ensure QR loads first; before calling you can check liveness with `Bukkit.getPluginManager().getPlugin("QinhRuins")`.

---

## 2. Entry point: `QinhRuinsAPI`

```
Package: com.qinhuai.ruins.api
Class:   QinhRuinsAPI   (Kotlin object singleton)
```

- **Kotlin** direct: `QinhRuinsAPI.count()`
- **Java** with `.INSTANCE`: `QinhRuinsAPI.INSTANCE.count()`

---

## 3. The `RuinInfo` data structure

The ruin-info carrier returned by all query methods (nested inside `QinhRuinsAPI`):

```kotlin
data class RuinInfo(
    val anchorId: String,   // Unique anchor id
    val templateId: String, // Which template it uses
    val location: Location, // Anchor location (cloned, safe to modify)
    val cleared: Boolean,   // Whether already cleared (CLEARED or RECYCLED state)
)
```

> `cleared` is `true` when the anchor is in the `CLEARED` **or** `RECYCLED` state; it's `false` for `DORMANT` / `ACTIVE`. For state meanings see [Core Concepts · Anchors](../01-getting-started/core-concepts.md).
> `location` is a cloned copy; modifying it doesn't affect the real anchor.

---

## 4. Method reference

| Method | Signature | Notes |
|---|---|---|
| Spawn a ruin | `spawn(templateId: String, location: Location): String?` | Generate a ruin at the given coordinates per the template, returning the new anchor id; returns `null` if the template doesn't exist or generation fails. The coordinates take the integer coordinates of the containing block. |
| Anchor count | `count(): Int` | The number of all anchors in the current world. |
| Ruin at coordinates | `ruinAt(location: Location): RuinInfo?` | Query the ruin containing this coordinate (falling inside some anchor's bounding box), `null` if none. |
| Nearest ruin | `nearest(location, templateId: String? = null, radius: Double = 12000.0): RuinInfo?` | Find the nearest ruin. With `templateId`, finds only the nearest one of that template (**ignores radius**); without, finds the nearest within `radius`. |
| List ruins | `list(templateId: String? = null): List<RuinInfo>` | List all anchors; with `templateId`, list only that template's. |
| Remove a ruin | `remove(anchorId: String): Boolean` | Recycle (fade-restore / remove) a given anchor, returning whether it hit. |
| Template id list | `templateIds(): List<String>` | All loaded ruin template ids. |

::: warning Caution
The two branches of `nearest` have different semantics: **when `templateId` is passed, it queries the "globally nearest one of that template" and the `radius` parameter is ignored**; only when `templateId` is omitted does `radius` take effect.
:::

---

## 5. Kotlin call examples

```kotlin
import com.qinhuai.ruins.api.QinhRuinsAPI

// Spawn a ruin at the player's feet
val anchorId: String? = QinhRuinsAPI.spawn("ancient_tower", player.location)
if (anchorId == null) {
    player.sendMessage("§cGeneration failed: template missing or site selection failed")
}

// Is the player standing inside some ruin?
val here = QinhRuinsAPI.ruinAt(player.location)
if (here != null && !here.cleared) {
    player.sendMessage("§eYou are exploring ${here.templateId} (not cleared)")
}

// Find the nearest ruin of a kind and report distance
val tower = QinhRuinsAPI.nearest(player.location, "ancient_tower")
tower?.let {
    val dist = it.location.distance(player.location)
    player.sendMessage("§aThe nearest tower is ${dist.toInt()} blocks away")
}

// Count + list
player.sendMessage("§7There are ${QinhRuinsAPI.count()} ruins server-wide")
QinhRuinsAPI.list("ancient_tower").forEach { /* ... */ }

// Remove one
QinhRuinsAPI.remove(anchorId ?: return)
```

## 6. Java call examples

```java
import com.qinhuai.ruins.api.QinhRuinsAPI;
import com.qinhuai.ruins.api.QinhRuinsAPI.RuinInfo;

String anchorId = QinhRuinsAPI.INSTANCE.spawn("ancient_tower", player.getLocation());
if (anchorId == null) {
    player.sendMessage("§cGeneration failed");
    return;
}

RuinInfo info = QinhRuinsAPI.INSTANCE.ruinAt(player.getLocation());
if (info != null) {
    player.sendMessage("Anchor " + info.getAnchorId() + " / template " + info.getTemplateId()
        + " / cleared " + info.getCleared());
}

// nearest with default params: Java must pass all args, radius defaults to 12000
RuinInfo nearest = QinhRuinsAPI.INSTANCE.nearest(player.getLocation(), "ancient_tower", 12000.0);

int total = QinhRuinsAPI.INSTANCE.count();
boolean removed = QinhRuinsAPI.INSTANCE.remove(anchorId);
```

> Kotlin default parameters aren't visible to Java; on the Java side `nearest` must be passed all three arguments explicitly (`templateId` can be `null`, `radius` passed as `12000.0`).

---

## 7. Threading and nullability

- **Must be called on the main thread.** `spawn` / `remove` modify world blocks and read/write the anchor table; async calls throw a threading exception or produce dirty data. If you're in an async context (e.g. a database callback), first switch back to the main thread with `Bukkit.getScheduler().runTask(...)`.
- All queries return `null` / an empty list when "the template doesn't exist" or "no ruin at the coordinate" — **always null-check**.
- `spawn` returning `null` has two causes: the template id doesn't exist, or site selection / pasting failed (terrain not allowed, etc.).
- `RuinInfo.location` is already cloned, safe to modify; to operate on the real anchor use the `anchorId` with the corresponding methods.

---

## 8. What you want to do → what to use

| You want to… | Use |
|---|---|
| Build a ruin by template at a given point | `spawn` |
| Tell if a player is inside a ruin / get the containing ruin | `ruinAt` |
| A compass / guide to the nearest ruin | `nearest` |
| List all ruins for a back-office panel | `list` / `count` |
| Listen for ruin spawn / clear / loot | [Events](./events.md) |
| Run custom logic when a realm activates | [Affix Scripts](./affix-scripting.md) |
| Reference keystone items (drops / shop / quests) | [Provider & Bridges · Keystone item source](./providers-bridges.md) |
| HUD / scoreboard display of ruin state | [PlaceholderAPI Placeholders](./placeholders.md) |

---

## Next

- [Events](./events.md) — spawn / clear / loot / intercept spawn
- [Provider & Bridges](./providers-bridges.md) — growth / party / keystone item source / Citizens
