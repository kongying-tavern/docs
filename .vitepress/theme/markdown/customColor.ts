import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'

const CUSTOM_COLOR_TAG_REGEX = /^\{color:([^}]+)\}(.*?)\{\/color\}/

function MarkdownItCustomColor(md: MarkdownIt): void {
  md.inline.ruler.before(
    'emphasis',
    'custom_color',
    (state: StateInline, silent: boolean): boolean => {
      const start = state.pos
      const src = state.src.slice(start)

      const match = src.match(CUSTOM_COLOR_TAG_REGEX)

      if (!match)
        return false
      if (silent) {
        state.pos += match[0].length
        return true
      }

      const color = match[1]
      const content = match[2]

      const tokenOpen = state.push('html_inline', '', 0)
      tokenOpen.content = `<span style="color: ${md.utils.escapeHtml(color)};">`

      const tokenContent = state.push('html_inline', '', 0)
      tokenContent.content = md.renderInline(content)

      const tokenClose = state.push('html_inline', '', 0)
      tokenClose.content = `</span>`

      state.pos += match[0].length

      return true
    },
  )
}

export default MarkdownItCustomColor
