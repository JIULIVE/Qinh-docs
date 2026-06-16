import { defineConfig, type DefaultTheme } from 'vitepress'

// ---- 文档树（一份数据，生成中/英两套侧边栏）----
// Leaf: [中文标题, 英文标题, 路径(无扩展名), 图标]
type Leaf = [zh: string, en: string, path: string, icon: string]
interface Section { zh: string; en: string; icon: string; items: Leaf[] }
interface Plugin { key: string; name: string; icon: string; sections: Section[] }

const QI: Plugin = {
  key: 'QI',
  name: 'QinhItems',
  icon: '⚔️',
  sections: [
    {
      zh: '入门', en: 'Getting Started', icon: '📖', items: [
        ['概览：QI 是什么', 'Overview', 'QI/01-入门/概览', '🧭'],
        ['安装与环境', 'Installation', 'QI/01-入门/安装', '📥'],
        ['5 分钟快速上手', 'Quick Start', 'QI/01-入门/快速上手', '🚀'],
        ['核心概念与架构', 'Core Concepts', 'QI/01-入门/核心概念', '🧩'],
      ]
    },
    {
      zh: '服主指南', en: 'Server Guide', icon: '📦', items: [
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
      ]
    },
    {
      zh: '动作系统', en: 'Action System', icon: '⚡', items: [
        ['概览', 'Overview', 'QI/02-服主指南/动作系统/概览', '🧭'],
        ['触发器大全', 'Triggers', 'QI/02-服主指南/动作系统/触发器', '🎯'],
        ['触发器实战', 'Triggers Hands-on', 'QI/02-服主指南/动作系统/触发器实战', '🕹️'],
        ['处理器大全', 'Handlers', 'QI/02-服主指南/动作系统/处理器', '🧰'],
        ['处理器详解', 'Handlers In-Depth', 'QI/02-服主指南/动作系统/处理器详解', '🔧'],
        ['冷却/消耗/条件', 'Cooldown, Cost & Conditions', 'QI/02-服主指南/动作系统/冷却消耗条件', '⏱️'],
      ]
    },
    {
      zh: '编辑器 GUI', en: 'Editor GUI', icon: '🎮', items: [
        ['概览与导航树', 'Overview', 'QI/03-编辑器GUI/概览', '🧭'],
        ['操作流程', 'Workflow', 'QI/03-编辑器GUI/操作流程', '🪜'],
        ['物品编辑器', 'Item Editor', 'QI/03-编辑器GUI/物品编辑器', '🖊️'],
        ['动作/技能编辑器', 'Action Editor', 'QI/03-编辑器GUI/动作编辑器', '⚡'],
        ['套装编辑器', 'Set Editor', 'QI/03-编辑器GUI/套装编辑器', '🎽'],
        ['其他子编辑器', 'Other Editors', 'QI/03-编辑器GUI/其他编辑器', '🧩'],
        ['槽位速查', 'Slot Reference', 'QI/03-编辑器GUI/槽位速查', '🔢'],
      ]
    },
    {
      zh: '开发者', en: 'Developer', icon: '💻', items: [
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
      ]
    },
    {
      zh: '参考手册', en: 'Reference', icon: '📚', items: [
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
      ]
    },
  ]
}

const QCL: Plugin = {
  key: 'QCL',
  name: 'QinhCoreLib',
  icon: '🧱',
  sections: [
    {
      zh: '入门', en: 'Getting Started', icon: '📖', items: [
        ['概览：QCL 是什么', 'Overview', 'QCL/01-入门/概览', '🧭'],
        ['安装与环境', 'Installation', 'QCL/01-入门/安装', '📥'],
        ['快速上手', 'Quick Start', 'QCL/01-入门/快速上手', '🚀'],
        ['核心概念与架构', 'Core Concepts', 'QCL/01-入门/核心概念', '🧩'],
      ]
    },
    {
      zh: '服主指南', en: 'Server Guide', icon: '⚙️', items: [
        ['config.yml 全配置', 'Config', 'QCL/02-服主指南/配置文件', '🛠️'],
        ['命令与权限', 'Commands & Permissions', 'QCL/02-服主指南/命令与权限', '⌨️'],
        ['物品源引用语法', 'Item-Source References', 'QCL/02-服主指南/物品源引用', '🔗'],
        ['自定义 GUI', 'Custom GUI', 'QCL/02-服主指南/自定义GUI', '🖼️'],
        ['GUI 动作与条件速查', 'GUI Actions & Conditions', 'QCL/02-服主指南/GUI动作与条件速查', '🎛️'],
        ['经济动作', 'Economy Actions', 'QCL/02-服主指南/经济动作', '💰'],
        ['脚本入门', 'Scripting Intro', 'QCL/02-服主指南/脚本入门', '📜'],
        ['自定义方块', 'Custom Blocks', 'QCL/02-服主指南/自定义方块', '🟦'],
        ['诊断与排错', 'Diagnostics', 'QCL/02-服主指南/诊断与排错', '🩺'],
      ]
    },
    {
      zh: '外部插件对接', en: 'External Plugins', icon: '🔌', items: [
        ['软依赖总览与桥接矩阵', 'Overview & Bridge Matrix', 'QCL/03-外部插件对接/概览', '🗺️'],
        ['物品类插件', 'Item Plugins', 'QCL/03-外部插件对接/物品类插件', '🎒'],
        ['方块/模型/作物', 'Blocks, Models & Crops', 'QCL/03-外部插件对接/方块模型作物', '🌳'],
        ['经济插件', 'Economy Plugins', 'QCL/03-外部插件对接/经济插件', '🏦'],
      ]
    },
    {
      zh: '开发者', en: 'Developer', icon: '💻', items: [
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
      ]
    },
    {
      zh: '参考手册', en: 'Reference', icon: '📚', items: [
        ['术语表', 'Glossary', 'QCL/05-参考/术语表', '📖'],
        ['FAQ', 'FAQ', 'QCL/05-参考/FAQ', '❓'],
        ['诊断码与错误码', 'Diagnostic Codes', 'QCL/05-参考/诊断码', '🚨'],
        ['更新日志', 'Changelog', 'QCL/05-参考/更新日志', '📅'],
      ]
    },
  ]
}

