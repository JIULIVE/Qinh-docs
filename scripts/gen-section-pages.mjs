// 依据 tree.mjs，为缺失的分节生成中/英两份「总览页」index.md 脚手架。
// 已存在的 index.md 不覆盖（手写正文优先），所以可安全接在 prebuild 上。
// 用法：node scripts/gen-section-pages.mjs
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PLUGINS } from '../docs/.vitepress/tree.mjs'

// 文件落在中文目录，但链接走英文 URL（与 url-englishify-links 一致）。
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const langs = [
  { code: 'zh', base: 'docs/zh-Hans/', label: '本节内容', t: (s) => s.zh, intro: (s) => s.descZh, ct: (c) => c[0] },
  { code: 'en', base: 'docs/en/', label: 'In this section', t: (s) => s.en, intro: (s) => s.descEn, ct: (c) => c[1] },
]

let made = 0
let kept = 0
for (const p of PLUGINS) {
  for (const sec of p.sections) {
    for (const L of langs) {
      const filePath = fileURLToPath(new URL(`../${L.base}${sec.dir}/index.md`, import.meta.url))
      if (existsSync(filePath)) { kept++; continue }
      const out = []
      out.push(`# ${sec.icon} ${L.t(sec)}`, '')
      out.push(L.intro(sec), '')
      out.push(`## ${L.label}`, '')
      for (const c of sec.items) {
        out.push(`- ${c[3]} [${L.ct(c)}](./${slugify(c[1])})`)
      }
      out.push('')
      mkdirSync(dirname(filePath), { recursive: true })
      writeFileSync(filePath, out.join('\n'), 'utf8')
      made++
    }
  }
}
console.log(`section overview pages: ${made} created, ${kept} kept (already exist)`)
