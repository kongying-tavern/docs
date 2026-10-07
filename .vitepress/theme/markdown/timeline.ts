import type MarkdownIt from 'markdown-it'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import container from 'markdown-it-container'

type ContainerArgs = [typeof container, string, { render: RenderRule }]

/** 无 | 的旧写法里自动提取的 ISO 日期 */
const ISO_DATE_RE = /\d{4}-\d{2}-\d{2}/
const OPTS_SPLIT_RE = /,/
const ICON_CLASS_RE = /^i-/
const SLUG_RE = /[^\w\p{Script=Han}]+/gu
const SLUG_EDGE_RE = /^-+|-+$/g

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

/** 清除 timeline 容器内内容标题的 id（避免进入官方大纲/LocalNav），dot 标题由渲染器输出语义 id */
type MarkdownInstance = Pick<MarkdownIt, 'renderInline' | 'renderer'>

// 放在渲染阶段而非 core 规则：core 规则会与 VitePress 的锚点规则争执行顺序，
// 一旦插件被重复注册（锚点跑第二遍），第二遍锚点就会把清空的 id 当作重复的自定义 id 中断构建。
function patchTimelineHeadingIds(md: MarkdownInstance, klass: string) {
  const openType = `container_${klass}_open`
  const closeType = `container_${klass}_close`
  const render = md.renderer.render.bind(md.renderer)
  md.renderer.render = (tokens, options, env) => {
    let depth = 0
    for (const token of tokens) {
      if (token.type === openType) {
        depth++
        continue
      }
      if (token.type === closeType) {
        depth--
        continue
      }
      if (depth > 0 && token.type === 'heading_open')
        token.attrSet('id', '')
    }
    return render(tokens, options, env)
  }
}

function MarkdownItTimeline(klass: string, md: MarkdownInstance): ContainerArgs {
  patchTimelineHeadingIds(md, klass)

  /** 整组无日期判定按文档缓存，避免每个块重复扫描全部 token */
  const memo: { tokens: Token[] | null, hasAnyDate: boolean, dotIndex: number, lastYear: string } = { tokens: null, hasAnyDate: false, dotIndex: 0, lastYear: '' }

  return [
    container,
    klass,
    {
      render(tokens: Token[], idx: number, _options, env) {
        if (tokens[idx].nesting !== 1)
          return '</div>\n'

        if (memo.tokens !== tokens) {
          const opens = tokens.filter(candidate => candidate.type === 'container_timeline_open')
          memo.tokens = tokens
          memo.hasAnyDate = opens.some(candidate => parseTimelineInfo(candidate.info, klass).hasDate)
          memo.lastYear = ''
          memo.dotIndex = 0
        }

        const parsed = parseTimelineInfo(tokens[idx].info, klass)
        // dot 标题带语义 id（大纲/锚点用），无标题时回退日期、再回退序号
        const slugBase = (parsed.title || parsed.date).toLowerCase().replace(SLUG_RE, '-').replace(SLUG_EDGE_RE, '')
        const dotId = slugBase || `tl-${memo.dotIndex++}`
        const [year = '', month = '', day = ''] = parsed.date.split('-')
        const startsYear = Boolean(year && year !== memo.lastYear)
        if (year)
          memo.lastYear = year
        const pathLocale = String(env?.relativePath || '').replaceAll('\\', '/').split('/')[0]
        const locale = pathLocale === 'en' ? 'en-US' : pathLocale === 'ja' ? 'ja-JP' : 'zh-CN'
        const dateValue = new Date(`${parsed.date}T00:00:00Z`)
        const validDate = parsed.hasDate && !Number.isNaN(dateValue.getTime())
        const dateFormat = { timeZone: 'UTC', month: 'short', day: 'numeric' } as const
        const localizedDate = validDate
          ? new Intl.DateTimeFormat(locale, { ...dateFormat, year: 'numeric' }).format(dateValue)
          : parsed.date
        const monthDay = validDate
          ? new Intl.DateTimeFormat(locale, dateFormat).formatToParts(dateValue).map(part => `<span class='timeline-dot-date-part timeline-dot-date-${part.type}'>${part.value}</span>`).join('')
          : `${splitChars(month)}<span class='timeline-dot-date-char'>/</span>${splitChars(day)}`
        const dateSpan = parsed.date
          ? `
<time class='timeline-dot-date' datetime='${parsed.date}' aria-label='${localizedDate}'><span class='timeline-dot-date-full'>${localizedDate}</span><span class='timeline-dot-date-year'>${splitChars(year)}</span><span class='timeline-dot-date-md'>${monthDay}</span></time>`
          : ''
        const iconSpan = parsed.iconClass
          ? `
<span class='timeline-dot-icon ${parsed.iconClass}'></span>`
          : ''
        const classNames = [
          'timeline-dot',
          memo.hasAnyDate ? '' : 'timeline-dot-concise',
          startsYear ? 'timeline-dot-year-start' : '',
          parsed.colorClass,
        ].filter(Boolean).join(' ')

        const titleHtml = parsed.title
          ? md.renderInline(parsed.title)
          : parsed.date
            ? `<span class='timeline-dot-sr'>${parsed.date}</span>`
            : ''
        const yearBackdrop = startsYear
          ? `<span class='timeline-dot-year-backdrop' aria-hidden='true'>${year}</span>`
          : ''
        return `<div class='${classNames}'>${yearBackdrop}${dateSpan}
<h2 class='timeline-dot-title title' id='${dotId}'>${titleHtml}</h2>${iconSpan}
`
      },
    },
  ]
}

export default MarkdownItTimeline