// QCL（底座）排首位，其次 QI
const PLUGINS = [QCL, QI]

const STUBS: { key: string; name: string; icon: string }[] = [
  { key: 'QS', name: 'QinhSkills', icon: '✨' },
  { key: 'QC', name: 'QinhClass', icon: '🎓' },
  { key: 'QSt', name: 'QinhStrengthen', icon: '🔨' },
  { key: 'QF', name: 'QinhForge', icon: '⚒️' },
  { key: 'QR', name: 'QinhRuins', icon: '🏛️' },
]

const lf = (lang: 'zh' | 'en', a: string, b: string) => (lang === 'en' ? b : a)

function pluginSidebar(p: Plugin, lang: 'zh' | 'en'): DefaultTheme.SidebarItem[] {
  const base = lang === 'en' ? '/en/' : '/'
  return [
    { text: `${p.icon} ${p.name}`, link: base + p.key + '/' },
    ...p.sections.map((sec) => ({
      text: `${sec.icon} ${lf(lang, sec.zh, sec.en)}`,
      collapsed: false,
      items: sec.items.map(([zh, en, path, icon]) => ({
        text: `${icon} ${lf(lang, zh, en)}`,
        link: base + path,
      })),
    })),
  ]
}

function sidebar(lang: 'zh' | 'en'): DefaultTheme.Sidebar {
  const base = lang === 'en' ? '/en/' : '/'
  const map: DefaultTheme.SidebarMulti = {}
  for (const p of PLUGINS) map[base + p.key + '/'] = pluginSidebar(p, lang)
  for (const s of STUBS) {
    map[base + s.key + '/'] = [{ text: `${s.icon} ${s.name}`, link: base + s.key + '/' }]
  }
  return map
}

// 顶部把全部插件都放出来（窄屏由 VitePress 自动收进汉堡菜单）
function nav(lang: 'zh' | 'en'): DefaultTheme.NavItem[] {
  const base = lang === 'en' ? '/en/' : '/'
  const all = [
    { key: 'QCL', name: 'QinhCoreLib' },
    { key: 'QI', name: 'QinhItems' },
    ...STUBS.map((s) => ({ key: s.key, name: s.name })),
  ]
  return all.map((p) => ({ text: p.name, link: base + p.key + '/', activeMatch: base + p.key + '/' }))
}

export default defineConfig({
  title: '秦淮系列文档',
  description: '秦淮 RPG 生态 · 插件官方文档',
  // 部署到 GitHub 项目页(user.github.io/<仓库名>/)时，需要把站点放在子路径下。
  // 部署工作流会把 BASE_PATH 设为 /<仓库名>/；本地开发时为 '/'。
  base: process.env.BASE_PATH || '/',
  cleanUrls: true,

  // 各插件用 README.md 当落地页；VitePress 不会自动把 README 当目录首页，
  // 这里映射成 index 让 /QI/ /QCL/ 等链接正确解析（指向 README.md 的内链仍有效）。
  rewrites: {
    'QI/README.md': 'QI/index.md',
    'QCL/README.md': 'QCL/index.md',
    'en/QI/README.md': 'en/QI/index.md',
    'en/QCL/README.md': 'en/QCL/index.md',
  },

  lastUpdated: true,
  metaChunk: true,
  srcExclude: ['**/SUMMARY.md', '**/assets/README.md'],

  // 文档正文里有大量 <id>/<前缀>/<gold> 这类尖括号占位符与 MiniMessage 标签，
  // 关闭原始 HTML 解析，避免 Vue 把它们当未闭合标签（代码块不受影响）。
  markdown: { html: false },

  themeConfig: {
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                noResultsText: '没有找到相关结果',
                resetButtonTitle: '清除查询',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
              },
            },
          },
        },
      },
    },
  },

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-Hans',
      themeConfig: {
        nav: nav('zh'),
        sidebar: sidebar('zh'),
        outline: { level: [2, 3], label: '本页内容' },
        docFooter: { prev: '上一篇', next: '下一篇' },
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        langMenuLabel: '切换语言',
        lastUpdated: { text: '最后更新' },
      },
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        nav: nav('en'),
        sidebar: sidebar('en'),
        outline: { level: [2, 3], label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
        lastUpdated: { text: 'Last updated' },
      },
    },
  },
})
