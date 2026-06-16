# ⚙️ 服主指南

本节面向服主，讲清如何**配置 QinhCoreLib（QCL）并使用它面向服主的各项功能**。QCL 只有一个主配置文件 `config.yml`，控制数据库、调试、经济默认源等开关；命令根为 `/qcl`，配套一套权限节点。在此之上，QCL 最核心的能力是**统一物品源引用**——不管物品来自原版、QinhItems、CraftEngine、ItemsAdder、Nexo 还是 MythicMobs，都用同一套 `源:物品ID` 字符串去引用它。

围绕引用之上，QCL 让你**纯靠 YAML** 搭建可点击的自定义 GUI（菜单、商店、传送站），并提供丰富的点击动作与显隐条件；其中三个经济动作（给钱/扣钱/设余额）打通 Vault、PlayerPoints、ExcellentEconomy 各后端。需要更灵活的逻辑时，可用 JavaScript 脚本给 GUI 加上自定义条件与动作，无需写 Java 或打包插件。此外还有自定义方块抽象层（对接 CraftEngine，自带降级机制）。

建议的阅读顺序：**先过一遍 config.yml 与物品源引用**（它们是后续一切的地基），再按需深入 GUI、脚本与经济动作；遇到问题时，`/qcl status` 与诊断页是排查一切故障的第一站。

## 本节内容

- 🛠️ [config.yml 全配置](./config) — 逐段逐项讲清唯一主配置：数据库、调试、经济默认源，以及改完是 `/qcl reload` 还是需重启。
- ⌨️ [命令与权限](./commands-permissions) — `/qcl` 完整命令树、用法示例、预期输出，以及权限节点与推荐权限组分配。
- 🔗 [物品源引用语法](./item-source-references) — QCL 最常用的功能：用统一的 `源:物品ID` 语法引用任意来源的物品。
- 🖼️ [自定义 GUI](./custom-gui) — 纯靠 YAML 搭建可点击菜单，从最小例子到能跑的商店、传送站。
- 🎛️ [GUI 动作与条件速查](./gui-actions-conditions) — 一页速查表：所有点击动作（type）与显隐条件，每个都附可照抄的 YAML 片段。
- 💰 [经济动作](./economy-actions) — 三个经济动作 give_money / take_money / set_money 的 value 语法与各后端差异。
- 📜 [脚本入门](./scripting-intro) — 用 GraalJS 脚本给 GUI 与钩子扩展自定义条件与动作，不写 Java、不打包。
- 🟦 [自定义方块](./custom-blocks) — 对接 CraftEngine 的自定义方块抽象层，含放置失败时退回普通方块的降级机制。
- 🩺 [诊断与排错](./diagnostics) — 解读 `/qcl status` 输出、健康码表与排查决策树，定位生态故障。
