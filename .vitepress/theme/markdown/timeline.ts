import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import container from 'markdown-it-container'

type ContainerArgs = [typeof container, string, { render: RenderRule }]

/** MarkdownIt or MarkdownItAsync (used by VitePress 2.0) */
interface MarkdownInstance {
  renderInline: (src: string) => string
}

function MarkdownItTimeline(klass: string, md: MarkdownInstance): ContainerArgs {
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
          return `<div class='timeline-dot'><span class='timeline-dot-title title'>${
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
