# API Recipe Collection (Scenario-Based Code)

> Belongs to: [Developers](API概览.md)　·　Related: [API Reference](API参考.md) · [Events](事件.md) · [Integration Hands-On](集成实操.md)

Turn common third-party needs into **complete, ready-to-use code recipes**. Entry point `com.qinhuai.items.api.QinhItemsAPI`, Java uses `.INSTANCE`.

> All methods return `null` for "non-QI item / nonexistent ID", so always null-check. Confirm QI is enabled before calling.

---

## Recipe 1: Market / Auction House listing and purchase

Need: A player lists the item in hand, and the buyer receives it after purchase. **Soulbound items must not be listed.**

```java
import com.qinhuai.items.api.QinhItemsAPI;
import org.bukkit.inventory.ItemStack;

// —— Listing: the player puts the item in hand onto the market ——
ItemStack hand = player.getInventory().getItemInMainHand();

// 1) Soulbound items cannot be traded
if (QinhItemsAPI.INSTANCE.isSoulbound(hand)) {
    player.sendMessage("§cSoulbound items cannot be listed for trade");
    return;
}

// 2) Record ownership (returns null for non-QI items; allow or reject per your logic)
String qiId = QinhItemsAPI.INSTANCE.getItemId(hand);

// 3) Serialize the entire ItemStack directly into storage (NBT fully preserved, player-customized instance data is not lost)
byte[] blob = hand.serializeAsBytes();
// …store into your market database: blob + price + seller…

// —— Purchase: restore the stored ItemStack and give it to the buyer ——
ItemStack listed = ItemStack.deserializeBytes(blob);
buyer.getInventory().addItem(listed);
```

