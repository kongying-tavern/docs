export const SAFE_FORUM_URI_REGEX = /^(?!\/\/)(?:https?:|\.{0,2}\/|#)/i
const RELATIVE_FORUM_URI_REGEX = /^(?:\.{0,2}\/|#)/u
const FORUM_SITE_ORIGIN = 'https://yuanshen.site'
export const FORUM_LINK_HOST_ALLOWLIST = ['yuanshen.site', 'gitee.com', 'github.com'] as const
const FORUM_MENTION_LOGIN_REGEX = /^[\dA-Z][\w-]{0,63}$/i
const AUTO_LINK_DISPLAY_LENGTH = 48
const AUTO_LINK_PROTOCOL_REGEX = /^https?:\/\//i

export function isAllowedForumHref(href: string): boolean {
  if (!isSafeForumHref(href))
    return false
  try {
    const url = new URL(href, FORUM_SITE_ORIGIN)
    if (!['http:', 'https:'].includes(url.protocol))
      return false
    if (RELATIVE_FORUM_URI_REGEX.test(href) && url.origin !== FORUM_SITE_ORIGIN)
      return false
    const hostname = url.hostname.toLowerCase()
    return FORUM_LINK_HOST_ALLOWLIST.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
  }
  catch {
    return false
  }
}

export function isSafeForumHref(href: string): boolean {
  return SAFE_FORUM_URI_REGEX.test(href)
}

export function getForumMentionHref(login: string): string | undefined {
  return FORUM_MENTION_LOGIN_REGEX.test(login)
    ? `https://gitee.com/${encodeURIComponent(login)}`
    : undefined
}

export function shortenForumAutoLink(href: string): string {
  if ([...href].length <= AUTO_LINK_DISPLAY_LENGTH)
    return href
  const withoutProtocol = href.replace(AUTO_LINK_PROTOCOL_REGEX, '')
  const characters = [...withoutProtocol]
  return characters.length <= AUTO_LINK_DISPLAY_LENGTH
    ? withoutProtocol
    : `${characters.slice(0, AUTO_LINK_DISPLAY_LENGTH - 1).join('')}…`
}
