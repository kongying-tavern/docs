import type MarkdownIt from 'markdown-it'
import type { RuleInline } from 'markdown-it/lib/parser_inline.mjs'

const RE_JSON_BRACKET = /^\s*[[{]/
const RE_JSON_BOOL_NULL = /^\s*(?:true|false|null)\s*$/
const RE_JSON_NUMBER = /^\s*-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\s*$/i
const RE_VALID_COMPONENT = /^[A-Z]/
const RE_DOUBLE_QUOTE = /"/g
const RE_CONTAINER_LINE = /^:{2,}\s*([A-Z][\w-]*)/i
const RE_INLINE_COMPONENT_NAME = /^:([\w$-]+)/
const RE_INLINE_SELF_CLOSING = /^:([A-Z][\w-]*)\{([^{}]*)\}/
const RE_INLINE_PROP = /([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g

/** Same opening context Comark requires for an inline component. */
const INLINE_PREV_CHARS = new Set([' ', '\t', '\n', '*', '_', '['])

function parseInlineProps(raw: string): Array<[string, string]> {
  const attrs: Array<[string, string]> = []
  for (const match of raw.matchAll(RE_INLINE_PROP)) {
    const [, key, doubleQuoted, singleQuoted, bare] = match
    attrs.push([key, doubleQuoted ?? singleQuoted ?? bare ?? 'true'])
  }
  return attrs
}

/**
 * 容器名保留名单:VitePress 内置容器(tip/raw/…)与 markdown-ext 下所有扩展
 * (demo/card/qa/spoiler/…)都在此列,Comark 必须让出,不可把它们的名字当成
 * MDC 组件。按源文本大小写精确匹配,故 PascalCase 标签(::Card/::Spoiler/
 * ::QA)不受影响,小写形式(:::card/::spoiler)则被挡下。
 * demo 完全依赖本名单让出,注册顺序不再兜底,不可从名单移除。
 */
const RESERVED_BLOCK_CONTAINERS = new Set([
  'tip',
  'info',
  'warning',
  'danger',
  'details',
  'note',
  'important',
  'caution',
  'raw',
  'v-pre',
  'code-group',
  // markdown-ext 下的全部扩展,与语法形式(::: name / 行内 / 纯 MDC)无关。
  'card',
  'color-preview',
  'custom-color',
  'demo',
  'doc-header-title',
  'emoji',
  'kbd',
  'lightbox',
  'mention',
  'qa',
  'ruby',
  'spoiler',
  'timeline',
  'variable-inject',
])

interface BlockState {
  src: string
  bMarks: number[]
  tShift: number[]
  eMarks: number[]
}

type BlockRule = (state: BlockState, startLine: number, endLine: number, silent: boolean) => boolean | void

interface RuleEntry {
  name: string
  fn: BlockRule
}

function isJsonValue(value: string): boolean {
  return RE_JSON_BRACKET.test(value)
    || RE_JSON_BOOL_NULL.test(value)
    || RE_JSON_NUMBER.test(value)
}

interface InlineToken {
  type: string
  tag: string
  nesting: number
  attrs?: Array<[string, string]> | null
}

/**
 * Props written after `[内容]` are attached to the component's closing token,
 * not its opening one. An opening tag therefore has to look ahead for the token
 * that closes it and borrow the props from there.
 */
function attrsOfClosingToken(tokens: InlineToken[], idx: number): Array<[string, string]> | null {
  const { tag } = tokens[idx]
  let depth = 0
  for (let i = idx; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type !== 'mdc_inline_component' || token.tag !== tag) {
      continue
    }
    if (token.nesting === 1) {
      depth += 1
    }
    else if (token.nesting === -1) {
      depth -= 1
      if (depth === 0) {
        return token.attrs ?? null
      }
    }
  }
  return null
}

/**
 * Apply compatibility patches for @comark/markdown-it to work with
 * Vue template compiler (used by VitePress).
 *
 * Preserve ordinary inline syntax and reserved containers alongside MDC,
 * emit valid Vue component tags, and bind JSON props with :attr syntax.
 */
export function applyComarkPatches(md: MarkdownIt): void {
  // Inline props follow the same rules as block props: JSON values bind as
  // expressions, everything else stays a plain attribute. A bare flag arrives
  // as an empty string, which Vue reads as a falsy prop, so it is passed on as
  // a boolean literal.
  const renderInlineAttrs = (attrs: Array<[string, string]> | null | undefined): string => {
    let html = ''
    for (const [key, value] of attrs ?? []) {
      const literal = value === '' ? 'true' : value
      if (isJsonValue(literal)) {
        let normalized: string
        try {
          normalized = JSON.stringify(JSON.parse(literal))
        }
        catch {
          normalized = JSON.stringify(literal)
        }
        html += ` :${key}="${normalized.replace(RE_DOUBLE_QUOTE, '&quot;')}"`
      }
      else {
        html += ` ${md.utils.escapeHtml(key)}="${md.utils.escapeHtml(value)}"`
      }
    }
    return html
  }

  // Yield ordinary colon text and emoji before tokenization, so later
  // inline rules can still process them instead of restoring plain text.
  const inlineRules = (md.inline.ruler as unknown as { __rules__?: Array<{ name: string, fn: RuleInline }> }).__rules__
  const inlineComponent = inlineRules?.find(rule => rule.name === 'mdc_inline_component')
  if (inlineComponent) {
    const original = inlineComponent.fn
    md.inline.ruler.at('mdc_inline_component', (state, silent) => {
      const name = RE_INLINE_COMPONENT_NAME.exec(state.src.slice(state.pos))?.[1]
      if (!name || (!name.includes('-') && !RE_VALID_COMPONENT.test(name)))
        return false
      return original(state, silent)
    })
  }

  // ── inlineComponent: only render valid component names as HTML ──────
  // A component without a `[槽]` keeps its props as plain text, because Comark
  // only tokenizes props behind a slot. Emit the self-closing token with its
  // props directly, so `:Placeholder{inline hint="…"}` works inside a sentence.
  md.inline.ruler.before('mdc_inline_component', 'mdc_inline_component_props', (state, silent) => {
    const start = state.pos
    if (state.src[start] !== ':') {
      return false
    }
    if (start > 0 && !INLINE_PREV_CHARS.has(state.src[start - 1])) {
      return false
    }
    const match = RE_INLINE_SELF_CLOSING.exec(state.src.slice(start, state.posMax))
    if (!match) {
      return false
    }
    if (silent) {
      return true
    }
    const token = state.push('mdc_inline_component', match[1], 0)
    token.attrs = parseInlineProps(match[2])
    state.pos = start + match[0].length
    return true
  })

  md.renderer.rules.mdc_inline_component = (tokens, idx) => {
    const token = tokens[idx]
    const { tag: name, nesting } = token

    // Valid component: contains hyphen (custom element) or starts uppercase (Vue)
    if (name.includes('-') || RE_VALID_COMPONENT.test(name)) {
      // Props sit on the closing token, and Vue drops attributes written on an
      // end tag, so they are emitted on the opening tag instead.
      if (nesting === -1) {
        return `</${name}>`
      }
      const attrs = [
        ...(token.attrs ?? []),
        ...(nesting === 1 ? attrsOfClosingToken(tokens as unknown as InlineToken[], idx) ?? [] : []),
      ]
      const html = `<${name}${renderInlineAttrs(attrs)}`
      // Self-closing tokens must render as <tag></tag> pair because
      // Vue's compiler treats <tag /> as an opening tag for non-void
      // elements (per HTML spec), expecting a closing </tag>.
      return nesting === 0 ? `${html}></${name}>` : `${html}>`
    }

    // Non-component name (digit, GFM emoji code, table alignment, etc.)
    // — restore original markdown text
    if (token.hidden) {
      return ''
    }
    if (nesting === 0) {
      return `:${name}`
    }
    if (nesting === 1) {
      return `:${name}[`
    }
    return ']'
  }

  // ── blockComponent: emit :attr for JSON-valued props ───────────────
  // A line that starts with `:Name{…}` is parsed as a self-closing shorthand and
  // rendered as a lone opening tag, which the Vue compiler rejects. Pair it up.
  md.renderer.rules.mdc_block_shorthand = (tokens, idx, options, _env, self) => {
    const token = tokens[idx]
    if (token.nesting === 0) {
      return `<${token.tag}${renderInlineAttrs(token.attrs)}></${token.tag}>`
    }
    return self.renderToken(tokens, idx, options)
  }

  md.renderer.rules.mdc_block_open = (tokens, idx) => {
    const token = tokens[idx]
    let html = `<${token.tag}`

    if (token.attrs) {
      for (const [key, value] of token.attrs) {
        if (isJsonValue(value)) {
          // Normalize via JSON.parse/stringify so Vue :attr evaluates
          // bool/number/array/object values as JS expressions.
          let normalized: string
          try {
            normalized = JSON.stringify(JSON.parse(value))
          }
          catch {
            normalized = JSON.stringify(value)
          }
          html += ` :${key}="${normalized.replace(RE_DOUBLE_QUOTE, '&quot;')}"`
        }
        else {
          html += ` ${md.utils.escapeHtml(key)}="${md.utils.escapeHtml(value)}"`
        }
      }
    }

    html += '>'
    return html
  }

  // ── block rules: yield reserved container names ─────────────────────
  // Comark 在 `preConfig` 中注册,先于 VitePress 内置容器(tip/raw/…)与
  // `config` 阶段的站点插件(timeline/…)。其块规则匹配任意 `::: 名字`,
  // 若不避让,`::: tip` 等会被当作 MDC 组件(<tip>)并在 Vue 编译时被丢弃。
  const rules = (md.block.ruler as unknown as { __rules__?: RuleEntry[] }).__rules__
  for (const name of ['mdc_block_shorthand', 'mdc_block']) {
    const entry = rules?.find(rule => rule.name === name)
    if (!entry) {
      continue
    }
    const original = entry.fn
    md.block.ruler.at(name, (state, startLine, endLine, silent) => {
      const line = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine])
      const match = RE_CONTAINER_LINE.exec(line)
      // Container names are case-sensitive; `::Card` is a Vue component.
      if (match && RESERVED_BLOCK_CONTAINERS.has(match[1])) {
        return false
      }
      return Boolean(original(state, startLine, endLine, silent))
    })
  }
}
