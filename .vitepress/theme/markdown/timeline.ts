import type MarkdownIt from 'markdown-it'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import container from 'markdown-it-container'

type ContainerArgs = [typeof container, string, { render: RenderRule }]

/** 无 | 的旧写法里自动提取的 ISO 日期 */
const ISO_DATE_RE = /\d{4}-\d{2}-\d{2}/
const OPTS_SPLIT_RE = /,/
const ICON_CLASS_RE = /^i-/

interface TimelineInfo {
  title: string
  date: string
  colorClass: string
  iconClass: string
  hasDate: boolean
}

/**
 * ::: timeline <日期|[标题]>[class]
 * | 前的内容为 dot 左侧（通常日期），| 后为 dot 右侧标题；
 * 末尾 [] 内为 dot 自定义 class（逗号分隔，i- 类渲染图标），
 * 无 | / [] 的旧写法兼容：YYYY-MM-DD 日期自动提取到 dot 左侧。
 * 注：不用 {} 是因站点 MDC/attrs 增强语法会消耗大括号。
 */
function parseTimelineInfo(rawInfo: string, klass: string): TimelineInfo {
  const info = rawInfo.trim().slice(klass.length).trim()
  const [left = '', rightPart = ''] = info.split('|').map(part => part.trim())

  let opts = ''
  let date = ''
  let title = left

  if (rightPart) {
    date = left
    title = rightPart
    if (rightPart.endsWith(']')) {
      const bracketIndex = rightPart.lastIndexOf('[')
      if (bracketIndex !== -1) {
        opts = rightPart.slice(bracketIndex + 1, -1)
        title = rightPart.slice(0, bracketIndex).trim()
      }
    }
  }
  else {
    const autoDate = left.match(ISO_DATE_RE)?.[0]
    if (autoDate) {
      date = autoDate
      title = left.replace(autoDate, '').trim()
    }
  }

  let colorClass = ''
  let iconClass = ''
  for (const token of opts.split(OPTS_SPLIT_RE)) {
    const value = token.trim()
    if (!value)
      continue
    if (ICON_CLASS_RE.test(value))
      iconClass = value
    else
      colorClass = [colorClass, value].filter(Boolean).join(' ')
  }

  return { title, date, colorClass, iconClass, hasDate: Boolean(date) }
}

/** 日期逐字符渲染以便两端对齐（月日以 / 分隔） */
const splitChars = (text: string) => Array.from(text, c => `<span class='timeline-dot-date-char'>${c}</span>`).join('')

function MarkdownItTimeline(klass: string, md: MarkdownIt): ContainerArgs {
  /** 整组无日期判定按文档缓存，避免每个块重复扫描全部 token */
  const memo: { tokens: Token[] | null, hasAnyDate: boolean } = { tokens: null, hasAnyDate: false }

  return [
    container,
    klass,
    {
      render(tokens: Token[], idx: number) {
        if (tokens[idx].nesting !== 1)
          return '</div>\n'

        if (memo.tokens !== tokens) {
          const opens = tokens.filter(candidate => candidate.type === 'container_timeline_open')
          memo.tokens = tokens
          memo.hasAnyDate = opens.some(candidate => parseTimelineInfo(candidate.info, klass).hasDate)
        }

        const parsed = parseTimelineInfo(tokens[idx].info, klass)
        const [year = '', month = '', day = ''] = parsed.date.split('-')
        const dateSpan = parsed.date
          ? `
<span class='timeline-dot-date'><span class='timeline-dot-date-year'>${splitChars(year)}</span><span class='timeline-dot-date-md'>${splitChars(month)}<span class='timeline-dot-date-char'>/</span>${splitChars(day)}</span></span>`
          : ''
        const iconSpan = parsed.iconClass
          ? `
<span class='timeline-dot-icon ${parsed.iconClass}'></span>`
          : ''
        const classNames = [
          'timeline-dot',
          memo.hasAnyDate ? '' : 'timeline-dot-concise',
          parsed.colorClass,
        ].filter(Boolean).join(' ')

        return `<div class='${classNames}'>${dateSpan}
<h2 class='timeline-dot-title title'>${
  parsed.title ? md.renderInline(parsed.title) : ''
}</h2>${iconSpan}
`
      },
    },
  ]
}

export default MarkdownItTimeline
