import type { LocaleRoute } from '../../../.vitepress/routes'
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import { getLangPath } from '@/utils'
import { routes } from '../../../.vitepress/routes'

function useSiteInfo() {
  const { site, page, localeIndex } = useData()

  return {
    // 基础响应式数据
    site,
    page,
    localeIndex,

    // 派生的计算属性
    origin: computed(() => {
      if (typeof window !== 'undefined')
        return window.location.origin
      return 'https://yuanshen.site'
    }),

    // URL 构建器
    buildUrl: computed(() => (path: string, locale?: string) => {
      const targetLocale = locale || localeIndex.value
      const langPath = getLangPath(targetLocale)
      const fullPath = withBase(`${langPath}${path}`)
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yuanshen.site'
      return `${origin}${fullPath}`
    }),
  }
}

// ============================================================================
// URL 模式匹配
// ============================================================================

/**
 * 动态生成 URL 匹配模式，基于 VitePress 路由配置和 base 配置
 */
function createUrlPatterns() {
  const siteInfo = useSiteInfo()
  const base = siteInfo.site.value.base || '/'

  // 移除末尾的斜杠并确保以斜杠开始
  const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '')

  // 从路由配置中提取匹配模式
  const topicRoute = routes.find((route: LocaleRoute) => route.match === 'feedback/topic/:id')
  const userRoute = routes.find((route: LocaleRoute) => route.match.startsWith('feedback/user/:id'))

  // 将路由模式转换为正则表达式
  const topicPattern = topicRoute?.match.replace(':id', '([A-Z0-9]+)')
  const userPattern = userRoute?.match.replace(':id', '([^/]+)').replace('{/:type}', '(?:/[^/]+)?')

  return {
    topic: topicPattern ? new RegExp(`^${normalizedBase}/${topicPattern}$`) : null,
    user: userPattern ? new RegExp(`^${normalizedBase}/${userPattern}$`) : null,
    docs: new RegExp(`^${normalizedBase}/(.+)$`),
  }
}

type ParsedUrlInfo
  = | { type: 'topic', id: string, originalUrl: string }
    | { type: 'user', id: string, originalUrl: string }
    | { type: 'docs', path: string, originalUrl: string }
    | { type: 'unknown', originalUrl: string }

// ============================================================================
// 核心功能函数
// ============================================================================

/**
 * 检查是否是本站链接
 */
export function isSiteUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'yuanshen.site'

    return urlObj.hostname === currentDomain
      || urlObj.hostname.endsWith(`.${currentDomain}`)
      || (currentDomain === 'localhost' && ['localhost', '127.0.0.1'].includes(urlObj.hostname))
      || (currentDomain === '127.0.0.1' && ['localhost', '127.0.0.1'].includes(urlObj.hostname))
  }
  catch {
    return false
  }
}

/**
 * 解析本站 URL 类型和参数
 */
export function parseSiteUrl(url: string): ParsedUrlInfo {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const patterns = createUrlPatterns()

    // 检查是否为主题链接
    if (patterns.topic) {
      const topicMatch = pathname.match(patterns.topic)
      if (topicMatch) {
        return { type: 'topic', id: topicMatch[1], originalUrl: url }
      }
    }

    // 检查是否为用户链接
    if (patterns.user) {
      const userMatch = pathname.match(patterns.user)
      if (userMatch) {
        return { type: 'user', id: userMatch[1], originalUrl: url }
      }
    }

    // 检查是否为文档链接
    const docsMatch = pathname.match(patterns.docs)
    if (docsMatch) {
      return { type: 'docs', path: docsMatch[1], originalUrl: url }
    }

    return { type: 'unknown', originalUrl: url }
  }
  catch {
    return { type: 'unknown', originalUrl: url }
  }
}

/**
 * 根据链接类型生成显示文本
 */
export function generateDisplayText(urlInfo: ParsedUrlInfo): string {
  switch (urlInfo.type) {
    case 'topic':
      return `#${urlInfo.id}`
    case 'user':
      return `@${urlInfo.id}`
    case 'docs':
      return getPageDisplayText(urlInfo.path)
    default:
      return urlInfo.originalUrl
  }
}

/**
 * 获取页面显示文本
 * 生成基于路径的友好显示文本，对于根路径使用 VitePress 站点标题
 */
function getPageDisplayText(path: string): string {
  const normalizedPath = path.replace(/\/$/, '')

  // 如果是根路径，从 VitePress 获取站点标题
  const segments = normalizedPath.split('/').filter(Boolean)
  if (segments.length === 0) {
    try {
      const siteInfo = useSiteInfo()
      return siteInfo.site.value.title || 'Home'
    }
    catch {
      return 'Home'
    }
  }

  // 使用最后一个路径段作为显示文本
  const lastSegment = segments[segments.length - 1]

  // 转换为友好的显示格式
  return lastSegment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * 转换本站链接为简化格式
 */
export function convertSiteUrl(url: string): { displayText: string, href: string } {
  if (!isSiteUrl(url)) {
    return { displayText: url, href: url }
  }

  const urlInfo = parseSiteUrl(url)
  const displayText = generateDisplayText(urlInfo)

  return { displayText, href: url }
}

// ============================================================================
// 题目 ID 相关功能
// ============================================================================

/**
 * 检查是否是有效的题目 ID
 */
export function isValidTopicId(id: string): boolean {
  return /^[A-Z0-9]{6}$/.test(id)
}

/**
 * 解析 #XXXXXX 格式的题目 ID
 */
export function parseTopicId(text: string): string | null {
  const match = text.match(/^#([A-Z0-9]{6})$/)
  return match ? match[1] : null
}

/**
 * 根据题目 ID 生成完整的题目链接
 */
export function generateTopicUrl(topicId: string): string {
  const siteInfo = useSiteInfo()
  return siteInfo.buildUrl.value(`/feedback/topic/${topicId}`)
}

// ============================================================================
// 页面标题获取
// ============================================================================

/**
 * 异步获取页面标题
 */
export async function fetchPageTitle(url: string): Promise<string> {
  try {
    const siteInfo = useSiteInfo()
    const currentPagePath = siteInfo.page.value.relativePath.replace(/\.md$/, '.html')
    const currentPageUrl = siteInfo.buildUrl.value(`/${currentPagePath}`)

    // 如果是当前页面，直接返回页面标题
    if (url === currentPageUrl) {
      return siteInfo.page.value.title || siteInfo.page.value.frontmatter?.title || 'Untitled'
    }
  }
  catch {
    // VitePress API 不可用时继续
  }

  try {
    const response = await fetch(url, { method: 'GET', mode: 'cors' })
    if (!response.ok)
      throw new Error('Failed to fetch page')

    const html = await response.text()
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i)

    if (titleMatch) {
      return titleMatch[1].trim()
    }

    const urlInfo = parseSiteUrl(url)
    return generateDisplayText(urlInfo)
  }
  catch {
    const urlInfo = parseSiteUrl(url)
    return generateDisplayText(urlInfo)
  }
}
