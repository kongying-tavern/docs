/** 「最近更新」的时间窗口，按天计 */
export const RECENT_UPDATE_WINDOW_DAYS = 7

/** 首页 aside 最多展示的条目数 */
export const RECENT_UPDATE_LIMIT = 5

export interface BlogUpdateEntry {
  /** 容器上的版本号（如 `Rc1.1.0`），取不到时为空 */
  label: string
  /** 该条更新的顶层条目数；只有 1 条时可以直接引用原文 */
  itemCount: number
  /** 首条更新项的纯文本 */
  summary: string
}

export interface BlogUpdateItem extends BlogUpdateEntry {
  title: string
  /** 文章在 `blog/posts` 下的路径段；loader 的 `url` 带语言前缀，不是可直接跳转的路由 */
  slug: string
  updatedAt: number
}

export interface BlogUpdatePost {
  title: string
  url: string
  content?: string
  /** 构建期从正文提取；论坛客户端无需下载全文。 */
  latestUpdate?: BlogUpdateEntry | null
  date: string
  lang: string
  gitInfo?: { lastModified?: { date?: string } } | null
}

export interface RecentUpdateOptions {
  lang: string
  now?: number
  windowDays?: number
  limit?: number
}

/** `::: timeline <info>` 容器，正文取到下一个 `:::` 行之前 */
const TIMELINE_BLOCK_RE = /^:::[ \t]*timeline([^\n]*)\n([\s\S]*?)(?=^:::)/m

/** 日期可能写在容器 info 上，也可能写在块内 `##` 子标题上（`## 2026-08-26-1413`、`## 2026-8-16 06:49`） */
const DATE_RE = /\d{4}-\d{1,2}-\d{1,2}/
const HEADING_DATE_RE = /^\d{4}-\d{1,2}-\d{1,2}/
const UPDATE_DATE_RE = /(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T-](\d{2}):?(\d{2}))?/

/** 容器 info 末尾的 `[...]` 是 dot 的 class 选项，不属于文案 */
const DOT_OPTIONS_RE = /\s*\[[^\]]*\]\s*$/
/** 版本号两侧残留的分隔符 */
const LABEL_EDGE_RE = /^[\s|:：]+|[\s|:：]+$/g

/** 顶级列表项；不匹配缩进的子项，它们属于上一条的细节 */
const BULLET_RE = /^[*-][ \t]+(\S.*)$/gm
/** 二级标题；块内 `###` 分类标题不算 */
const HEADING_RE = /^##[ \t]+(\S.*)$/gm

/** 站点自有的模板宏，只在构建期由 markdown 插件解析 */
const DEFINE_BLOCK_RE = /\{define:[^}]*\}[\s\S]*?\{\/define\}/gi
const MACRO_RE = /\{%=[^}]*%\}/g
const COLOR_TAG_RE = /\{\/?color:[^}]*\}/gi

const IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g
const LINK_RE = /\[([^\]]*)\]\([^)]*\)/g
const EMPHASIS_RE = /[*_`~]+/g
/** 要求标签名以字母开头，避免误伤 `<1KB/s` 这类正文内容 */
const HTML_TAG_RE = /<\/?[a-z][\w-]*(?:\s[^<>]*)?\/?>/gi
const WHITESPACE_RE = /\s+/g

/** git `%ci` 输出，如 `2026-08-31 14:34:33 +0800` */
const GIT_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})\s*(?:([+-])(\d{2}):?(\d{2}))?$/

/**
 * 解析 git 提交时间；`new Date()` 对该格式的解析行为依实现而异，这里显式换算时区偏移
 */
export function toTimestamp(raw?: string): number {
  if (!raw)
    return Number.NaN

  const match = raw.trim().match(GIT_DATE_RE)
  if (!match)
    return Date.parse(raw)

  const [, year, month, day, hour, minute, second, sign, offsetHour, offsetMinute] = match
  const utc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
  const offset = (Number(offsetHour ?? 0) * 60 + Number(offsetMinute ?? 0)) * (sign === '-' ? -1 : 1)
  return utc - offset * 60_000
}

export function getPostUpdatedAt(post: Pick<BlogUpdatePost, 'date' | 'gitInfo' | 'content'>): number {
  const block = post.content?.match(TIMELINE_BLOCK_RE)
  if (block) {
    const firstHeading = [...block[2].matchAll(HEADING_RE)][0]?.[1].trim()
    // 子标题表示该版本的最新热更新，优先于容器上的版本发布日期。
    const raw = firstHeading && HEADING_DATE_RE.test(firstHeading) ? firstHeading : block[1]
    const match = raw.match(UPDATE_DATE_RE)
    if (match) {
      const [, year, month, day, hour = '00', minute = '00'] = match
      // 日志使用中国本地时间；补零后显式指定时区，避免浏览器解析差异。
      const timestamp = Date.parse(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:00+08:00`)
      if (Number.isFinite(timestamp))
        return timestamp
    }
  }

  const modified = toTimestamp(post.gitInfo?.lastModified?.date)
  return Number.isFinite(modified) ? modified : toTimestamp(post.date)
}

