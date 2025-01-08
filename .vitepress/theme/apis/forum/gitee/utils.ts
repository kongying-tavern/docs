import { useUserInfoStore } from '@/stores/useUserInfo'
import { STATE_TAGS, TOPIC_TYPE, issues } from '.'
import type ForumAPI from '../api'

export function normalizeAuth(auth: GITEE.Auth): ForumAPI.Auth {
  return {
    accessToken: auth.access_token,
    createdAt: auth.created_at,
    expiresIn: auth.expires_in,
    refreshToken: auth.refresh_token,
    scope: auth.scope,
    tokenType: auth.token_type,
  }
}
export function normalizeUser(user: GITEE.User): ForumAPI.User {
  return {
    username: user.login,
    avatar: user.avatar_url,
    homepage: user.html_url,
    id: user.id,
    login: user.login,
  }
}

export function normalizeIssue(issue: GITEE.IssueInfo): ForumAPI.Topic {
  const { type, title } = getTopicTypeFromTitle(issue.title)
  return {
    id: issue.number,
    title: title,
    content: markdownToTextWithImages(issue.body),
    contentRaw: issue.body,
    link: issue.html_url,
    commentCount: issue.comments,
    user: normalizeUser(issue.user),
    tags: excludeStateTags(issue.labels),
    type: type,
    state: issue.state,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  }
}

export function normalizeComment(comment: GITEE.Comment): ForumAPI.Comment {
  const { text, images } = markdownToTextWithImages(comment.body)
  return {
    id: comment.id,
    content: {
      text: replaceAtMentions(text),
      images,
    },
    contentRaw: comment.body,
    author: normalizeUser(comment.user),
    createdAt: comment.created_at,
    updatedAt: comment.updated_at || '',
    replyID: comment.in_reply_to_id || null,
    reactions: null,
  }
}

export function setFilterTags(arr: string[] = []) {
  const tags = ['WEB-FEEDBACK', ...arr]
  return tags.join(',')
}

export function isUpperCase(str: string) {
  return str.toLocaleUpperCase() === str
}

export function replaceAtMentions(text: string): string {
  const regex = /@([a-zA-Z0-9]+)(?=\s|$)/g

  if (regex.exec(text) == null) return text

  return text.replaceAll(regex, (match, p1) => {
    return `<a class="vp-link" href="https://gitee.com/${encodeURIComponent(p1)}" target="${p1}">@${p1}</a>`
  })
}

function getTopicTypeFromTitle(title: string): {
  type: ForumAPI.TopicType
  title: string
} {
  const match = title
    .toLocaleUpperCase()
    .match(RegExp(`^(${TOPIC_TYPE.join('|')}):`))

  if (match) {
    const prefix = match[0].replace(':', '') as ForumAPI.TopicType
    if (prefix) return { type: prefix, title: title.slice(prefix.length + 1) }
  }

  return { type: null, title: title }
}

export function excludeStateTags(labels: GITEE.IssueLabel[]) {
  return labels
    .map((val) => val.name)
    .filter((val) => isUpperCase(val))
    .filter((val) => !STATE_TAGS.has(val))
}

function markdownToTextWithImages(markdown?: string): {
  text: string
  images?: ForumAPI.ImageInfo[]
} {
  if (!markdown) return { text: '' }

  const images: ForumAPI.ImageInfo[] = []
  const imageRegex = /!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\s*\)/g

  let text = markdown.replace(imageRegex, (match, altText, src, title) => {
    images.push({ src, alt: altText || undefined, title: title || undefined })
    return altText ? altText : ''
  })

  text = text.replace(/\s+/g, ' ').trim()

  return { text, images: images.length > 0 ? images : undefined }
}

export function extractOfficialAndAuthorComments(
  issue: GITEE.IssueInfo,
  commentList: GITEE.CommentList,
): ForumAPI.Comment[] | null {
  const userInfoStore = useUserInfoStore()

  const comments: ForumAPI.Comment[] = []
  const relatedComments = commentList.filter(
    (comment) => comment.target.issue.id === issue.id,
  )
  // 查找作者的评论
  const authorComment = relatedComments.find(
    (comment) => comment.user.id === issue.user.id,
  )
  // 查找官方团队的评论
  const officialComment = relatedComments.find((comment) =>
    userInfoStore.isTeamMember(comment.user.id),
  )

  if (authorComment) comments.push(normalizeComment(authorComment))
  if (officialComment) comments.push(normalizeComment(officialComment))

  return comments.length > 0 ? comments : null
}

function filterLinks(str: string, whitelist: string[]): string {
  const isWhitelisted = (text: string): boolean => {
    return whitelist.some((regex: string) => new RegExp(regex).test(text))
  }

  const maskUrl = (url: string): string => {
    return url.replace(
      /([a-zA-Z]+:\/\/|\/\/)?([a-zA-Z0-9.-]+)([^\s]*)/,
      (match, protocol = '', domain, path) => {
        if (isWhitelisted(domain)) return match // 白名单域名保持不变
        return `${protocol}${'*'.repeat(domain.length)}${'*'.repeat(path.length)}`
      },
    )
  }

  return (
    str
      // 处理 Markdown 图片链接
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g, (match, alt, url) => {
        const domainMatch = url.match(
          /(?:[a-zA-Z]+:\/\/|\/\/)?([a-zA-Z0-9.-]+)/,
        )
        const domain = domainMatch ? domainMatch[1] : ''
        const maskedAlt = isWhitelisted(alt) ? alt : '图片违规' // 替换 alt
        const maskedUrl = maskUrl(url)
        return `![${maskedAlt}](${maskedUrl})` // 替换 alt 和链接
      })
      // 处理 Markdown 普通链接
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
        (match, text, url) => `[${text}](${maskUrl(url)})`,
      )
      // 处理普通链接（支持无协议链接）
      .replace(
        /(^|[^!])((?:[a-zA-Z]+:\/\/|\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}([^\s]*))/g,
        (match, prefix, url) => `${prefix}${maskUrl(url)}`,
      )
  )
}

export default {
  normalizeUser,
  normalizeIssue,
  normalizeComment,
}