> **Storage principle**: For player consignments, serialize the `ItemStack` directly (preserving this single item's random values / enhancements / soulbound state); for **admin fixed merchandise**, store "item ID + amount" and freshly build from the latest template on delivery:
> ```java
> ItemStack reward = QinhItemsAPI.INSTANCE.assembly().build("legendary_sword", 1);
> if (reward != null) buyer.getInventory().addItem(reward);
> ```

---

## Recipe 2: Mail system

Need: Send items to players, prevent mailing of soulbound items.

```java
// Validate before sending
ItemStack toSend = ...;
if (QinhItemsAPI.INSTANCE.isSoulbound(toSend)) {
    // Only allow mailing back to the bound owner themselves
    java.util.UUID owner = QinhItemsAPI.INSTANCE.getSoulboundOwner(toSend);
    if (owner == null || !owner.equals(targetPlayerId)) {
        sender.sendMessage("§cSoulbound items can only be mailed back to the bound owner");
        return;
    }
}
// Store the attachment (serialized ItemStack), deserialize and deliver on receipt
```

---

## Recipe 3: Lottery / drop delivery of admin-configured QI items

Need: Read "QI item ID: weight" from config, deliver after winning.

```java
import com.qinhuai.items.api.QinhItemsAPI;

public ItemStack rollReward(java.util.Map<String, Integer> pool, java.util.Random rng) {
    int total = pool.values().stream().mapToInt(Integer::intValue).sum();
    int r = rng.nextInt(total);
    for (var e : pool.entrySet()) {
        r -= e.getValue();
        if (r < 0) {
            ItemStack item = QinhItemsAPI.INSTANCE.assembly().build(e.getKey(), 1);
            if (item == null) {
                getLogger().warning("QI item in the prize pool does not exist: " + e.getKey());
                return null;
            }
            return item;
        }
    }
    return null;
}
```

> If you want to use QI's built-in random quality / affix generation, see the `RandomItemGenerator` in [Random Generation](../02-服主指南/随机生成.md).

---

## Recipe 4: Enhancement / socketing system (write-layer patch)

Need: Add a "+N enhancement" state to gear, protected by the write domain and without breaking attributes.

```kotlin
import com.qinhuai.items.api.QinhItemsAPI
import com.qinhuai.items.layer.QinhLayerPatchPack

// Enhance +1: write a layer patch owned in the LAYER domain
val pack = QinhLayerPatchPack(
    id = "forge",
    owner = "forge",                 // Must be a layer-domain owner (forge/gem/enchant/strengthen…)
    priority = 50,
    variables = mapOf("forge_level" to "1"),    // State key; cannot use semantic keys like attack_damage
)
val (updated, result) = QinhItemsAPI.assembly().applyLayerPatch(stack, pack)
when (result) {
    com.qinhuai.items.layer.LayerWriteResult.OK -> player.inventory.setItemInMainHand(updated)
    else -> player.sendMessage("§cEnhancement failed: $result")
}
```

> ⚠️ Variable keys in a layer patch **cannot use attribute semantic names** (`attack_damage` and the like are rejected by the semantic red line). To add attributes, go through a [Provider](Provider与桥.md). Attributes should be expressed by your enhancement system via an AP source or the item template. For write-domain rules see [Layers and Assembly](层与装配.md#3-写域策略writedomainpolicy).

Read back a layer value:

```kotlin
val lvl = QinhItemsAPI.layers().int(stack, "forge", "forge_level") ?: 0
```

---

## Recipe 5: Temporary buffs (runtime variable overrides)

Need: Set a temporary UI / buff state on an item without touching the template.

```kotlin
val (updated, result) = QinhItemsAPI.variables().set(
    stack, "ui_highlight", "true",
    owner = "ui_glow",               // runtime-domain owner (buff_/temp_/ui_ prefix, or qi_admin/qi_ui)
)
// Refresh the display
val shown = QinhItemsAPI.variables().refresh(updated ?: stack)
```

Lock to prevent others from changing it:

```kotlin
QinhItemsAPI.variables().lock(stack, "ui_highlight", owner = "ui_glow")
```

For write results see [Variables](../02-服主指南/变量.md#7-开发者-api).

---

## Recipe 6: Identify / count QI items on a player

```kotlin
import com.qinhuai.items.api.QinhItemsAPI
import com.qinhuai.items.combat.EquipmentScanner

// Iterate the inventory to count QI items
val counts = HashMap<String, Int>()
for (it in player.inventory.contents) {
    if (it == null) continue
    val id = QinhItemsAPI.INSTANCE.getItemId(it) ?: continue
    counts.merge(id, it.amount, Int::plus)
}

// QI items the player has equipped
val equipped = EquipmentScanner.equippedQinhStacks(player)

// Number of set pieces
val pieces = EquipmentScanner.countSetPieces(player, "warrior_bloodlust")
```

---

## Recipe 7: Listen for item use / custom restrictions

Need: Add a "class restriction" to QI items, forbidding use when not met.

```java
import com.qinhuai.items.event.QinhItemUseCheckEvent;
import org.bukkit.event.EventHandler;

@EventHandler
public void onUseCheck(QinhItemUseCheckEvent e) {
    for (String r : e.getRestrictions()) {
        if (r.startsWith("class:")) {
            String required = r.substring("class:".length());
            if (!myClassSystem.hasClass(e.getPlayer(), required)) {
                e.setCancelled(true);              // Deny use
                e.setDenyReason("Class mismatch: requires " + required);
                return;
            }
        }
    }
}
```

Configure it on the item like this: `options.restrictions: ["class:Warrior"]`. For the full event list see [Events](事件.md).

---

## Recipe 8: Register a custom action handler

Need: Let item actions invoke your plugin's logic.

```kotlin
import com.qinhuai.items.api.QinhItemsAPI
import com.qinhuai.items.api.QinhActionHandler
import com.qinhuai.items.api.QinhActionContext
import com.qinhuai.items.api.ActionDispatchResult

// Register in onEnable()
QinhItemsAPI.actions().registerHandler(object : QinhActionHandler {
    override val handlerId = "myplugin:teleport_home"
    override fun dispatch(ctx: QinhActionContext): ActionDispatchResult {
        val home = myHomeService.getHome(ctx.player) ?: run {
            ctx.player.sendMessage("§cNo home set")
            return ActionDispatchResult.NOT_HANDLED
        }
        ctx.player.teleport(home)
        return ActionDispatchResult.HANDLED
    }
})

// Optional: register a payload schema so the GUI can edit it
QinhItemsAPI.actions().registerPayloadSchema("myplugin:teleport_home") {
    string(key = "message", label = "Teleport prompt", default = "Headed home")
}
```

Reference it in YAML: `- handler: myplugin:teleport_home / payload: "..."`. See [Action Handler Development](动作处理器开发.md) for details.

---

## Quick reference: which API should I use

| Need | API |
|---|---|
| Build an item | `assembly().build(id, amount)` |
| Is it a QI item / get ID | `isQinhItem` / `getItemId` |
| Get the item template definition | `getDefinition(item)` |
| Soulbind validation | `isSoulbound` / `getSoulboundOwner` |
| Can it be used | `canUse(player, item)` |
| Get / set / lock variables | `variables().get/set/lock` |
| Socket / enhance (layer) | `assembly().applyLayerPatch` |
| Read a layer value | `layers().int/string(...)` |
| Register a handler | `actions().registerHandler` |
| Get providers | `getProviders(item)` |
| Refresh equipment attributes | `combat().refreshEquipmentAttributes` |

For full signatures see [API Reference](API参考.md).

---

## Next steps

- [API Reference](API参考.md): all method signatures
- [Events](事件.md): lifecycle hooks you can listen to
- [Integration Hands-On](集成实操.md): connecting external plugins
