> 上一页：[../03-外部插件对接/经济插件.md](../03-external-plugins/economy-plugins.md)　·　下一页：[物品API.md](./item-api.md)
> 相关：[物品API.md](./item-api.md) · [脚本API.md](./script-api.md) · [经济API.md](./economy-api.md) · [../03-外部插件对接/物品类插件.md](../03-external-plugins/item-plugins.md) · [../05-参考/术语表.md](../05-reference/glossary.md)

# 🧭 开发者 API 概览

本页是开发者接入 QinhCoreLib（下文简称 **QCL**）的总入口。面向用 Java / Kotlin / Groovy 写 Bukkit 插件、或写外部脚本/模块的开发者。读完本页你会知道：**哪些类可以依赖、哪些不能碰、怎么声明依赖、怎么拿到每个门面（facade）入口**。然后再按需跳到各细分 API 页。

一句话原则：**只依赖公开 API 包，绝不耦合内部实现。**

---

## 📦 公开 API 边界（apiJar）

QCL 会单独构建一个 **apiJar**（API 制品），它只导出被官方认定为「公开契约」的包。`ApiBoundary` / `ApiJarManifest` 这两个内部清单决定了哪些包进 apiJar。你对接时应当：

- 编译期：依赖 apiJar（或主 jar 中的这些公开包）。
- 运行期：把 QCL 作为依赖/软依赖，由服务器加载真正的实现。

### 公开 API 包清单（11 个）

| 包名 | 归属 | 用途 |
| --- | --- | --- |
| `com.qinhuai.corelib.api.item` | QCL 核心 | 统一物品源 / 物品注册门面 |
| `com.qinhuai.corelib.api.item.module` | QCL 核心 | `ItemModule` 物品模块接口 |
| `com.qinhuai.corelib.script` | QCL 核心 | GraalJS 脚本桥 |
| `com.qinhuai.corelib.economy` | QCL 核心 | 统一经济门面 |
| `com.qinhuai.corelib.database` | QCL 核心 | 数据库管理 |
| `com.qinhuai.corelib.pdc` | QCL 核心 | PDC（PersistentDataContainer）服务 |
| `com.qinhuai.corelib.placeholder` | QCL 核心 | PlaceholderAPI 桥 |
| `com.qinhuai.items.api` | 子模块 QinhItems | 物品系统对外 API |
| `com.qinhuai.skills.api` | 子模块 QinhSkills | 技能系统对外 API |
| `com.qinhuai.forge.api` | 子模块 QinhForge | 锻造系统对外 API |
| `com.qinhuai.strengthen.api` | 子模块 QinhStrengthen | 强化系统对外 API |

> 子模块的 `*.api` 包是否可用，取决于服务器是否装了对应子插件。对接子模块时务必用软依赖 + 运行时存在性判断。

### 公开 API 类清单（12 个）

| 类 | 包 | 形态 | 作用 |
| --- | --- | --- | --- |
| `ItemManagerAPI` | `...api.item` | 单例（Kotlin `instance` / Java `INSTANCE`） | 物品模块注册 + 统一取物 |
| `ItemModule` | `...api.item.module` | 接口 | 自定义物品模块要实现的接口 |
| `QinhScriptApi` | `...corelib.script` | 注入对象（脚本里叫 `qcl`） | 脚本可调的宿主能力 |
| `EconomyBridge` | `...corelib.economy` | object（单例） | 统一经济操作门面 |
| `DatabaseManager` | `...corelib.database` | 管理器 | 数据库连接/访问 |
| `PdcServiceManager` | `...corelib.pdc` | 管理器 | 取 PDC 服务实例 |
| `PapiBridge` | `...corelib.placeholder` | 桥 | 解析/注册 PlaceholderAPI 占位符 |
| `QinhItemsAPI` | `com.qinhuai.items.api` | 子模块门面 | QinhItems 对外能力 |
| `QinhActionBridges` | `com.qinhuai.items.api` | 子模块门面 | 动作桥 |
| `QinhSkillsAPI` | `com.qinhuai.skills.api` | 子模块门面 | QinhSkills 对外能力 |
| `QinhForgeAPI` | `com.qinhuai.forge.api` | 子模块门面 | QinhForge 对外能力 |
| `QinhStrengthenAPI` | `com.qinhuai.strengthen.api` | 子模块门面 | QinhStrengthen 对外能力 |

---

## ⛔ 内部包警告

除上面 11 个公开包外，QCL 还有约 **15 个内部包**（包含 `command`、`bootstrap`、`debug`、`item`（实现层，注意区别于 `api.item`）、`customgui` 等）。它们**不是契约**：

- 类名、方法签名、行为会在小版本间无预警变化。
- 不进 apiJar，意味着官方明确不保证兼容。

