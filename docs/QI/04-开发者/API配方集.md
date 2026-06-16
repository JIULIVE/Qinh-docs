# API 配方集（场景化代码）

> 所属：[开发者](API概览.md)　·　相关：[API 参考](API参考.md) · [事件](事件.md) · [集成实操](集成实操.md)

把常见第三方需求做成**可直接套用的完整代码配方**。入口 `com.qinhuai.items.api.QinhItemsAPI`，Java 带 `.INSTANCE`。

> 所有方法在「非 QI 物品 / ID 不存在」时返回 `null`，务必判空。调用前确认 QI 已启用。

---

## 配方 1：市场 / 拍卖行上架与购买

需求：玩家上架手中物品、买家购买后发放。**绑定物品禁止上架**。

```java
import com.qinhuai.items.api.QinhItemsAPI;
import org.bukkit.inventory.ItemStack;

// —— 上架：玩家把手中物品挂上市场 ——
ItemStack hand = player.getInventory().getItemInMainHand();

// 1) 绑定物品不许交易
if (QinhItemsAPI.INSTANCE.isSoulbound(hand)) {
    player.sendMessage("§c绑定物品无法上架交易");
    return;
}

// 2) 记录归属（非 QI 物品返回 null，可按你逻辑允许或拒绝）
String qiId = QinhItemsAPI.INSTANCE.getItemId(hand);

// 3) 直接序列化整个 ItemStack 存库（NBT 完整保留，玩家定制的实例数据不丢）
byte[] blob = hand.serializeAsBytes();
// …存进你的市场数据库：blob + 价格 + 卖家…

// —— 购买：把存的 ItemStack 还原发给买家 ——
ItemStack listed = ItemStack.deserializeBytes(blob);
buyer.getInventory().addItem(listed);
```

> **存储原则**：玩家寄售直接序列化 `ItemStack`（保留这一件的随机数值 / 强化 / 绑定状态）；**管理员固定商品**则存「物品 ID + 数量」，发放时现造拿最新模板：
> ```java
> ItemStack reward = QinhItemsAPI.INSTANCE.assembly().build("legendary_sword", 1);
> if (reward != null) buyer.getInventory().addItem(reward);
> ```

---

## 配方 2：邮件系统

需求：给玩家寄物品、防止寄绑定物。

```java
// 寄送前校验
ItemStack toSend = ...;
if (QinhItemsAPI.INSTANCE.isSoulbound(toSend)) {
    // 仅允许寄回给绑定者本人
    java.util.UUID owner = QinhItemsAPI.INSTANCE.getSoulboundOwner(toSend);
    if (owner == null || !owner.equals(targetPlayerId)) {
        sender.sendMessage("§c绑定物品只能寄回给绑定者本人");
        return;
    }
}
// 存附件（序列化 ItemStack），收件时 deserialize 发放
```

---

## 配方 3：抽奖 / 掉落发放管理员配置的 QI 物品

需求：从配置读「QI物品ID: 权重」，抽中后发放。

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
                getLogger().warning("奖池里的 QI 物品不存在: " + e.getKey());
                return null;
            }
            return item;
        }
    }
    return null;
}
```

> 若想用 QI 自带的随机品质 / 词缀生成，见 [随机生成](../02-服主指南/随机生成.md) 的 `RandomItemGenerator`。

---

## 配方 4：强化 / 镶嵌系统（写层补丁）

需求：给装备加一层「+N 强化」状态，受写域保护、不破坏属性。

```kotlin
import com.qinhuai.items.api.QinhItemsAPI
import com.qinhuai.items.layer.QinhLayerPatchPack

