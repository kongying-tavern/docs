import type MarkdownIt from 'markdown-it'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import container from 'markdown-it-container'

type ContainerArgs = [typeof container, string, { render: RenderRule }]

function MarkdownItTimeline(
  klass: string,
  md: MarkdownIt,
): ContainerArgs {
  return [
    container,
    klass,
    {
      render(tokens: Token[], idx: number) {
        const token = tokens[idx]
        const info = token.info.trim().slice(klass.length).trim()
        if (token.nesting === 1) {
          // opening tag
          const title = md.renderInline(info)
          return `<div class='timeline-dot'><span class='timeline-dot-title'>${
            title
          }</span>\n`
        }
        // closing tag
        return '</div>\n'
      },
    },
  ]
}

export default MarkdownItTimeline
