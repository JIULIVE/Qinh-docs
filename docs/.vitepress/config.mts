import { defineConfig, type DefaultTheme } from 'vitepress'
import { execSync } from 'node:child_process'
// 文档树抽到 tree.mjs（一份数据，同时驱动侧边栏 / 顶部导航 / 各分节总览页生成）。
import { PLUGINS, STUBS } from './tree.mjs'

// 中文走 /zh-Hans/，英文走 /en/（两种语言都带前缀，URL 各自独立）。
const baseOf = (lang: 'zh' | 'en') => (lang === 'en' ? '/en/' : '/zh-Hans/')
const lf = (lang: 'zh' | 'en', a: string, b: string) => (lang === 'en' ? b : a)

const GH_REPO = 'https://github.com/JIULIVE/Qinh-docs'

// ── URL 英文化 ──
// 磁盘文件保持中文名（内容/链接/翻译都不动），只把对外 URL 映射成英文 slug：
// 每个分节的英文目录在 DIR_SLUG 里定死，叶子页 slug = 目录 slug + slugify(英文标题)。
// 真正的 中文源路径→英文URL 由 buildRewrites() 生成的 rewrites 完成；
// VitePress 会把正文里指向中文源文件的相对链接一并重映射到英文 URL。
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const DIR_SLUG: Record<string, string> = {
  'QI/01-入门': 'QI/01-getting-started',
  'QI/02-服主指南': 'QI/02-server-guide',
  'QI/02-服主指南/动作系统': 'QI/02-server-guide/action-system',
  'QI/03-编辑器GUI': 'QI/03-editor-gui',
  'QI/04-开发者': 'QI/04-developer',
  'QI/05-参考': 'QI/05-reference',
  'QCL/01-入门': 'QCL/01-getting-started',
  'QCL/02-服主指南': 'QCL/02-server-guide',
  'QCL/03-外部插件对接': 'QCL/03-external-plugins',
  'QCL/04-开发者': 'QCL/04-developer',
  'QCL/05-参考': 'QCL/05-reference',
  'QS/01-入门': 'QS/01-getting-started',
  'QS/02-对接': 'QS/02-integration',
  'QS/03-服主指南': 'QS/03-server-guide',
  'QS/04-开发者': 'QS/04-developer',
  'QS/05-参考': 'QS/05-reference',
}
const dirSlug = (sec: any): string => DIR_SLUG[sec.dir] ?? sec.dir
const leafSlug = (sec: any, leaf: any): string => `${dirSlug(sec)}/${slugify(leaf[1])}`

function pluginSidebar(p: any, lang: 'zh' | 'en'): DefaultTheme.SidebarItem[] {
  const base = baseOf(lang)
  return [
    { text: `${p.icon} ${p.name}`, link: base + p.key + '/' },
    ...p.sections.map((sec: any) => ({
      text: `${sec.icon} ${lf(lang, sec.zh, sec.en)}`,
      // 给分组标题挂 link：点标题跳到本节「总览页」，旁边的箭头单独负责展开/收起。
      link: base + dirSlug(sec) + '/',
      collapsed: false,
      items: sec.items.map((leaf: [string, string, string, string]) => ({
        text: `${leaf[3]} ${lf(lang, leaf[0], leaf[1])}`,
        link: base + leafSlug(sec, leaf),
      })),
    })),
  ]
}

// 生成 中文源路径 → 英文 URL 的 rewrites（含每个分节总览页 index 与每个叶子页）。
function buildRewrites(): Record<string, string> {
  const rw: Record<string, string> = {}
  // 每个完整插件的 README 当落地页，映射成 index。
  for (const p of PLUGINS) {
    for (const L of ['zh-Hans', 'en']) rw[`${L}/${p.key}/README.md`] = `${L}/${p.key}/index.md`
  }
  for (const p of PLUGINS) {
    for (const sec of p.sections) {
      for (const L of ['zh-Hans', 'en']) {
        rw[`${L}/${sec.dir}/index.md`] = `${L}/${dirSlug(sec)}/index.md`
        for (const leaf of sec.items) {
          rw[`${L}/${leaf[2]}.md`] = `${L}/${leafSlug(sec, leaf)}.md`
        }
      }
    }
  }
  return rw
}

function sidebar(lang: 'zh' | 'en'): DefaultTheme.Sidebar {
  const base = baseOf(lang)
  const map: DefaultTheme.SidebarMulti = {}
  for (const p of PLUGINS) map[base + p.key + '/'] = pluginSidebar(p, lang)
  for (const s of STUBS) {
    map[base + s.key + '/'] = [{ text: `${s.icon} ${s.name}`, link: base + s.key + '/' }]
  }
  return map
}

// 顶部把全部插件都放出来（窄屏由 VitePress 自动收进汉堡菜单）
function nav(lang: 'zh' | 'en'): DefaultTheme.NavItem[] {
  const base = baseOf(lang)
  const all = [
    ...PLUGINS.map((p) => ({ key: p.key, name: p.name })),
    ...STUBS.map((s) => ({ key: s.key, name: s.name })),
  ]
  return all.map((p) => ({ text: p.name, link: base + p.key + '/', activeMatch: base + p.key + '/' }))
}

function editLink(lang: 'zh' | 'en'): DefaultTheme.EditLink {
  return {
    pattern: `${GH_REPO}/edit/main/docs/:path`,
    text: lf(lang, '编辑此页文档', 'Edit this page'),
  }
}

export default defineConfig({
  title: '秦淮系列文档',
  description: '秦淮 RPG 生态 · 插件官方文档',
  // 部署到 GitHub 项目页(user.github.io/<仓库名>/)时，需要把站点放在子路径下。
  // 部署工作流会把 BASE_PATH 设为 /<仓库名>/；本地开发时为 '/'。
  base: process.env.BASE_PATH || '/',
  cleanUrls: true,

  // README 当落地页映射成 index，并把所有中文内容路径映射成英文 URL（见 buildRewrites）。
  rewrites: buildRewrites(),

  lastUpdated: true,
  metaChunk: true,
  srcExclude: ['**/SUMMARY.md', '**/assets/README.md'],

  // 文档正文里有大量 <id>/<前缀>/<gold> 这类尖括号占位符与 MiniMessage 标签，
  // 关闭原始 HTML 解析，避免 Vue 把它们当未闭合标签（代码块不受影响）。
  markdown: { html: false },

  // 取「最后修改该文件的 git 提交者」，注入 frontmatter，供主题页脚渲染
  // 「最后由 X 于 Y 更新」。日期由 VitePress 内置 lastUpdated 提供。
  transformPageData(pageData) {
    try {
      const author = execSync(`git log -1 --pretty=format:%an -- "docs/${pageData.relativePath}"`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
      if (author) {
        pageData.frontmatter = { ...pageData.frontmatter, lastUpdatedAuthor: author }
      }
    } catch {
      // 本地未提交 / 无 git 历史时静默跳过，仅不显示作者
    }
  },

  themeConfig: {
    search: {
      provider: 'local',
      options: {
        locales: {
          'zh-Hans': {
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
    'zh-Hans': {
      label: '简体中文',
      lang: 'zh-Hans',
      link: '/zh-Hans/',
      themeConfig: {
        nav: nav('zh'),
        sidebar: sidebar('zh'),
        editLink: editLink('zh'),
        outline: { level: [2, 3], label: '本页内容' },
        docFooter: { prev: '上一篇', next: '下一篇' },
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        langMenuLabel: '切换语言',
      },
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        nav: nav('en'),
        sidebar: sidebar('en'),
        editLink: editLink('en'),
        outline: { level: [2, 3], label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
      },
    },
  },
})
