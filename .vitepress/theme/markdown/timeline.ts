import container from 'markdown-it-container'
import dayjs from 'dayjs'

import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token'
import type { RenderRule } from 'markdown-it/lib/renderer'

export const getdefaultTime = () => {
  return dayjs().format('YYYY-MM-DD')
}

export const timeline = (md: MarkdownIt, options: any) => {
  md.use(...createContainer('timeline', getdefaultTime(), md))
}

type ContainerArgs = [typeof container, string, { render: RenderRule }]
const createContainer = (
  klass: string,
  defaultTime: string,
  md: MarkdownIt,
): ContainerArgs => {
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
          return (
            "<div class='timeline-dot'><span class='timeline-dot-title'>" +
            title +
            '</span>\n'
          )
        } else {
          // closing tag
          return '</div>\n'
        }
      },
    },
  ]
}
