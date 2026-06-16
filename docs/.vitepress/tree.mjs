// 文档树：一份数据，驱动侧边栏、顶部导航与各分节「总览页」生成。
// Leaf: [zh 标题, en 标题, 路径(无扩展名), 图标]
// Section: { zh, en, icon, dir(该节目录), descZh, descEn, items: Leaf[] }
// Plugin:  { key, name, icon, sections }

export const QI = {
  key: 'QI',
  name: 'QinhItems',
  icon: '⚔️',
  sections: [
    {
      zh: '入门', en: 'Getting Started', icon: '📖', dir: 'QI/01-入门',
      descZh: '从零认识 QinhItems：它解决什么问题、如何安装、5 分钟跑通第一个物品，以及整体架构。',
      descEn: 'Get to know QinhItems from scratch — what it solves, how to install, your first item in 5 minutes, and the overall architecture.',
      items: [
        ['概览：QI 是什么', 'Overview', 'QI/01-入门/概览', '🧭'],
        ['安装与环境', 'Installation', 'QI/01-入门/安装', '📥'],
        ['5 分钟快速上手', 'Quick Start', 'QI/01-入门/快速上手', '🚀'],
        ['核心概念与架构', 'Core Concepts', 'QI/01-入门/核心概念', '🧩'],
      ],
    },
    {
      zh: '服主指南', en: 'Server Guide', icon: '📦', dir: 'QI/02-服主指南',
      descZh: '面向服主的配置大全：物品定义、品质、属性、词缀、套装、宝石孔、随机生成等所有「造物品」能力。',
      descEn: "The server owner's complete guide — item definition, quality, attributes, affixes, sets, gem sockets, random generation, and every item-crafting capability.",
      items: [
        ['物品定义', 'Item Definition', 'QI/02-服主指南/物品定义', '📝'],
        ['物品示例库总览', 'Item Cookbook', 'QI/02-服主指南/物品示例库', '📚'],
        ['示例·装备篇', 'Cookbook: Equipment', 'QI/02-服主指南/示例-装备篇', '🛡️'],
        ['示例·饰品/消耗篇', 'Cookbook: Accessories & Consumables', 'QI/02-服主指南/示例-饰品消耗篇', '💍'],
        ['示例·杂项篇', 'Cookbook: Misc', 'QI/02-服主指南/示例-杂项篇', '🎲'],
        ['物品类型', 'Item Types', 'QI/02-服主指南/物品类型', '🗂️'],
        ['品质与显示', 'Quality & Display', 'QI/02-服主指南/品质与显示', '🌈'],
        ['属性与数值', 'Attributes & Numbers', 'QI/02-服主指南/属性与数值', '📊'],
        ['变量引擎', 'Variables', 'QI/02-服主指南/变量', '🔢'],
        ['词缀', 'Affixes', 'QI/02-服主指南/词缀', '🏷️'],
        ['段与 Lore 池', 'Sections', 'QI/02-服主指南/段', '📋'],
        ['套装', 'Sets', 'QI/02-服主指南/套装', '🎽'],
        ['随机物品生成', 'Random Generation', 'QI/02-服主指南/随机生成', '🎰'],
        ['宝石孔', 'Gem Sockets', 'QI/02-服主指南/宝石孔', '💠'],
        ['灵魂绑定', 'Soulbinding', 'QI/02-服主指南/灵魂绑定', '🔒'],
        ['进阶配方', 'Advanced Recipes', 'QI/02-服主指南/进阶配方', '🍳'],
        ['附魔上限', 'Enchant Caps', 'QI/02-服主指南/附魔上限', '✴️'],
        ['碎片与模板', 'Fragments & Templates', 'QI/02-服主指南/碎片与模板', '🧱'],
        ['资源包与模型', 'Resource Pack', 'QI/02-服主指南/资源包', '🎨'],
      ],
    },
    {
      zh: '动作系统', en: 'Action System', icon: '⚡', dir: 'QI/02-服主指南/动作系统',
      descZh: '物品的行为引擎：触发器决定「何时」，处理器决定「做什么」，再配上冷却、消耗与条件。',
      descEn: 'The item behavior engine — triggers decide *when*, handlers decide *what*, rounded out by cooldown, cost, and conditions.',
      items: [
        ['概览', 'Overview', 'QI/02-服主指南/动作系统/概览', '🧭'],
        ['触发器大全', 'Triggers', 'QI/02-服主指南/动作系统/触发器', '🎯'],
        ['触发器实战', 'Triggers Hands-on', 'QI/02-服主指南/动作系统/触发器实战', '🕹️'],
        ['处理器大全', 'Handlers', 'QI/02-服主指南/动作系统/处理器', '🧰'],
        ['处理器详解', 'Handlers In-Depth', 'QI/02-服主指南/动作系统/处理器详解', '🔧'],
        ['冷却/消耗/条件', 'Cooldown, Cost & Conditions', 'QI/02-服主指南/动作系统/冷却消耗条件', '⏱️'],
      ],
    },
    {
      zh: '编辑器 GUI', en: 'Editor GUI', icon: '🎮', dir: 'QI/03-编辑器GUI',
      descZh: '不写 YAML，用游戏内可视化编辑器制作物品、动作、套装与各类子编辑器。',
      descEn: 'Build items, actions, sets and more with the in-game visual editor — no YAML required.',
      items: [
        ['概览与导航树', 'Overview', 'QI/03-编辑器GUI/概览', '🧭'],
        ['操作流程', 'Workflow', 'QI/03-编辑器GUI/操作流程', '🪜'],
        ['物品编辑器', 'Item Editor', 'QI/03-编辑器GUI/物品编辑器', '🖊️'],
        ['动作/技能编辑器', 'Action Editor', 'QI/03-编辑器GUI/动作编辑器', '⚡'],
        ['套装编辑器', 'Set Editor', 'QI/03-编辑器GUI/套装编辑器', '🎽'],
        ['其他子编辑器', 'Other Editors', 'QI/03-编辑器GUI/其他编辑器', '🧩'],
        ['槽位速查', 'Slot Reference', 'QI/03-编辑器GUI/槽位速查', '🔢'],
      ],
    },
    {
      zh: '开发者', en: 'Developer', icon: '💻', dir: 'QI/04-开发者',
      descZh: '面向开发者：API 接入、事件、自定义动作处理器、Provider 与桥、跨模块对接与导入导出。',
      descEn: 'For developers — API access, events, custom action handlers, providers & bridges, cross-module integration, and import/export.',
      items: [
        ['API 概览与接入', 'API Overview', 'QI/04-开发者/API概览', '📘'],
        ['API 完整参考', 'API Reference', 'QI/04-开发者/API参考', '📒'],
        ['API 配方集', 'API Recipes', 'QI/04-开发者/API配方集', '🍳'],
        ['事件大全', 'Events', 'QI/04-开发者/事件', '📡'],
        ['动作处理器开发', 'Handler Development', 'QI/04-开发者/动作处理器开发', '🔧'],
        ['Provider 与桥', 'Providers & Bridges', 'QI/04-开发者/Provider与桥', '🌉'],
        ['层与装配管线', 'Layers & Assembly', 'QI/04-开发者/层与装配', '🧱'],
        ['事件监听实例', 'Event Examples', 'QI/04-开发者/事件实例', '👂'],
        ['生态集成', 'Integration', 'QI/04-开发者/集成', '🔗'],
        ['集成实操手册', 'Integration Howto', 'QI/04-开发者/集成实操', '🛠️'],
        ['跨模块对接', 'Cross-module Integration', 'QI/04-开发者/跨模块对接', '🔀'],
        ['导入/导出', 'Import & Export', 'QI/04-开发者/导入导出', '🔁'],
        ['导入/导出实操', 'Import/Export Howto', 'QI/04-开发者/导入导出实操', '📤'],
      ],
    },
    {
      zh: '参考手册', en: 'Reference', icon: '📚', dir: 'QI/05-参考',
      descZh: '速查区：命令、权限、配置项、占位符、报错码、FAQ 与术语表。',
      descEn: 'Quick reference — commands, permissions, config keys, placeholders, error codes, FAQ, and glossary.',
      items: [
        ['命令大全', 'Commands', 'QI/05-参考/命令', '⌨️'],
        ['权限节点', 'Permissions', 'QI/05-参考/权限', '🔑'],
        ['config.yml 全配置', 'Config', 'QI/05-参考/配置文件', '⚙️'],
        ['config.yml 原文批注', 'Annotated Config', 'QI/05-参考/配置文件原文', '📄'],
        ['资源文件总览', 'Resource Files', 'QI/05-参考/资源文件总览', '🗃️'],
        ['消息文案', 'Messages', 'QI/05-参考/消息文案', '💬'],
        ['占位符', 'Placeholders', 'QI/05-参考/占位符', '🔣'],
        ['内置内容清单', 'Bundled Content', 'QI/05-参考/内置内容清单', '📋'],
        ['校验报错速查', 'Validation Errors', 'QI/05-参考/校验报错速查', '🚨'],
        ['诊断与排错', 'Diagnostics', 'QI/05-参考/诊断排错', '🩺'],
        ['性能与运维', 'Performance & Ops', 'QI/05-参考/性能运维', '📈'],
        ['FAQ', 'FAQ', 'QI/05-参考/FAQ', '❓'],
        ['术语表', 'Glossary', 'QI/05-参考/术语表', '📖'],
      ],
    },
  ],
}

