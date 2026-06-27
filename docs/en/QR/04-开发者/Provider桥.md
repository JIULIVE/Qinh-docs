# Provider & Bridges

> In: [Developer](./api.md)　·　Same group: [QinhRuinsAPI](./api.md) · [Affix Scripts](./affix-scripting.md) · [Data Storage](./data-storage.md)
> Related: [Party & Sessions](../02-server-guide/party-sessions.md) · [Realms & Keystones](../02-server-guide/realms-keystones.md)

QR doesn't want to hard-bind to a particular class / party plugin, so it abstracts these "external capabilities" into **pluggable source bridges (Providers)**: at startup it auto-detects which plugins are installed, picks the best, and falls back to vanilla / built-in implementations if none are installed. This page covers the four bridges' interfaces, fallback chains, and auto-detection logic. Package `com.qinhuai.ruins.integration`.

---

## Auto-detection controller: ProviderBridges

At startup, `ProviderBridges.register()` (called in `onEnable`) detects and wires up each bridge by priority, then prints the wired-up growth source name to the console:

```
Growth source wired up: QinhClass
```

It does two things:

1. **Growth (GrowthProvider)**: `QinhClass` first → else `MMOCore` → else keep the vanilla default.
2. **Party (PartyProvider)**: if `MMOCore` is installed, wire up MMOCore's party → else keep the built-in party.

"Installed and available" = the plugin is enabled **and** the corresponding Provider's `isAvailable()` (reflection can reach the target class) is true. A third-party plugin is auto-wired-up as long as it satisfies the class-name convention, **without changing code in QR**.

---

## 1. GrowthProvider — growth source

"Growth" is the player-strength metric QR uses to scale loot / difficulty (see [Loot System](../02-server-guide/loot-tables.md)). The interface:

```kotlin
interface GrowthProvider {
    val id: String
    fun isAvailable(): Boolean
    fun getGrowth(player: Player): Double          // The growth value
    fun hasClass(player: Player, classId: String): Boolean  // Whether of a given class
}
```

Fallback chain (`GrowthProviders.active()` gets the currently active one):

| Priority | Implementation | Value source |
|---|---|---|
| 1 | `QinhClassGrowthProvider` (id=`qinhclass`) | Reflects `getLevel` / `isClass` of `com.qinhuai.clazz.api.QinhClassAPI` |
| 2 | `MMOCoreGrowthProvider` (id=`mmocore`) | Reflects `getLevel` / `getProfess` of `net.Indyuce.mmocore.api.player.PlayerData` |
| Fallback | `VanillaGrowthProvider` (id=`vanilla`) | Vanilla player experience level `player.level`; `hasClass` is always `false` |

> The fallback is always available (`isAvailable()` is always true), so QR **always has a growth value to read** and won't crash for lack of a class plugin.

---

## 2. PartyProvider — party source

Sharing progress / loot ownership across a party requires knowing "who is on whose team". The interface:

```kotlin
data class RuinParty(val leader: UUID, val members: List<Player>)

interface PartyProvider {
    val id: String
    fun isAvailable(): Boolean
    fun getParty(player: Player): RuinParty
}
```

Fallback chain (`PartyProviders.active()`):

| Priority | Implementation | Party source |
|---|---|---|
| 1 | `MMOCorePartyProvider` (id=`mmocore`) | Reflects MMOCore `PlayerData.getParty().getOnlineMembers()` |
| Fallback | `BuiltinPartyProvider` (id=`builtin`) | QR's built-in party `BuiltinParties` (the runtime party of the `/qr party` command group) |

> For a solo player (no party), it returns a `RuinParty` containing only themselves. For configuring the built-in party see [Party & Sessions](../02-server-guide/party-sessions.md).

---

## 3. KeystoneItemSource — register the keystone item source with QCL

QR registers keystones / guide items as a **QCL item source (`ItemSource`, id=`qinhruins`)**, so any system that recognizes QCL item references (loot tables, shops, quests, GUIs) can obtain a keystone via `qinhruins:<...>`, **without depending on QR's API**.

Registration (`onEnable`):

```kotlin
ItemManagerAPI.instance.register(KeystoneItemSource, "qinhruins", "qr-keystone")
```

→ attaches both the aliases `qinhruins` and `qr-keystone`.

Reference syntax (`KeystoneItemSource.getItem(id, amount)`):

| Reference | Produces |
|---|---|
| `qinhruins:<tier>` | A keystone of the corresponding tier, e.g. `qinhruins:3` = a T3 keystone (tier must be within `1..maxTier`) |
| `qinhruins:guide_<templateId>` | The guide item for that template |

Cross-plugin usage (other plugins / YAML write the reference string directly):

```yaml
# E.g.: give a T5 keystone in some loot table / shop
item: "qinhruins:5"
# E.g.: give a guide item pointing at ancient_tower
item: "qinhruins:guide_ancient_tower"
```

> This is QR's main item handoff seam with the ecosystem — **a keystone isn't a private QR item type, but an entry in a QCL item source**, resolved uniformly through CoreLib's `ItemManagerAPI.getHookItem(ref)`.

---

## 4. CitizensBridge — mechanism NPCs

Mechanism actions can spawn Citizens NPCs (guards / guides / trigger points). They only work if Citizens is installed; otherwise the relevant mechanism actions are silently skipped. `CitizensBridge` (called via reflection, no hard dependency on Citizens):

```kotlin
fun isAvailable(): Boolean                         // Whether Citizens is enabled
fun spawnFor(anchorId, location, name, skin?): Int? // Spawn an NPC for the anchor, returning the NPC id
fun despawnAnchor(anchorId: String)                 // Remove all NPCs of that anchor
```

Key points:

- NPCs are grouped by **anchor**: **names are deduplicated** within the same anchor (a duplicate name is only spawned once).
- When an anchor is recycled, `despawnAnchor` cleans up all NPCs under its name, leaving no orphans.
- `skin` is optional; if provided, the skin is set via `SkinTrait`.
- Fully reflective; when Citizens isn't installed, `spawnFor` simply returns `null` without erroring.

For how to attach NPC actions in a mechanism, see [Mechanism System](../02-server-guide/mechanisms.md).

---

## 5. How third parties get auto-wired-up

QR doesn't provide a "register my own Provider" public API — wiring up is **auto-detection by class-name convention**:

| You want to be treated as… | You must satisfy |
|---|---|
| Growth source | Your plugin provides `com.qinhuai.clazz.api.QinhClassAPI` (the QinhClass path) or an `MMOCore PlayerData` that QR recognizes; and keeps the corresponding method signatures |
| Party source | Provide an MMOCore-style `PlayerData.getParty()` |
| Keystone consumer | No need to wire up to QR; just use the `qinhruins:<tier>` reference string through the QCL item source |
| NPC backend | Just install Citizens (QR calls its API via reflection) |

> The current growth / party bridges are **detection hard-coded for QinhClass / MMOCore** (not an open registry). To wire up another class plugin, you'd need to add a corresponding `GrowthProvider` implementation on the QR side and include it in `ProviderBridges.register()`'s detection chain.

---

## Next

- [Loot System](../02-server-guide/loot-tables.md) — how growth scales output
- [Party & Sessions](../02-server-guide/party-sessions.md) — party-shared progress
- [Data Storage](./data-storage.md) — persistence of keystones / codex
