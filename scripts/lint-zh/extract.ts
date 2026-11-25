/**
 * 按项目 Markdown 渲染器的语法理解，提取文档中需要中文排版检查的可见文本。
 *
 * 走渲染器自己的 token 流拿到正文与源码偏移；MDC 属性值是否算可见文本，
 * 则由组件真实渲染出的 HTML 决定：只有出现在渲染后文本节点里的属性值
 * （如 Card 的 title/desc）才交给 zhlint。
 * 渲染 slot 时用哨兵文本替代槽内容，避免槽内容恰好等于 prop 值时误判。
 *
 * 片段按“块元素”聚合：普通正文连续拼接（跨链接等语法标记，
 * 让“链接左右空格”这类跨标记规则仍能触发）；行内组件、块组件和可见 prop
 * 各自成块，避免和相邻正文拼成一句话。
 */
import type MarkdownIt from 'markdown-it'
import type { Plugin, ViteDevServer } from 'vite'
import type { Component } from 'vue'
import type { I18n } from 'vue-i18n'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { createServer } from 'vite'
import { createMarkdownRenderer } from 'vitepress'
import { camelize, capitalize, createSSRApp, h } from 'vue'
import { createI18n } from 'vue-i18n'
import { renderToString } from 'vue/server-renderer'
import { expandPathAliases } from '../../.vitepress/config/aliases.ts'
import { markdownConfig } from '../../.vitepress/config/markdown.ts'
import { PAGES_DIR } from '../../.vitepress/config/pagesDir.ts'
import { DEFAULT_LOCALE } from '../../src/constants/site.ts'

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))

/** 按块聚合的可见文本，以及每个字符在源文件中的偏移。 */
export interface ExtractedBlock {
  checkText: string
  charMap: number[]
}

interface TextSegment {
  text: string
  srcStart: number
}

/** 一个 MDC 组件实例：属性、待定位的候选文本与各槽收集到的正文。 */
interface ComponentInstance {
  tag: string
  props: Record<string, unknown>
  candidates: TextSegment[]
  pendingTexts: string[] | null
  slots: Record<string, string[]>
  slotStack: string[]
}

type Token = ReturnType<MarkdownIt['parse']>[number]

// 可见文本 token。image 的 content 是 alt，加载失败时可见，也需要检查。
const VISIBLE_TEXT_TOKENS = new Set(['text', 'image'])
// zhlint 自带的 ignore 注释必须留在检查文本里，否则它注册的忽略规则失效。
const ZHLINT_IGNORE_REGEX = /<!--\s*zhlint\s+ignore:[^>]*-->/g
// 只列出“内联续接正文”的常见标记；其余 token（含所有扩展插件产生的 token）
// 默认作为块边界断开。这样新增 Markdown 语法无需在这里同步维护。
const INLINE_FLOW_TOKENS = new Set([
  'link_open',
  'link_close',
  'strong_open',
  'strong_close',
  'em_open',
  'em_close',
  's_open',
  's_close',
])
const HEADER_ANCHOR_CLASS = 'header-anchor'

let rendererPromise: ReturnType<typeof createMarkdownRenderer> | undefined

function getRenderer(): ReturnType<typeof createMarkdownRenderer> {
  if (!rendererPromise)
    rendererPromise = createMarkdownRenderer(resolve(ROOT, PAGES_DIR), markdownConfig)
  return rendererPromise
}

/** 该 text token 是否是紧邻 header-anchor link 的语法空格。 */
function isBeforeHeaderAnchor(children: Token[], index: number): boolean {
  const next = children[index + 1]
  return !!next
    && next.type === 'link_open'
    && (next.attrs || []).some(([key, value]) => key === 'class' && String(value).split(/\s+/).includes(HEADER_ANCHOR_CLASS))
}

/** 属性值是否会由组件渲染成需要中文排版检查的可见文字。 */
function hasNonAscii(value: unknown): boolean {
  return typeof value === 'string'
    && [...value].some(char => (char.codePointAt(0) ?? 0) > 0x7F)
}

