# 📜 脚本 API（pre_js / post_js）

> 上一页：[占位符](./placeholders.md)　·　下一页：[诊断与协议](./diagnostics-protocol.md)

简单门控用 `conditions:` 声明式条件即可；**复杂逻辑**才下沉到 JS。QS 在技能定义里提供两个脚本钩子：`pre_js`（释放前置，可拦截）和 `post_js`（释放成功后副作用）。引擎复用 **QinhCoreLib 的 GraalJS**。本章讲引用格式、注入上下文、降级行为，并给完整示例。本文档对应 QS **1.0.22**。

---

## 1. 在技能定义里挂脚本

```yaml
script:
  pre_js: "qinhskills:demo.js:canCast"    # 返回 false → 拦截施放
  post_js: "qinhskills:demo.js:onCast"    # 施放成功后跑（fire-and-forget）
```

### 引用格式

```
qinhskills:路径.js[:函数名]
```

| 段 | 说明 |
|---|---|
| `qinhskills:` | 命名空间前缀（QS 通过 `registerPluginScripts(plugin, "qinhskills")` 注册到 QCL 脚本加载器） |
| `路径.js` | 相对 QS 脚本目录的文件路径 |
| `:函数名` | 可选；指定调用文件里的某个函数。省略则按 QCL 默认约定执行整个脚本 |

脚本文件由 **QCL 脚本加载器**统一管理，QS 只负责注册命名空间。

---

## 2. 两个钩子的语义

| 钩子 | 时机 | 返回值 | 失败/拦截后果 |
|---|---|---|---|
| `pre_js` | 门控阶段（早于扣资源/进 CD） | `boolean` | 返回 `false` → `CONDITION_FAILED`，**不扣费、不进冷却** |
| `post_js` | 释放成功后 | 忽略（fire-and-forget） | 抛异常只记日志，不影响已成功的释放 |

> `pre_js` 是**真正的拦截口**：它在扣资源和进冷却**之前**判定。返回 `false` 等于这次释放从未发生（无副作用）。

---

## 3. 注入上下文 `ctx`

脚本里有一个全局 `ctx`：

| 调用 | 返回 | 说明 |
|---|---|---|
| `ctx.player()` | `Player` | 释放者（Bukkit Player） |
| `ctx.get(key)` | 值 | 读上下文键 |
| `ctx.set(key, value)` | — | 写上下文键 |
| `ctx.vars()` | Map | 全部上下文键值 |

### 可读键

源码以 `buildMap` 组装 `scriptVars`（`SkillCastService.executeResolved`），实际注入的键如下：

| 键 | 含义 | 何时存在 |
|---|---|---|
| `skill` | 技能 id（**是 `skill`，不是 `skillId`**） | 始终 |
| `level` | 玩家该技能等级 | 始终 |
| `mode` | 触发模式（无则 `default`） | 始终 |
| `source` | 触发来源（`PLAYER` / `EVENT_LISTENER` / `COMMAND` …） | 始终 |
| `player` | 玩家名 | 始终 |
| `toggle_state` | `on` / `off` | 仅 `toggle` 技能 |
| `has_target` | `true` | 仅锁到目标时 |
| `target_type` | 目标实体类型名 | 仅锁到目标时 |
| `target_uuid` | 目标 UUID 字符串 | 仅锁到目标时 |
| `var_<名>` | **技能变量**，如 `var_element`、`var_power` | 每个 `variables:` / `levels.params:` 键各一个 |

::: warning 注意
⚠️ **不存在的键**：`skillId`、`castMode`、`targetCount`、`slot`、`param_<名>` 都**没有**。技能变量和等级参数**统一**用 `var_` 前缀（不是 `param_`）：YAML 的 `variables.element` 与 `levels.N.params.power` → 脚本里 `ctx.get("var_element")`、`ctx.get("var_power")`。

