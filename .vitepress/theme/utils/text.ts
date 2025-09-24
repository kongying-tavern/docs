/**
 * 文本处理工具函数
 * 统一处理HTML转义、文本格式化、字符串操作等
 */

/**
 * HTML字符转义 - 防止XSS攻击
 */
export function escapeHtml(unsafeHTML: string): string {
  return unsafeHTML
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#039;')
}

/**
 * 简化版HTML转义 - 用于基本场景
 */
export function escapeHtmlBasic(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/&(?![\w#]+;)/g, '&amp;')
}

/**
 * HTML内容清理 - 移除HTML标签，保留纯文本
 */
export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') {
    // SSR环境下的简单清理
    return html.replace(/<[^>]*>/g, '')
  }

  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * 文本截断，添加省略号
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * 智能截断 - 在单词边界处截断
 */
export function truncateAtWord(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text
  }

  const truncated = text.substring(0, maxLength - suffix.length)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + suffix
  }

  return truncated + suffix
}

/**
 * 驼峰命名转换
 */
export function camelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * 蛇形命名转驼峰
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * 驼峰转蛇形命名
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * 驼峰转短横线命名
 */
export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
}

/**
 * 短横线转驼峰命名
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * 生成slug（URL友好的字符串）
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 空格和下划线转为短横线
    .replace(/^-+|-+$/g, '') // 移除首尾的短横线
}

/**
 * 首字母大写
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 每个单词首字母大写
 */
export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, txt =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

/**
 * 移除HTML标签
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * 提取纯文本内容
 */
export function extractPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return stripHtml(html)
  }

  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

/**
 * 字符串hash函数
 */
export function hash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash &= hash // Convert to 32bit integer
  }
  return hash
}

/**
 * 生成随机字符串
 */
export function randomString(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 检查字符串是否为空
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0
}

/**
 * 安全的字符串比较（忽略大小写）
 */
export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

/**
 * 移除字符串前后的指定字符
 */
export function trim(str: string, chars = ' \t\r\n'): string {
  const charSet = new Set(chars)
  let start = 0
  let end = str.length

  while (start < end && charSet.has(str[start])) {
    start++
  }

  while (end > start && charSet.has(str[end - 1])) {
    end--
  }

  return str.slice(start, end)
}