// 强化 +1：写一个 owner 在 LAYER 域的层补丁
val pack = QinhLayerPatchPack(
    id = "forge",
    owner = "forge",                 // 必须是 layer 域 owner（forge/gem/enchant/strengthen…）
    priority = 50,
    variables = mapOf("forge_level" to "1"),    // 状态键，不能用 attack_damage 等语义键
)
val (updated, result) = QinhItemsAPI.assembly().applyLayerPatch(stack, pack)
when (result) {
    com.qinhuai.items.layer.LayerWriteResult.OK -> player.inventory.setItemInMainHand(updated)
    else -> player.sendMessage("§c强化失败: $result")
}
```

> ⚠️ 层补丁的变量键**不能用属性语义名**（`attack_damage` 等会被语义红线拒绝）。要加属性走 [Provider](Provider与桥.md)。属性应由你的强化系统通过 AP 源或物品模板表达。写域规则见 [层与装配](层与装配.md#3-写域策略writedomainpolicy)。

读回层值：

```kotlin
val lvl = QinhItemsAPI.layers().int(stack, "forge", "forge_level") ?: 0
```

---

## 配方 5：临时增益（运行时覆盖变量）

需求：给物品临时设一个 UI / buff 状态，不动模板。

```kotlin
val (updated, result) = QinhItemsAPI.variables().set(
    stack, "ui_highlight", "true",
    owner = "ui_glow",               // runtime 域 owner（buff_/temp_/ui_ 前缀 或 qi_admin/qi_ui）
)
// 刷新显示
val shown = QinhItemsAPI.variables().refresh(updated ?: stack)
```

锁定防他人改：

```kotlin
QinhItemsAPI.variables().lock(stack, "ui_highlight", owner = "ui_glow")
```

写入结果见 [变量](../02-服主指南/变量.md#7-开发者-api)。

---

## 配方 6：识别 / 统计玩家身上的 QI 物品

```kotlin
import com.qinhuai.items.api.QinhItemsAPI
import com.qinhuai.items.combat.EquipmentScanner

// 遍历背包统计 QI 物品
val counts = HashMap<String, Int>()
for (it in player.inventory.contents) {
    if (it == null) continue
    val id = QinhItemsAPI.INSTANCE.getItemId(it) ?: continue
    counts.merge(id, it.amount, Int::plus)
}

// 玩家装备的 QI 物品
val equipped = EquipmentScanner.equippedQinhStacks(player)

// 套装件数
val pieces = EquipmentScanner.countSetPieces(player, "warrior_bloodlust")
```

---

## 配方 7：监听物品使用 / 自定义限制

需求：给 QI 物品加「职业限制」，不满足禁止使用。

```java
import com.qinhuai.items.event.QinhItemUseCheckEvent;
import org.bukkit.event.EventHandler;

@EventHandler
public void onUseCheck(QinhItemUseCheckEvent e) {
    for (String r : e.getRestrictions()) {
        if (r.startsWith("class:")) {
            String required = r.substring("class:".length());
            if (!myClassSystem.hasClass(e.getPlayer(), required)) {
                e.setCancelled(true);              // 拒绝使用
                e.setDenyReason("职业不符：需要 " + required);
                return;
            }
        }
    }
}
```

物品里这样配：`options.restrictions: ["class:战士"]`。事件全表见 [事件](事件.md)。

---

## 配方 8：注册一个自定义动作处理器

需求：让物品动作能调用你插件的逻辑。

```kotlin
import com.qinhuai.items.api.QinhItemsAPI
import com.qinhuai.items.api.QinhActionHandler
import com.qinhuai.items.api.QinhActionContext
import com.qinhuai.items.api.ActionDispatchResult

// onEnable() 里注册
QinhItemsAPI.actions().registerHandler(object : QinhActionHandler {
    override val handlerId = "myplugin:teleport_home"
    override fun dispatch(ctx: QinhActionContext): ActionDispatchResult {
        val home = myHomeService.getHome(ctx.player) ?: run {
            ctx.player.sendMessage("§c未设置家")
            return ActionDispatchResult.NOT_HANDLED
        }
        ctx.player.teleport(home)
        return ActionDispatchResult.HANDLED
    }
})

// 可选：注册载荷 schema 让 GUI 能编辑
QinhItemsAPI.actions().registerPayloadSchema("myplugin:teleport_home") {
    string(key = "message", label = "传送提示", default = "回家了")
}
```

YAML 里引用：`- handler: myplugin:teleport_home / payload: "..."`。详见 [动作处理器开发](动作处理器开发.md)。

---

## 速查：我该用哪个 API

| 需求 | API |
|---|---|
| 造物品 | `assembly().build(id, amount)` |
| 是不是 QI 物品 / 取 ID | `isQinhItem` / `getItemId` |
| 取物品模板定义 | `getDefinition(item)` |
| 绑定校验 | `isSoulbound` / `getSoulboundOwner` |
| 能否使用 | `canUse(player, item)` |
| 取 / 设 / 锁变量 | `variables().get/set/lock` |
| 打孔 / 强化（层） | `assembly().applyLayerPatch` |
| 读层值 | `layers().int/string(...)` |
| 注册处理器 | `actions().registerHandler` |
| 取 providers | `getProviders(item)` |
| 刷新装备属性 | `combat().refreshEquipmentAttributes` |

完整签名见 [API 参考](API参考.md)。

---

## 下一步

- [API 参考](API参考.md)：全部方法签名
- [事件](事件.md)：可监听的生命周期
- [集成实操](集成实操.md)：接外部插件
