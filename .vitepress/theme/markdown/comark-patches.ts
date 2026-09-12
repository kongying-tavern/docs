import type MarkdownIt from 'markdown-it'

const RE_JSON_BRACKET = /^\s*[[{]/
const RE_JSON_BOOL_NULL = /^\s*(?:true|false|null)\s*$/
const RE_JSON_NUMBER = /^\s*-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\s*$/i
const RE_VALID_COMPONENT = /^[A-Z]/
const RE_DOUBLE_QUOTE = /"/g
const RE_CONTAINER_LINE = /^:{2,}\s*([A-Z][\w-]*)/i

/**
 * 容器名保留名单:这些名字由 VitePress 内置容器(tip/raw/…)或
 * `config` 阶段的站点插件(timeline/card/…)处理,Comark 必须让出。
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
  'demo',
  'timeline',
  'card',
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

/**
 * Apply compatibility patches for @comark/markdown-it to work with
 * Vue template compiler (used by VitePress).
 *
 * Two fixes:
 * 1. inlineComponent renderer — filter valid component names only,
 *    restore invalid ones to text (avoids Vue "Element is missing end tag")
 * 2. blockComponent renderer — detect JSON props and emit :attr syntax
 *    so Vue evaluates arrays/objects instead of treating them as strings
 */
export function applyComarkPatches(md: MarkdownIt): void {
  const renderToken = md.renderer.renderToken.bind(md.renderer)

  // ── inlineComponent: only render valid component names as HTML ──────
  md.renderer.rules.mdc_inline_component = (tokens, idx, options, _env, self) => {
    const token = tokens[idx]
    const { tag: name, nesting } = token

    // Valid component: contains hyphen (custom element) or starts uppercase (Vue)
    if (name.includes('-') || RE_VALID_COMPONENT.test(name)) {
      // Self-closing tokens must render as <tag></tag> pair because
      // Vue's compiler treats <tag /> as an opening tag for non-void
      // elements (per HTML spec), expecting a closing </tag>.
      if (nesting === 0) {
        const attrs = self.renderAttrs(token)
        return `<${name}${attrs}></${name}>`
      }
      return renderToken(tokens, idx, options)
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
  // `config` 阶段的站点插件(timeline/card/…)。其块规则匹配任意 `::: 名字`,
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
      if (match && RESERVED_BLOCK_CONTAINERS.has(match[1].toLowerCase())) {
        return false
      }
      return Boolean(original(state, startLine, endLine, silent))
    })
  }
}
