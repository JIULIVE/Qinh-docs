# 结果码 CastResult

> 上一页：[消息文案速查](./messages.md)　·　下一页：[内置技能与示例](./bundled-skills-examples.md)

`CastResult` 是每次技能释放的**最终判定结果**。它出现在三个地方：

1. `/qs cast <技能>` 的回显 —— `§6[QS] §7cast {id} §7→ §e{result}`；
2. 事件 `QISkillUseEvent` / 对应事件对象的 `castResult` 字段（开发者读）；
3. 间接体现在 `%qinhskills_..%` 占位符与玩家收到的门控提示上。

枚举共 **14 个值**，下表是含义、玩家看到什么、以及怎么处理。

---

## 📋 全部结果码

| 结果码 | 含义 | 玩家文案 | 怎么办 |
|---|---|---|---|
| `SUCCESS` | 技能成功释放 | （技能表现 / 占位消息） | 正常 ✅ |
| `SKILL_NOT_FOUND` | 技能 id 不存在 | `§c未知技能` | 检查 id 拼写、是否已 `/qs reload` 加载 |
| `INVALID_PAYLOAD` | 触发载荷非法 / 缺字段 | —（多为内部 / 命令桥构造错误） | 检查命令桥参数、handler 是否正确传 payload |
| `NOT_UNLOCKED` | 技能未解锁 | `§c技能未解锁` | `/qs unlock` 或配 `starter_skills` / `default_all` |
| `ON_COOLDOWN` | 冷却中（含冷却组 / 充能未满） | `§c技能冷却中 §7还需 {t}` / `§c充能 {a}/{m}` | 等冷却；调小 `cooldown.base` 或加 `charges` |
| `INSUFFICIENT_RESOURCE` | 资源不足（`resource.mana` 等占位资源） | `§c资源不足` | 等资源恢复；资源池最终归 QC，当前为临时占位 |
| `CONFLICT` | 命中冲突组，同组技能短期互斥 | `§c技能冲突` | 等冲突期过；检查 `conflict_groups` 配置 |
| `CAST_MODE_BLOCKED` | 当前施法模式下不可放 | `§c当前施法模式不可用` | 检查 `cast_mode`（toggle 状态 / channel 进行中） |
| `CONDITION_FAILED` | 声明式 `conditions` 未全满足 | `§c未满足释放条件` | 看技能 `conditions:`（等级 / 血量 / 目标等） |
| `MYTHIC_FAILED` | 交给 MM 执行时失败 | `§c技能释放失败` | MM 同名技能写错 / 缺失；`/mm reload`，看 MM 日志 |
| `SCRIPT_BLOCKED` | `pre_js` 脚本返回 false 拦截 | —（脚本自定义提示） | 检查 `script.pre_js` 逻辑 |
| `CHANNELING` | 正在吟唱读条中，无法再次起手 | —（吟唱进度条进行中） | 等读条完成 / 被打断后再放 |
| `NO_TARGET` | 索敌 `required: true` 但没锁到目标 | `§c没有可用目标` | 对准目标；放宽 `range` / `filter` 或设 `required: false` |
| `SILENCED` | 被 `/qs silence` 或 API 沉默封锁 | `§c技能被封锁，无法施放` | 等封锁结束或 `/qs silence 0 玩家` 解除 |

> ⚠️ 表中 14 个值与源码 `CastResult.kt` 严格一致，顺序也一致。文案以源码为准——若你看到的提示与此处不符，先确认插件版本是 **1.0.22**。

---

## 🔍 按"谁拦下的"分组

| 阶段 | 相关结果码 |
|---|---|
| **解析 / 输入** | `SKILL_NOT_FOUND` `INVALID_PAYLOAD` |
| **门控（Gate）** | `NOT_UNLOCKED` `ON_COOLDOWN` `INSUFFICIENT_RESOURCE` `CONFLICT` `CAST_MODE_BLOCKED` `CONDITION_FAILED` `NO_TARGET` `SILENCED` |
| **脚本出口** | `SCRIPT_BLOCKED` |
| **吟唱状态** | `CHANNELING` |
| **执行（MM）** | `MYTHIC_FAILED` |
| **成功** | `SUCCESS` |

> 门控按固定顺序逐项校验，命中第一个不过的就返回对应码——所以一次释放只会得到**一个**结果码。

---

## 🧪 用 /qs cast 自测

`/qs cast` 是最直接的结果码探针：它跳过物品 / 按键，直接走完整管线并把结果码打回聊天框。

```bash
/qs cast fire_wave
# §6[QS] §7cast fire_wave §7→ §e SUCCESS         技能侧全通
# §6[QS] §7cast fire_wave §7→ §e NOT_UNLOCKED    没解锁 → /qs unlock
# §6[QS] §7cast fire_wave §7→ §e MYTHIC_FAILED   QS 通了，MM 那侧出错
```

> 想看更细的阶段 trace（卡在解析 / 路由 / 门控 / 执行哪一步），给技能开 `debug: true`，详见 [诊断排错](./troubleshooting.md)。

---

## 继续阅读

- [诊断排错](./troubleshooting.md) — 拿到结果码后的排查决策树
- [消息文案速查](./messages.md) — 结果码对应的玩家文案
- [命令与权限](./commands-permissions.md) — `/qs cast` 用法