/** `html_inline` 的内容是渲染后的 HTML，剥掉标签与注释才是可见文字。 */
function stripHtmlTags(content: string): string {
  return content
    .replaceAll(/<!--[\s\S]*?-->/gu, '')
    .replaceAll(/<[^>]*>/gu, '')
    .replaceAll('&nbsp;', ' ')
    .trim()
}

/**
 * 按 Vue 运行时解析组件的规则查表：精确匹配 → camelize → capitalize。
 * MDC 的块标签已经 kebab 化（`::QA` → `qa`），行内标签保留原写法（`:Kbd`）；
 * 两种都由这套规则覆盖，不需要自己再做大小写转换。
 */
function resolveTag(components: Map<string, Component>, tag: string): Component | null {
  for (const name of [tag, camelize(tag), capitalize(camelize(tag))]) {
    if (components.has(name))
      return components.get(name) ?? null
  }
  return null
}

let viteServerPromise: Promise<ViteDevServer> | undefined
let componentsPromise: Promise<Map<string, Component>> | undefined
const componentCache = new Map<string, Component | null>()

const vitepressStub: Plugin = {
  name: 'lint-zh-vitepress-stub',
  enforce: 'pre',
  resolveId(id: string) {
    if (id === 'vitepress')
      return '\0lint-zh-vitepress'
  },
  load(id: string) {
    if (id === '\0lint-zh-vitepress')
      return 'export const withBase = path => path'
  },
}

function getViteServer(): Promise<ViteDevServer> {
  if (!viteServerPromise) {
    viteServerPromise = createServer({
      configFile: false,
      root: ROOT,
      appType: 'custom',
      logLevel: 'silent',
      // 只做一次性模块加载：不需要监听文件，watcher 扫仓库比转译本身还慢。
      server: { middlewareMode: true, watch: null },
      plugins: [vitepressStub, vue()],
      ssr: { noExternal: ['vitepress'] },
      optimizeDeps: { noDiscovery: true, include: [] },
      resolve: {
        alias: expandPathAliases(ROOT),
      },
    })
  }
  return viteServerPromise
}

/**
 * 执行主题自己的正文组件注册函数，得到「注册名 → 组件」。
 * 注册表只有 theme/lib/markdownComponents.ts 一份，这里不解析任何写法。
 */
function getComponents(): Promise<Map<string, Component>> {
  componentsPromise ??= (async () => {
    const server = await getViteServer()
    const { installMarkdownComponents } = await server.ssrLoadModule('@theme/lib/markdownComponents.ts')
    const components = new Map<string, Component>()
    installMarkdownComponents({
      component(name: string, definition: Component) {
        components.set(name, definition)
      },
    })
    return components
  })()
  return componentsPromise
}

/** 注册项可能是 `defineAsyncComponent`，先解析成真实组件，避免每次渲染都走 loader。 */
async function resolveAsyncLoader(component: Component | null): Promise<unknown> {
  const loader = (component as (Component & { __asyncLoader?: () => Promise<unknown> }) | null)?.__asyncLoader
  return loader ? await loader() : component
}

/** SSR 下的 `.vue` 模块可能是 `{ default: Component }`，也可能就是组件本身。 */
function unwrapComponent(loaded: unknown): Component | null {
  if (!loaded)
    return null
  const asModule = loaded as { default?: Component }
  return asModule.default ?? (loaded as Component)
}

async function loadComponent(tag: string): Promise<Component | null> {
  if (!componentCache.has(tag))
    componentCache.set(tag, unwrapComponent(await resolveAsyncLoader(resolveTag(await getComponents(), tag))))
  return componentCache.get(tag) ?? null
}

/** ClientOnly 在 SSR 下不输出内容；lint 只关心属性是否会变成文字，直接透传。 */
const passthrough: Component = {
  setup(_props, { slots }) {
    return () => slots.default?.()
  },
}

