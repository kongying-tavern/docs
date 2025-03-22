import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'

function MarkdownItCustomColor(md: MarkdownIt): void {
  md.inline.ruler.before(
    'emphasis',
    'custom_color',
    (state: StateInline, silent: boolean): boolean => {
      const start = state.pos
      const src = state.src.slice(start)

      const match = src.match(/^\{color:([^}]+)\}(.*?)\{\/color\}/)

      if (!match)
        return false
      if (silent)
        return true

      // Extract color and content
      const color = match[1]
      const content = match[2]

      // Create opening tag token
      const tokenOpen = state.push('html_inline', '', 0)
      tokenOpen.content = `<span style="color:${color}">`

      // Create content token
      const tokenContent = state.push('html_inline', '', 0)
      tokenContent.content = md.renderInline(content)

      // Create closing tag token
      const tokenClose = state.push('html_inline', '', 0)
      tokenClose.content = `</span>`

      // Move the parser position forward
      state.pos += match[0].length

      return true
    },
  )
}

export default MarkdownItCustomColor
