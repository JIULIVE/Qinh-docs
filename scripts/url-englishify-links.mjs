// URL 英文化配套：把所有 .md 正文里指向「中文源页面」的相对链接，改写成指向
// 英文 URL 输出路径的相对链接（VitePress 按页面的输出 URL 解析相对链接）。
// 磁盘文件保持中文名不动；图片/资源链接（不在 slug 映射里）原样保留，由 Vite 处理。
// 用法：node scripts/url-englishify-links.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PLUGINS } from '../docs/.vitepress/tree.mjs'

const P = path.posix
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const DIR_SLUG = {
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
  'QR/01-入门': 'QR/01-getting-started',
  'QR/02-服主指南': 'QR/02-server-guide',
  'QR/03-编辑器': 'QR/03-editor',
  'QR/04-开发者': 'QR/04-developer',
  'QR/05-参考': 'QR/05-reference',
}

// 中文源路径(无 locale、无 .md) → 英文输出路径
const map = new Map()
for (const p of PLUGINS) {
  for (const sec of p.sections) {
    const ds = DIR_SLUG[sec.dir]
    map.set(sec.dir, ds)
    map.set(sec.dir + '/index', ds + '/index')
    for (const leaf of sec.items) map.set(leaf[2], `${ds}/${slugify(leaf[1])}`)
  }
}
const englishOf = (k) => map.get(k) ?? k

const docsRoot = fileURLToPath(new URL('../docs/', import.meta.url))
const localeRoots = ['zh-Hans', 'en']

function rewriteLine(line, dir, thisOutDir) {
  return line.replace(/(\]\()([^)\s]+)(\))/g, (full, a, target, c) => {
    const hash = target.indexOf('#')
    const pathPart = hash >= 0 ? target.slice(0, hash) : target
    const anchor = hash >= 0 ? target.slice(hash) : ''
    if (!pathPart || /^([a-z]+:|\/\/|\/)/i.test(pathPart)) return full // 外链/绝对/纯锚点
    const hadMd = /\.md$/i.test(pathPart)
    const srcNoMd = P.normalize(P.join(dir, hadMd ? pathPart.slice(0, -3) : pathPart))
    const out = englishOf(srcNoMd)
    if (out === srcNoMd) return full // 未映射（README/资源/非树内页）原样保留
    let rel = P.relative(thisOutDir, out)
    if (!rel.startsWith('.')) rel = './' + rel
    return a + rel + (hadMd ? '.md' : '') + anchor + c
  })
}

let changed = 0
for (const locale of localeRoots) {
  const root = path.join(docsRoot, locale)
  const files = readdirSync(root, { recursive: true })
    .filter((f) => f.endsWith('.md') && path.basename(f) !== 'SUMMARY.md')
  for (const f of files) {
    const abs = path.join(root, f)
    const noLocale = f.split(path.sep).join('/').replace(/\.md$/, '') // 'QI/01-入门/概览'
    const dir = P.dirname(noLocale)
    const thisOutDir = P.dirname(englishOf(noLocale))
    const src = readFileSync(abs, 'utf8')
    let inFence = false
    const out = src.split('\n').map((line) => {
      if (/^\s*```/.test(line)) { inFence = !inFence; return line }
      if (inFence) return line
      return rewriteLine(line, dir, thisOutDir)
    }).join('\n')
    if (out !== src) { writeFileSync(abs, out, 'utf8'); changed++ }
  }
}
console.log(`rewrote internal links in ${changed} files`)