> **铁律**：对接时只 import 公开 API 包里的类。一旦你 import 了 `com.qinhuai.corelib.item.*`（无 `api`）、`...command`、`...bootstrap` 这类内部包，下次 QCL 升级很可能编译失败或运行炸裂——这是你的问题不是 QCL 的 bug。

---

## 🔗 依赖声明

### plugin.yml

QCL 与其它 Qinh 模块的关系：

- **其它 Qinh 模块（QinhItems/QinhSkills/...）硬依赖 QCL**——它们没有 QCL 跑不起来。
- **你的第三方插件**：按需求选择硬依赖或软依赖。

```yaml
# 硬依赖：没有 QCL 就不加载你的插件
depend:
  - QinhCoreLib

# 或软依赖：有就用、没有就降级
softdepend:
  - QinhCoreLib
```

### Maven（编译期依赖，运行期由服务器提供）

```xml
<dependency>
    <groupId>com.qinhuai</groupId>
    <artifactId>QinhCoreLib</artifactId>
    <version>1.3.0</version>
    <scope>provided</scope>
</dependency>
```

> `provided` 表示「编译我要，打包别带」——运行时由服务器上的 QCL 提供实现。若官方提供独立 apiJar 分类器，优先依赖 apiJar 以确保只编译到公开包。

---

## 🚪 获取各门面入口

下面是每个公开门面的「拿到入口」一行式，Kotlin 与 Java 双写。

### Kotlin

```kotlin
import com.qinhuai.corelib.api.item.ItemManagerAPI
import com.qinhuai.corelib.economy.EconomyBridge
import com.qinhuai.corelib.script.QinhScriptBridge
import com.qinhuai.corelib.pdc.PdcServiceManager
import com.qinhuai.corelib.placeholder.PapiBridge
import com.qinhuai.corelib.database.DatabaseManager

val items   = ItemManagerAPI.instance        // 物品门面（单例）
val economy = EconomyBridge                   // 经济门面（object，直接用）
val script  = QinhScriptBridge                // 脚本桥
val pdc     = PdcServiceManager.get()         // PDC 服务
// PapiBridge / DatabaseManager 同样按官方静态入口获取
```

### Java

```java
import com.qinhuai.corelib.api.item.ItemManagerAPI;
import com.qinhuai.corelib.economy.EconomyBridge;
import com.qinhuai.corelib.script.QinhScriptBridge;
import com.qinhuai.corelib.pdc.PdcServiceManager;

ItemManagerAPI items = ItemManagerAPI.INSTANCE;   // 单例：Java 用 INSTANCE
// EconomyBridge / QinhScriptBridge 是 Kotlin object：Java 同样用 INSTANCE 字段
EconomyBridge economy = EconomyBridge.INSTANCE;
var pdc = PdcServiceManager.get();
```

> 注意 Kotlin 单例在 Java 侧的写法：`object`/companion `instance` 一般通过 `XXX.INSTANCE` 访问。`ItemManagerAPI` 在 Kotlin 用 `instance`，在 Java 用 `INSTANCE`。

---

## 🧪 最小接入示例

下面是一个最小可运行骨架：在 `onEnable` 里取物品门面取一件物品给玩家、查一下余额。

### Kotlin

```kotlin
import com.qinhuai.corelib.api.item.ItemManagerAPI
import com.qinhuai.corelib.economy.EconomyBridge
import org.bukkit.entity.Player
import org.bukkit.plugin.java.JavaPlugin

class MyAddon : JavaPlugin() {
    override fun onEnable() {
        if (server.pluginManager.getPlugin("QinhCoreLib") == null) {
            logger.warning("未检测到 QinhCoreLib，部分功能不可用")
            return
        }
        logger.info("QCL 物品别名：" + ItemManagerAPI.instance.aliases())
    }

    fun reward(player: Player) {
        // 统一取物：不管来源是原版还是任意外部插件
        val item = ItemManagerAPI.getHookItem("qinhitems:excalibur", player, 1)
        if (item != null) player.inventory.addItem(item)

        // 查余额
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

> Java 调用 Kotlin 带默认参数的方法（如 `has(player, amount, providerId?, currencyId?)`）时，可选参数要显式传 `null`。

---

## 📚 继续阅读

- [物品API.md](./item-api.md) —— `ItemManagerAPI` 全方法、`ItemModule` 实现、Groovy 外部物品模块、物品元数据读写。
- [脚本API.md](./script-api.md) —— `QinhScriptBridge` / `qcl` / `ctx`、从宿主调脚本传变量、沙箱。
- [经济API.md](./economy-api.md) —— `EconomyBridge` 全方法、三后端差异、错误码处理。
- [../03-外部插件对接/物品类插件.md](../03-external-plugins/item-plugins.md) —— 统一物品源接的是哪些外部物品插件。
- [../05-参考/术语表.md](../05-reference/glossary.md) —— 名词速查。