let i18n: I18n | undefined

function getI18n() {
  // 只为让 useI18n 在 SSR 下可用；文案留空，t() 回退为 ASCII key，
  // 不会和需要检查的中文候选值匹配，也避免复制站点 locale 文案。
  // locale 跟站点默认语言走：lint 检查的就是这份源文案。
  i18n ??= createI18n({
    legacy: false,
    locale: DEFAULT_LOCALE,
    missingWarn: false,
    fallbackWarn: false,
    messages: {},
  })
  return i18n
}

/** 用槽哨兵渲染组件，返回的文本里只可能来自 props。 */
async function renderVisibleText(tag: string, props: Record<string, unknown>, slots: Record<string, string>): Promise<string | null> {
  const component = await loadComponent(tag)
  if (!component)
    return null

  const markerSlots: Record<string, () => string> = Object.fromEntries(
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

function normalizeProp(key: string, rawValue: string): { name: string, value: unknown } {
  const bound = key.startsWith(':') || key.startsWith('v-bind:')
  const name = camelize(bound ? key.replace(/^v-bind:/u, '').replace(/^:/u, '') : key)
  let value: unknown = rawValue

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
function propCandidates(value: unknown): string[] {
  const result: string[] = []
  const seen = new Set<string>()

  const visit = (item: unknown) => {
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
export async function closeExtractRenderer(): Promise<void> {
  if (viteServerPromise) {
    const server = await viteServerPromise
    await server.close()
    viteServerPromise = undefined
  }
}

/**
 * 提取一块块可见文本，`charMap` 把检查文本的每个字符映射回源文件偏移。
 */
export async function extractBlocks(src: string): Promise<ExtractedBlock[]> {
  const md = await getRenderer()
  const tokens = md.parse(src, {})

  const lineStarts: number[] = []
  let acc = 0
  for (const line of src.split('\n')) {
    lineStarts.push(acc)
    acc += line.length + 1
  }

  const blocks: ExtractedBlock[] = []
  // 源码游标：片段按 token 顺序出现，顺序 indexOf 既能定位又能处理重复文本。
  let cursor = 0

  const locate = (text: string): number => {
    if (!text)
      return -1
    const pos = src.indexOf(text, cursor)
    if (pos >= 0)
      cursor = pos + text.length
    return pos
  }

  const pushBlock = (segments: TextSegment[]): void => {
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

  /**
   * 记录属性值及其源码位置；实际是否入块由组件渲染结果决定。
   *
   * `:Name[槽]{属性}` 的属性和槽在源码里是反序的（槽在前、属性在后），
   * 属性值要等槽内容定位完再收，否则源码游标会越过槽文本导致漏检。
   */
  const createInstance = (
    tag: string,
    attrs: readonly (readonly [string, string])[] | null | undefined,
    { afterSlot = false }: { afterSlot?: boolean } = {},
  ): ComponentInstance => {
    const props: Record<string, unknown> = {}
    const candidates: TextSegment[] = []
    let pendingTexts: string[] | null = null
    const slots: Record<string, string[]> = {}

    for (const [key, rawValue] of attrs || []) {
      const { name, value } = normalizeProp(key, rawValue)
      props[name] = value
      const texts = propCandidates(value)
      if (!texts.length)
        continue
      if (afterSlot) {
        pendingTexts ??= []
        pendingTexts.push(...texts)
        continue
      }
      for (const text of texts) {
        const pos = locate(text)
        if (pos >= 0)
          candidates.push({ text, srcStart: pos })
      }
    }

    // MDC 原样交出标签（块已 kebab、行内保留大小写），解析交给 Vue 的规则。
    return { tag, props, candidates, pendingTexts, slots, slotStack: ['default'] }
  }

  const pushVisibleProps = async (instance: ComponentInstance | undefined): Promise<void> => {
    if (!instance)
      return
    // 槽内容已在前面定位，此时再收属性值，源码位置顺序才正确。
    for (const text of instance.pendingTexts || []) {
      const pos = locate(text)
      if (pos >= 0)
        instance.candidates.push({ text, srcStart: pos })
    }
    instance.pendingTexts = null
    if (!instance.candidates.length)
      return
    const slots = Object.fromEntries(
      Object.entries(instance.slots).map(([name, parts]) => [name, parts.join('')]),
    )

    let visibleText: string | null = null
    try {
      visibleText = await renderVisibleText(instance.tag, instance.props, slots)
    }
    catch {
      // 组件无法单独渲染时保守纳入，避免漏掉真实问题。
    }

    for (const candidate of instance.candidates) {
      if (visibleText === null || visibleText.includes(candidate.text))
        pushBlock([candidate])
    }
  }

  const componentStack: ComponentInstance[] = []
  const inlineSegmentsStack: TextSegment[][] = []

  for (const token of tokens) {
    // `:Name[槽]{属性}` 写在行首时是独立的块级组件：属性挂在开标签上，
    // 槽内容是紧随其后的 inline token，没有 `#slot` 分段。
    if (token.type === 'mdc_block_shorthand') {
      if (token.map)
        cursor = Math.max(cursor, lineStarts[token.map[0]] ?? 0)
      if (token.nesting === 1)
        componentStack.push(createInstance(token.tag, token.attrs, { afterSlot: true }))
      else if (token.nesting === -1)
        await pushVisibleProps(componentStack.pop())
      else
        await pushVisibleProps(createInstance(token.tag, token.attrs))
      continue
    }
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

    let textSegments: TextSegment[] = []
    const children = token.children

    /** 把一段文字定位回源码，并同步到它所在的组件槽。 */
    const addSegment = (text: string): void => {
      const pos = locate(text)
      if (pos < 0)
        return
      const segment = { text, srcStart: pos }
      const innermost = inlineSegmentsStack.at(-1)
      if (innermost)
        innermost.push(segment)
      else
        textSegments.push(segment)
      for (const instance of componentStack) {
        const slot = instance.slotStack.at(-1) ?? 'default'
        const parts = instance.slots[slot] ??= []
        parts.push(text)
      }
    }

    /**
     * 标签是块边界：先结束当前块，标签两侧的文字各自独立检查。
     * 这样标签周围的空格（写法问题）不会被当成相邻正文之间的关系。
     */
    const flushSegments = (): void => {
      const innermost = inlineSegmentsStack.at(-1)
      if (innermost) {
        if (innermost.length)
          pushBlock(innermost.splice(0, innermost.length))
        return
      }
      pushBlock(textSegments)
      textSegments = []
    }

    for (let index = 0; index < children.length; index++) {
      const child = children[index]

      if (VISIBLE_TEXT_TOKENS.has(child.type)) {
        // 标题锚点 `{#id}` 渲染成 header-anchor，它前面的空格是语法的一部分，
        // 不是正文；交给 zhlint 会被当成标题尾部的多余空格。
        if (child.type === 'text' && isBeforeHeaderAnchor(children, index))
          continue
        addSegment(child.content)
        continue
      }
      // 扩展语法（`{color:}…{/color}`）和手写 HTML 都把文字包进 html_inline。
      // 剥掉标签后能定位回源码的部分才是正文；变量注入的值没有源码位置，
      // 仍然会漏掉。标签本身就是块边界，两侧空格不参与排版判断。
      if (child.type === 'html_inline') {
        flushSegments()
        const visible = stripHtmlTags(child.content ?? '')
        if (hasNonAscii(visible)) {
          addSegment(visible)
          flushSegments()
        }
        continue
      }
      if (child.type === 'mdc_inline_component') {
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
        continue
      }
      if (!INLINE_FLOW_TOKENS.has(child.type)) {
        pushBlock(textSegments)
        textSegments = []
      }
    }
    pushBlock(textSegments)
    while (inlineSegmentsStack.length)
      pushBlock(inlineSegmentsStack.pop() ?? [])
  }

  return blocks
}