export const QCL = {
  key: 'QCL',
  name: 'QinhCoreLib',
  icon: '🧱',
  sections: [
    {
      zh: '入门', en: 'Getting Started', icon: '📖', dir: 'QCL/01-入门',
      descZh: '认识生态底座 QinhCoreLib：定位、安装与核心架构。',
      descEn: 'Meet QinhCoreLib, the ecosystem foundation — positioning, installation, and core architecture.',
      items: [
        ['概览：QCL 是什么', 'Overview', 'QCL/01-入门/概览', '🧭'],
        ['安装与环境', 'Installation', 'QCL/01-入门/安装', '📥'],
        ['快速上手', 'Quick Start', 'QCL/01-入门/快速上手', '🚀'],
        ['核心概念与架构', 'Core Concepts', 'QCL/01-入门/核心概念', '🧩'],
      ],
    },
    {
      zh: '服主指南', en: 'Server Guide', icon: '⚙️', dir: 'QCL/02-服主指南',
      descZh: '配置与功能：config.yml、命令权限、物品源引用、自定义 GUI、经济动作、脚本与自定义方块。',
      descEn: 'Configuration & features — config.yml, commands & permissions, item-source references, custom GUI, economy actions, scripting, and custom blocks.',
      items: [
        ['config.yml 全配置', 'Config', 'QCL/02-服主指南/配置文件', '🛠️'],
        ['命令与权限', 'Commands & Permissions', 'QCL/02-服主指南/命令与权限', '⌨️'],
        ['物品源引用语法', 'Item-Source References', 'QCL/02-服主指南/物品源引用', '🔗'],
        ['自定义 GUI', 'Custom GUI', 'QCL/02-服主指南/自定义GUI', '🖼️'],
        ['GUI 动作与条件速查', 'GUI Actions & Conditions', 'QCL/02-服主指南/GUI动作与条件速查', '🎛️'],
        ['经济动作', 'Economy Actions', 'QCL/02-服主指南/经济动作', '💰'],
        ['脚本入门', 'Scripting Intro', 'QCL/02-服主指南/脚本入门', '📜'],
        ['自定义方块', 'Custom Blocks', 'QCL/02-服主指南/自定义方块', '🟦'],
        ['诊断与排错', 'Diagnostics', 'QCL/02-服主指南/诊断与排错', '🩺'],
      ],
    },
    {
      zh: '外部插件对接', en: 'External Plugins', icon: '🔌', dir: 'QCL/03-外部插件对接',
      descZh: '软依赖总览与桥接矩阵：物品类、方块/模型/作物、经济等外部插件如何对接。',
      descEn: 'Soft-dependency overview and bridge matrix — how item, block/model/crop, and economy plugins integrate.',
      items: [
        ['软依赖总览与桥接矩阵', 'Overview & Bridge Matrix', 'QCL/03-外部插件对接/概览', '🗺️'],
        ['物品类插件', 'Item Plugins', 'QCL/03-外部插件对接/物品类插件', '🎒'],
        ['方块/模型/作物', 'Blocks, Models & Crops', 'QCL/03-外部插件对接/方块模型作物', '🌳'],
        ['经济插件', 'Economy Plugins', 'QCL/03-外部插件对接/经济插件', '🏦'],
      ],
    },
    {
      zh: '开发者', en: 'Developer', icon: '💻', dir: 'QCL/04-开发者',
      descZh: '面向开发者的全套 API：物品、脚本、经济、动作与技能桥、条件引擎、数据存储、GUI 编程与模块系统。',
      descEn: 'The full developer API — item, script, economy, actions & skill bridge, condition engine, data storage, GUI programming, and the module system.',
      items: [
        ['API 概览与接入', 'API Overview', 'QCL/04-开发者/API概览', '📘'],
        ['物品 API', 'Item API', 'QCL/04-开发者/物品API', '📦'],
        ['脚本 API', 'Script API', 'QCL/04-开发者/脚本API', '📜'],
        ['经济 API', 'Economy API', 'QCL/04-开发者/经济API', '💰'],
        ['动作系统与技能桥', 'Actions & Skill Bridge', 'QCL/04-开发者/动作与技能桥', '🌉'],
        ['条件与表达式引擎', 'Conditions & Expressions', 'QCL/04-开发者/条件与表达式', '🧮'],
        ['数据存储与占位符', 'Data & Placeholders', 'QCL/04-开发者/数据存储与占位符', '🗄️'],
        ['GUI 编程 API', 'GUI API', 'QCL/04-开发者/GUI编程API', '🖥️'],
        ['工具集', 'Toolkit', 'QCL/04-开发者/工具集', '🧰'],
        ['模块系统与扩展', 'Module System', 'QCL/04-开发者/模块系统', '🧩'],
      ],
    },
    {
      zh: '参考手册', en: 'Reference', icon: '📚', dir: 'QCL/05-参考',
      descZh: '速查区：术语表、FAQ、诊断码与更新日志。',
      descEn: 'Quick reference — glossary, FAQ, diagnostic codes, and changelog.',
      items: [
        ['术语表', 'Glossary', 'QCL/05-参考/术语表', '📖'],
        ['FAQ', 'FAQ', 'QCL/05-参考/FAQ', '❓'],
        ['诊断码与错误码', 'Diagnostic Codes', 'QCL/05-参考/诊断码', '🚨'],
        ['更新日志', 'Changelog', 'QCL/05-参考/更新日志', '📅'],
      ],
    },
  ],
}

// QCL（底座）排首位，其次 QI
export const PLUGINS = [QCL, QI]

export const STUBS = [
  { key: 'QS', name: 'QinhSkills', icon: '✨' },
  { key: 'QC', name: 'QinhClass', icon: '🎓' },
  { key: 'QSt', name: 'QinhStrengthen', icon: '🔨' },
  { key: 'QF', name: 'QinhForge', icon: '⚒️' },
  { key: 'QR', name: 'QinhRuins', icon: '🏛️' },
]