📌 这套 `ctx` 键名只适用于**脚本**。技能透传给 **MythicMobs** 的变量是另一套（`<skill.var.playerName>`、参数不带 `var_` 前缀、且 MM 侧拿不到 `level`），见 [消耗条件与变量](../03-server-guide/cost-conditions-variables.md) 与 [对接 MythicMobs](../02-integration/mythicmobs-integration.md)。
:::

---

## 4. 注入全局 `qcl`

来自 QCL，跨插件统一的工具门面：

| 调用 | 作用 |
|---|---|
| `qcl.logInfo(msg)` | 打信息日志 |
| `qcl.itemGive(player, item)` | 给玩家物品 |
| `qcl.economy*(...)` | 经济相关（存取/查询等，按 QCL 版本提供） |
| `qcl.runSync(runnable)` | 把逻辑切回主线程执行（操作世界/实体务必用它） |

::: warning 注意
⚠️ 脚本可能在异步语境调用。**任何动世界/实体的操作都要包进 `qcl.runSync { ... }`**，否则可能抛线程异常。
:::

---

## 5. 完整示例

`plugins/QinhSkills/scripts/demo.js`（路径示意，以 QCL 脚本目录为准）：

```javascript
// pre_js: 返回 false 拦截施放
function canCast(ctx) {
    var player = ctx.player();
    var element = ctx.get("var_element");      // 技能变量 variables.element
    // 只有火属性技能、且不在岩浆里时允许
    if (element === "fire" && player.getLocation().getBlock().getType().name().indexOf("LAVA") >= 0) {
        player.sendMessage("§c岩浆里放不了火系技能");
        return false;                          // → CONDITION_FAILED，不扣费不进CD
    }
    return true;
}

// post_js: 施放成功后跑，fire-and-forget
function onCast(ctx) {
    var player = ctx.player();
    var power = ctx.get("var_power");          // 等级参数 levels.N.params.power（统一 var_ 前缀）
    qcl.logInfo(player.getName() + " 放了 " + ctx.get("skill") + " power=" + power);
    // 动世界/实体务必切主线程
    qcl.runSync(function() {
        player.setFireTicks(20);
    });
}
```

---

## 6. 降级（引擎不可用时）

QS 经**反射**桥接 QCL 的 `QinhScriptBridge`，并对各种缺失做**安全降级**，绝不因 JS 不可用而误锁技能：

| 情形 | `pre_js` 行为 | `post_js` 行为 |
|---|---|---|
| GraalJS 运行时未就绪 | **返回 true（不拦）** | 空跑（no-op） |
| 反射拿不到 `QinhScriptBridge.INSTANCE` | 返回 true | 空跑 + warning 日志 |
| 部署的 CoreLib 没有 `execute` 方法 | 返回 true | 空跑 + warning 日志 |

> GraalJS 需要 Paper / Purpur 运行时拉到 GraalJS 库且 `javascript.enabled=true`。运行时未就绪的典型日志：
> `[QS-JS] GraalJS 运行时未就绪：org.graalvm.polyglot.Context 未加载（CoreLib libraries 没拉到 GraalJS）或 javascript.enabled=false`

**设计原则**：`pre_js` 降级时**放行**（返回 true），宁可不拦也不误杀；`post_js` 降级时静默空跑。两者都伴随诊断日志便于定位。

---

## 7. 何时用 JS、何时用 conditions

| 需求 | 用 |
|---|---|
| 等级 / 血量 / 世界 / 权限 / 目标类型距离等固定判断 | `conditions:`（声明式，无引擎依赖） |
| 跨插件查询、复杂分支、给物品、改实体状态 | `pre_js` / `post_js` |

简单门优先用 `conditions`——零引擎依赖、永不降级。

---

## 继续阅读

- [事件](./events.md) — 事件取消是脚本之外的另一道拦截口
- [API](./api.md) — `CONDITION_FAILED` / `SCRIPT_BLOCKED` 结果码
- [诊断与协议](./diagnostics-protocol.md) — debug trace 的 `[POST]` 阶段看 post_js
