/**
 * 按项目 Markdown 渲染器的语法理解，提取文档中需要中文排版检查的可见文本。
 *
 * 走渲染器自己的 token 流拿到正文与源码偏移；MDC 属性值是否算可见文本，
 * 则由组件真实渲染出的 HTML 决定：只有出现在渲染后文本节点里的属性值
 * （如 Placeholder 的 hint、Card 的 title/desc）才交给 zhlint。
 * 渲染 slot 时用哨兵文本替代槽内容，避免槽内容恰好等于 prop 值时误判。
 *
 * 片段按“块元素”聚合：普通正文连续拼接（跨链接等语法标记，
 * 让“链接左右空格”这类跨标记规则仍能触发）；行内组件、块组件和可见 prop
 * 各自成块，避免和相邻正文拼成一句话。
 */
import { readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { createServer } from 'vite'
import { createMarkdownRenderer } from 'vitepress'
import { createSSRApp, h } from 'vue'
import { createI18n } from 'vue-i18n'
import { renderToString } from 'vue/server-renderer'
import { markdownConfig } from '../../.vitepress/config/markdown.ts'

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const THEME_INDEX = resolve(ROOT, '.vitepress/theme/index.ts')

// 可见文本 token。image 的 content 是 alt，加载失败时可见，也需要检查。
const VISIBLE_TEXT_TOKENS = new Set(['text', 'image'])
// zhlint 自带的 ignore 注释必须留在检查文本里，否则它注册的忽略规则失效。
const ZHLINT_IGNORE_REGEX = /<!--\s*zhlint\s+ignore:[^>]*-->/g
// 渲染成独立 DOM 元素、或内容不参与中文排版检查的 token，作为块边界断开。
const BLOCK_BOUNDARY_TOKENS = new Set([
  'code_inline',
  'emoji',
  'html_inline',
  'html_block',
  'softbreak',
  'hardbreak',
  'mark_open',
  'mark_close',
  'spoiler_open',
  'spoiler_close',
  'ruby_open',
  'ruby_close',
  'rt_open',
  'rt_close',
  'footnote_ref',
  'footnote_inline',
])
const HEADER_ANCHOR_CLASS = 'header-anchor'

let rendererPromise

function getRenderer() {
  if (!rendererPromise)
    rendererPromise = createMarkdownRenderer(resolve(ROOT, 'pages'), markdownConfig)
  return rendererPromise
}

/** 该 text token 是否是紧邻 header-anchor link 的语法空格。 */
function isBeforeHeaderAnchor(children, index) {
  const next = children[index + 1]
  return !!next
    && next.type === 'link_open'
    && (next.attrs || []).some(([key, value]) => key === 'class' && String(value).split(/\s+/).includes(HEADER_ANCHOR_CLASS))
}

/** 属性值是否会由组件渲染成需要中文排版检查的可见文字。 */
function hasNonAscii(value) {
  return typeof value === 'string'
    && [...value].some(char => char.codePointAt(0) > 0x7F)
}

function kebabCase(name) {
  return name
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

function camelCase(name) {
  return name.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

function resolveThemeImport(specifier) {
  if (specifier.startsWith('.'))
    return resolve(dirname(THEME_INDEX), specifier)
  if (specifier.startsWith('@theme/'))
    return resolve(ROOT, '.vitepress/theme', specifier.slice('@theme/'.length))
  if (specifier.startsWith('@/'))
    return resolve(ROOT, specifier.slice('@/'.length))
  return null
}

function toViteId(file) {
  return `/${relative(ROOT, file).replaceAll('\\', '/')}`
}

/** 从主题注册处推导 MDC tag → 组件文件，新增注册组件无需改这里。 */
function discoverComponentIds() {
  const source = readFileSync(THEME_INDEX, 'utf8')
  /** @type {Map<string, string>} */
  const imports = new Map()

  for (const match of source.matchAll(/^import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/gm))
    imports.set(match[1], match[2])
  for (const match of source.matchAll(/const\s+(\w+)\s*=\s*defineAsyncComponent\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)\)/g))
    imports.set(match[1], match[2])

  /** @type {Map<string, string>} */
  const ids = new Map()
  for (const match of source.matchAll(/app\.component\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g)) {
    const specifier = imports.get(match[2])
    if (!specifier)
      continue
    const file = resolveThemeImport(specifier)
    if (file)
      ids.set(kebabCase(match[1]), toViteId(file))
  }
  return ids
}

let viteServerPromise
let componentIds
const componentCache = new Map()

const vitepressStub = {
  name: 'lint-zh-vitepress-stub',
  enforce: 'pre',
  resolveId(id) {
    if (id === 'vitepress')
      return '\0lint-zh-vitepress'
  },
  load(id) {
    if (id === '\0lint-zh-vitepress')
      return 'export const withBase = path => path'
  },
}

function getViteServer() {
  if (!viteServerPromise) {
    viteServerPromise = createServer({
      configFile: false,
      root: ROOT,
      appType: 'custom',
      logLevel: 'silent',
      server: { middlewareMode: true },
      plugins: [vitepressStub, vue()],
      ssr: { noExternal: ['vitepress'] },
      optimizeDeps: { noDiscovery: true, include: [] },
      resolve: {
        alias: [
          { find: /^@theme\//u, replacement: `${resolve(ROOT, '.vitepress/theme').replaceAll('\\', '/')}/` },
          { find: /^@\//u, replacement: `${ROOT.replaceAll('\\', '/')}/` },
          { find: /^~\//u, replacement: `${resolve(ROOT, '.vitepress').replaceAll('\\', '/')}/` },
        ],
      },
    })
  }
  return viteServerPromise
}

async function loadComponent(tag) {
  if (componentCache.has(tag))
    return componentCache.get(tag)

  componentIds ??= discoverComponentIds()
  const id = componentIds.get(tag)
  let component = null
  if (id) {
    const server = await getViteServer()
    component = (await server.ssrLoadModule(id)).default ?? null
  }
  componentCache.set(tag, component)
  return component
}

/** ClientOnly 在 SSR 下不输出内容；lint 只关心属性是否会变成文字，直接透传。 */
const passthrough = {
  setup(_props, { slots }) {
    return () => slots.default?.()
  },
}

let i18n

function getI18n() {
  i18n ??= createI18n({
    legacy: false,
    locale: 'zh',
    messages: {
      zh: {
        qa: {
          button: {
            collapse: '折叠',
            expand: '展开',
            expandAll: '全部展开',
            collapseAll: '全部折叠',
          },
        },
      },
    },
  })
  return i18n
}

/** 用槽哨兵渲染组件，返回的文本里只可能来自 props。 */
async function renderVisibleText(tag, props, slots) {
  const component = await loadComponent(tag)
  if (!component)
    return null

  const markerSlots = Object.fromEntries(
    Object.keys(slots).map(name => [name, () => `__LINT_ZH_SLOT_${name}__`]),
  )
  const app = createSSRApp({
    render: () => h(component, props, markerSlots),
  })
  app.config.warnHandler = () => {}
  app.component('ClientOnly', passthrough)
  app.use(getI18n())

  return renderToString(app)
    .then((html) => {
      return html
        .replace(/<!--[\s\S]*?-->/gu, '')
        .replace(/<(script|style)\b[\s\S]*?<\/\1>/giu, '')
        .replace(/<[^>]*>/gu, '')
        .replace(/&#x([0-9a-f]+);/giu, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
        .replace(/&#(\d+);/gu, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&lt;/gu, '<')
        .replace(/&gt;/gu, '>')
        .replace(/&quot;/gu, '"')
        .replace(/&#39;/gu, '\'')
        .replace(/&nbsp;/gu, '\u00A0')
        .replace(/&amp;/gu, '&')
    })
}

function normalizeProp(key, rawValue) {
  const bound = key.startsWith(':') || key.startsWith('v-bind:')
  const name = camelCase(bound ? key.replace(/^v-bind:/u, '').replace(/^:/u, '') : key)
  let value = rawValue

  if (bound) {
    try {
      value = JSON.parse(rawValue)
    }
    catch {
      // 复杂表达式保留原串，不会作为可见文本匹配。
    }
  }
  else if (rawValue === '') {
    value = true
  }
  else if (rawValue === 'true' || rawValue === 'false') {
    value = rawValue === 'true'
  }
  else if (/^-?\d+(?:\.\d+)?$/u.test(rawValue)) {
    value = Number(rawValue)
  }
  else if (rawValue.startsWith('[') || rawValue.startsWith('{')) {
    try {
      value = JSON.parse(rawValue)
    }
    catch {
      // 非法 JSON 保留原串。
    }
  }

  return { name, value }
}

/** 对象 / 数组属性（如 AccordionPanels 的 items）逐叶取值，不把整段 JSON 当一句话。 */
function propCandidates(value) {
  /** @type {string[]} */
  const result = []
  const seen = new Set()

  const visit = (item) => {
    if (typeof item === 'string') {
      if (hasNonAscii(item) && !seen.has(item)) {
        seen.add(item)
        result.push(item)
      }
    }
    else if (Array.isArray(item)) {
      item.forEach(visit)
    }
    else if (item && typeof item === 'object') {
      Object.values(item).forEach(visit)
    }
  }
  visit(value)
  return result
}

/** 关闭 Vite SSR 容器；检查脚本在报告前调用。 */
export async function closeExtractRenderer() {
  if (viteServerPromise) {
    const server = await viteServerPromise
    await server.close()
    viteServerPromise = undefined
  }
}

/**
 * @param {string} src
 * @returns {Promise<Array<{ checkText: string, charMap: number[] }>>} 按块聚合的可见文本及其到源文件的偏移映射
 */
export async function extractBlocks(src) {
  const md = await getRenderer()
  const tokens = md.parse(src, {})

  const lineStarts = []
  let acc = 0
  for (const line of src.split('\n')) {
    lineStarts.push(acc)
    acc += line.length + 1
  }

  /** @type {Array<{ checkText: string, charMap: number[] }>} */
  const blocks = []
  // 源码游标：片段按 token 顺序出现，顺序 indexOf 既能定位又能处理重复文本。
  let cursor = 0

  const locate = (text) => {
    if (!text)
      return -1
    const pos = src.indexOf(text, cursor)
    if (pos >= 0)
      cursor = pos + text.length
    return pos
  }

  const pushBlock = (segments) => {
    if (!segments.length)
      return
    segments.sort((a, b) => a.srcStart - b.srcStart)
    let checkText = ''
    const charMap = []
    for (const seg of segments) {
      for (let i = 0; i < seg.text.length; i++) {
        checkText += seg.text[i]
        charMap.push(seg.srcStart + i)
      }
    }
    if (!checkText)
      return
    // 中文排版规则不该改动纯英文句子：夹在中文块之间时 zhlint 会把英文句号
    // 按中文标点改写。zhlint ignore 注释本身要保留，它注册的忽略规则才有效。
    if (!ZHLINT_IGNORE_REGEX.test(checkText) && !/[\u3400-\u9FFF]/.test(checkText))
      return
    ZHLINT_IGNORE_REGEX.lastIndex = 0
    blocks.push({ checkText, charMap })
  }

  /** 记录属性值及其源码位置；实际是否入块由组件渲染结果决定。 */
  const createInstance = (tag, attrs) => {
    /** @type {Record<string, unknown>} */
    const props = {}
    /** @type {Array<{ text: string, srcStart: number }>} */
    const candidates = []
    /** @type {Record<string, string[]>} */
    const slots = {}

    for (const [key, rawValue] of attrs || []) {
      const { name, value } = normalizeProp(key, rawValue)
      props[name] = value
      for (const text of propCandidates(value)) {
        const pos = locate(text)
        if (pos >= 0)
          candidates.push({ text, srcStart: pos })
      }
    }

    return { tag: kebabCase(tag), props, candidates, slots, slotStack: ['default'] }
  }

  const pushVisibleProps = async (instance) => {
    if (!instance)
      return
    if (!instance.candidates.length)
      return
    for (const [name, parts] of Object.entries(instance.slots))
      instance.slots[name] = parts.join('')

    let visibleText = null
    try {
      visibleText = await renderVisibleText(instance.tag, instance.props, instance.slots)
    }
    catch {
      // 组件无法单独渲染时保守纳入，避免漏掉真实问题。
    }

    for (const candidate of instance.candidates) {
      if (visibleText === null || visibleText.includes(candidate.text))
        pushBlock([candidate])
    }
  }

  /** @type {Array<ReturnType<typeof createInstance>>} */
  const componentStack = []
  /** @type {Array<Array<{ text: string, srcStart: number }>>} */
  const inlineSegmentsStack = []

  for (const token of tokens) {
    if (token.type === 'mdc_block_open') {
      if (token.map)
        cursor = Math.max(cursor, lineStarts[token.map[0]] ?? 0)
      componentStack.push(createInstance(token.tag, token.attrs))
      continue
    }
    if (token.type === 'mdc_block_slot') {
      const instance = componentStack.at(-1)
      if (!instance)
        continue
      if (token.nesting === 1) {
        const named = (token.attrs || []).find(([key]) => key.startsWith('#'))?.[0].slice(1)
        instance.slotStack.push(named || 'default')
      }
      else if (token.nesting === -1 && instance.slotStack.length > 1) {
        instance.slotStack.pop()
      }
      continue
    }
    if (token.type === 'mdc_block_close') {
      await pushVisibleProps(componentStack.pop())
      continue
    }
    if (token.type === 'html_block' && ZHLINT_IGNORE_REGEX.test(token.content ?? '')) {
      ZHLINT_IGNORE_REGEX.lastIndex = 0
      const pos = locate(token.content.trim())
      if (pos >= 0)
        pushBlock([{ text: token.content.trim(), srcStart: pos }])
      continue
    }
    if (token.type !== 'inline' || !token.children)
      continue

    if (token.map)
      cursor = Math.max(cursor, lineStarts[token.map[0]] ?? 0)

    /** @type {Array<{ text: string, srcStart: number }>} */
    let textSegments = []
    const children = token.children

    for (let index = 0; index < children.length; index++) {
      const child = children[index]

      if (VISIBLE_TEXT_TOKENS.has(child.type)) {
        // 标题锚点 `{#id}` 渲染成 header-anchor，它前面的空格是语法的一部分，
        // 不是正文；交给 zhlint 会被当成标题尾部的多余空格。
        if (child.type === 'text' && isBeforeHeaderAnchor(children, index))
          continue
        const pos = locate(child.content)
        if (pos >= 0) {
          const segment = { text: child.content, srcStart: pos }
          if (inlineSegmentsStack.length)
            inlineSegmentsStack.at(-1).push(segment)
          else
            textSegments.push(segment)
          for (const instance of componentStack) {
            const slot = instance.slotStack.at(-1) ?? 'default'
            const parts = instance.slots[slot] ??= []
            parts.push(child.content)
          }
        }
        continue
      }
      if (BLOCK_BOUNDARY_TOKENS.has(child.type)) {
        pushBlock(textSegments)
        textSegments = []
        continue
      }
      if (child.type !== 'mdc_inline_component')
        continue

      if (child.nesting === 1) {
        pushBlock(textSegments)
        textSegments = []
        componentStack.push(createInstance(child.tag, []))
        inlineSegmentsStack.push([])
      }
      else if (child.nesting === -1) {
        const segments = inlineSegmentsStack.pop()
        pushBlock(segments ?? [])
        const instance = componentStack.pop()
        if (instance) {
          for (const [key, value] of child.attrs || []) {
            const { name, value: propValue } = normalizeProp(key, value)
            instance.props[name] = propValue
            for (const text of propCandidates(propValue)) {
              const pos = locate(text)
              if (pos >= 0)
                instance.candidates.push({ text, srcStart: pos })
            }
          }
        }
        await pushVisibleProps(instance)
      }
      else {
        pushBlock(textSegments)
        textSegments = []
        const instance = createInstance(child.tag, child.attrs)
        await pushVisibleProps(instance)
      }
    }
    pushBlock(textSegments)
    while (inlineSegmentsStack.length)
      pushBlock(inlineSegmentsStack.pop())
  }

  return blocks
}
