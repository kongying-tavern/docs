import type { UploadedUserFile } from '~/composables/useImageUpload'
import { format, formatDistance, formatRelative, isToday, isYesterday, parseISO } from 'date-fns'
import { enUS, ja, zhCN } from 'date-fns/locale'
import { PATTERNS } from '../constants'

// Date formatting utilities
const LOCALE_MAP = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja': ja,
} as const

export function formatForumDate(
  date: string | Date,
  locale: keyof typeof LOCALE_MAP = 'zh-CN',
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const localeObj = LOCALE_MAP[locale]

  if (isToday(dateObj)) {
    return format(dateObj, 'HH:mm', { locale: localeObj })
  }

  if (isYesterday(dateObj)) {
    return `昨天 ${format(dateObj, 'HH:mm', { locale: localeObj })}`
  }

  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff < 7) {
    return formatDistance(dateObj, now, { locale: localeObj, addSuffix: true })
  }

  return format(dateObj, 'yyyy-MM-dd', { locale: localeObj })
}

export function formatRelativeDate(
  date: string | Date,
  locale: keyof typeof LOCALE_MAP = 'zh-CN',
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const localeObj = LOCALE_MAP[locale]

  return formatRelative(dateObj, new Date(), { locale: localeObj })
}

// Text formatting utilities
export function formatPlainText(text: string): string {
  if (!text)
    return ''

  // Remove HTML tags but preserve line breaks
  const htmlToNewline = text
    .replace(/<\s*(br|p|div|li|tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{2,}/g, '\n')

  // Decode HTML entities
  const htmlEntityDecode = htmlToNewline.replace(
    /&(#\d+|#x[\da-f]+|[a-z]+);/gi,
    (entity) => {
      const textarea = document.createElement('textarea')
      textarea.innerHTML = entity
      return textarea.value
    },
  )

  // Remove Markdown syntax
  const markdownToPlainText = htmlEntityDecode
    .replace(/([*_]{1,3}|~{2}|`{1,3}|#+|!\[|[\][()>])/g, '')
    .replace(/\s*[-+*] /g, '')
    .replace(/\n{2,}/g, '\n')

  return markdownToPlainText.trim()
}

export function formatMarkdownImages(uploadedImages: UploadedUserFile[]): string {
  if (!uploadedImages.length)
    return ''

  return `\n${uploadedImages
    .map(({ url, thumbHash, alt }) => {
      const thumbHashStr = thumbHash
        ? `{thumbhash:"${thumbHash.dataBase64}",width:"${thumbHash.width}",height:"${thumbHash.height}"}`
        : ''
      return `![${alt || 'Uploaded image'}](${url})${thumbHashStr}`
    })
    .join('\n')}`
}

export function formatAtMentions(text: string): string {
  return text.replaceAll(PATTERNS.AT_MENTION, (_match, username) => {
    const encodedUsername = encodeURIComponent(username)
    return `<a class="vp-link" href="https://gitee.com/${encodedUsername}" target="${username}">@${username}</a>`
  })
}

// Number formatting utilities
export function formatCount(count: number): string {
  if (count < 1000)
    return count.toString()
  if (count < 10000)
    return `${(count / 1000).toFixed(1)}k`
  if (count < 1000000)
    return `${Math.floor(count / 1000)}k`
  return `${(count / 1000000).toFixed(1)}M`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

// URL formatting utilities
export function formatTopicUrl(topicId: string | number, topicType: string = ''): string {
  const baseUrl = location.origin + location.pathname.replace(/\/[^/]*$/, '')

  if (topicType === 'POST') {
    return `${baseUrl}/blog/${topicId}`
  }

  return `${baseUrl}/feedback/topic/${topicId}`
}

export function formatUserProfileUrl(username: string): string {
  const baseUrl = location.origin + location.pathname.replace(/\/[^/]*$/, '')
  return `${baseUrl}/feedback/user/${username}`
}

// Content processing utilities
export function extractEmojiFromHtml(html: string): string[] {
  const matches = Array.from(html.matchAll(PATTERNS.EXTRACT_EMOJI))
  return matches.map(match => match[1])
}

export function replaceEmojiInText(text: string, emojiMap: Record<string, string>): string {
  return text.replace(PATTERNS.EMOJI, (match, emojiCode) => {
    return emojiMap[emojiCode] || match
  })
}

// Utility functions
export function truncateWithEllipsis(text: string, maxLength: number): string {
  if (text.length <= maxLength)
    return text
  return `${text.slice(0, maxLength - 3)}...`
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

export function camelToKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}