/**
 * 取第一个 timeline 容器（最新版本在前）里最新的一条更新
 */
export function parseLatestUpdateEntry(content?: string): BlogUpdateEntry | null {
  const block = content?.match(TIMELINE_BLOCK_RE)
  if (!block)
    return null

  const label = parseContainerLabel(block[1] ?? '')
  const section = latestSection(block[2] ?? '')
  const bullets = [...section.matchAll(BULLET_RE)]

  return {
    label,
    itemCount: bullets.length,
    summary: bullets[0] ? toPlainText(bullets[0][1]) : '',
  }
}

export function selectRecentBlogUpdates(
  posts: readonly BlogUpdatePost[],
  options: RecentUpdateOptions,
): BlogUpdateItem[] {
  const {
    lang,
    now = Date.now(),
    windowDays = RECENT_UPDATE_WINDOW_DAYS,
    limit = RECENT_UPDATE_LIMIT,
  } = options
  const oldest = now - windowDays * 24 * 60 * 60 * 1000

  return posts
    .filter(post => post.lang === lang)
    .map(post => ({ post, updatedAt: getPostUpdatedAt(post) }))
    // 上限排除时钟偏移导致的未来提交
    .filter(({ updatedAt }) => Number.isFinite(updatedAt) && updatedAt >= oldest && updatedAt <= now)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
    .map(({ post, updatedAt }) => {
      const entry = post.latestUpdate === undefined ? parseLatestUpdateEntry(post.content) : post.latestUpdate
      return {
        title: post.title,
        slug: post.url.slice(post.url.lastIndexOf('/') + 1),
        updatedAt,
        label: entry?.label ?? '',
        itemCount: entry?.itemCount ?? 0,
        summary: entry?.summary ?? '',
      }
    })
}

export interface BlogUpdateCopy {
  /** 形如 `{title}：{summary}`，只有一条内容时直接引用原文 */
  quoted: string
  /** 形如 `{title}：已更新到 {version}` */
  released: string
  /** 版本号取不到时的兜底文案 */
  updated: string
}

/** 文章标题里的【】是分类标记，用在句子里读起来累赘 */
const BRACKETS_RE = /【|】/g

/**
 * 出处放在最前面：它标识这条属于哪个日志，放句尾会被窄栏的截断吃掉。
 * 有具体内容时引用它，否则只报版本号。
 */
export function describeBlogUpdate(item: BlogUpdateItem, copy: BlogUpdateCopy): string {
  const title = item.title.replace(BRACKETS_RE, '')

  if (item.itemCount === 1 && item.summary)
    return copy.quoted.replace('{title}', title).replace('{summary}', item.summary)

  return item.label
    ? copy.released.replace('{title}', title).replace('{version}', item.label)
    : copy.updated.replace('{title}', title)
}

/**
 * 块内用带日期的 `##` 子标题分段时，最新一条只是首个标题下的那段；
 * 没有这种子标题（`### 分类` 写法）时整块就是一条更新。
 */
function latestSection(body: string): string {
  const headings = [...body.matchAll(HEADING_RE)]
  const first = headings[0]
  if (!first || !HEADING_DATE_RE.test(first[1].trim()))
    return body

  // 到下一个二级标题为止，避免把更早的子条目算进这一条
  return body.slice(first.index + first[0].length, headings[1]?.index)
}

function parseContainerLabel(raw: string): string {
  const info = raw.replace(DOT_OPTIONS_RE, '').trim()
  // `Beta 6.7.3：2026-07-19` / `Rc1.1.0：` / `2026-08-28 | 标题` 三种写法去掉日期后都只剩版本号
  return toPlainText(info.replace(DATE_RE, '').replace(LABEL_EDGE_RE, ''))
}

function toPlainText(raw: string): string {
  return raw
    .replace(DEFINE_BLOCK_RE, '')
    .replace(MACRO_RE, '')
    .replace(COLOR_TAG_RE, '')
    .replace(IMAGE_RE, '')
    .replace(LINK_RE, '$1')
    .replace(HTML_TAG_RE, '')
    .replace(EMPHASIS_RE, '')
    .replace(WHITESPACE_RE, ' ')
    .trim()
}
