/**
 * 站点的 canonical 域名、base 与 Gitee/GitHub profile 构造规则。
 * OAuth 回跳、reaction 环境判定、链接策略与头像资源都从这里取，
 * 域名或 base 变更只需改这一处。
 */
export const SITE_ORIGIN = 'https://yuanshen.site'
export const SITE_BASE = '/docs'
export const ASSET_ORIGIN = 'https://assets.yuanshen.site'
export const API_ORIGIN = 'https://api.yuanshen.site'

export const GITEE_ORIGIN = 'https://gitee.com'
export const GITHUB_ORIGIN = 'https://github.com'

/** 拼接站点页面地址，path 必须以 `/` 开头（如 `/imgs/common/logo.png`）。 */
export function getSiteHref(path: string): string {
  return `${SITE_ORIGIN}${SITE_BASE}${path}`
}

/** Gitee 用户主页，login 按 URL 规则编码。 */
export function getGiteeProfileHref(login: string): string {
  return `${GITEE_ORIGIN}/${encodeURIComponent(login)}`
}

/** Gitee 消息中心（用户 id）。 */
export function getGiteeMessagesHref(userId: string | number): string {
  return `${GITEE_ORIGIN}/notifications/messages/${userId}`
}
