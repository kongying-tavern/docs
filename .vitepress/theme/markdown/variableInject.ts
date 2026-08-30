import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import emojiFullData from 'markdown-it-emoji/lib/data/full.mjs'

/** Matches variable definition tags */
const VARIABLE_DEF_REGEX = /^\{define:\s*(\w+)\s*\}(.*?)\{\/define\}/

/** Matches leading :emoji: pattern to escape from inlineComponent */
const LEADING_COLON_WORD_REGEX = /^(:[\w$\-]+:)/

/** Matches GitHub-style emoji shortcodes, e.g. :bento: */
const EMOJI_SHORTCODE_REGEX = /:([\w+-]+):/g

/** Resolves known emoji shortcodes to their unicode characters */
function resolveEmojiShortcodes(value: string): string {
  return value.replace(EMOJI_SHORTCODE_REGEX, (match, name: string) => emojiFullData[name] ?? match)
}

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
      if (silent) {
        state.pos += match[0].length
        return true
      }

      // Extract key and value
      const key = (match[1] ?? '').trim()
      let value = match[2]
      // Values are re-rendered via renderInline(), which skips core rules
      // (incl. the emoji rule), so resolve :emoji: shortcodes here first,
      // otherwise they show up as literal text in the output.
      value = resolveEmojiShortcodes(value)
      // Escape leading :name: pattern (e.g. :recycle:) so that comark's
      // inlineComponent parser won't consume it during md.renderInline()
      value = value.replace(LEADING_COLON_WORD_REGEX, '\\$1')

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
      if (silent) {
        state.pos += match[0].length
        return true
      }

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
