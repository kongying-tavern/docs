import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'

/** Matches variable definition tags */
const VARIABLE_DEF_REGEX = /^\{define:\s*(\w+)\s*\}(.*?)\{\/define\}/

/** Matches variable usage tags */
const VARIABLE_USAGE_REGEX = /^\{%=\s*(\w+)\s*%\}/

function MarkdownItVariableInject(md: MarkdownIt): void {
  const variables: Record<string, string> = {}

  md.inline.ruler.before(
    'emphasis',
    'variable_def',
    (state: StateInline, silent: boolean): boolean => {
      const start = state.pos
      const src = state.src.slice(start)

      const match = src.match(VARIABLE_DEF_REGEX)

      if (!match)
        return false
      if (silent)
        return true

      // Extract key and value
      const key = (match[1] ?? '').trim()
      const value = match[2]

      variables[key] = value
      state.pos += match[0].length

      return true
    },
  )

  md.inline.ruler.before(
    'emphasis',
    'variable',
    (state: StateInline, silent: boolean): boolean => {
      const start = state.pos
      const src = state.src.slice(start)

      const match = src.match(VARIABLE_USAGE_REGEX)

      if (!match)
        return false
      if (silent)
        return true

      // Extract key and get value
      const key = (match[1] ?? '').trim()
      const value = variables[key] ?? ''

      // Create content token
      const tokenContent = state.push('html_inline', '', 0)
      tokenContent.content = md.renderInline(value)

      state.pos += match[0].length

      return true
    },
  )
}

export default MarkdownItVariableInject
