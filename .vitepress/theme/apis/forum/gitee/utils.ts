import type { KyResponse } from 'ky'
import type ForumAPI from '../api'
import { getHeader } from '@/apis/utils'
import { avatarBaseURl, avatarList } from '@/composables/avatarList'
import { isArray, uniq } from 'lodash-es'
import { getForumLocaleLabelGetter } from '~/composables/getForumLocaleGetter'
import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'

import { GiteeAPIError } from '.'
import { GITEE_API_CONFIG } from './config'
import { GiteeApiErrorType } from './types'

const GITEE_DEFAULT_AVATAR_URL = 'https://gitee.com/assets/no_portrait.png'

const forumLocaleLabelGetter = getForumLocaleLabelGetter()
const topicTypeLabelGetter = getTopicTypeLabelGetter()
const topicTagLabelGetter = getTopicTagLabelGetter()

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
    username: user.name,
    avatar:
      user.avatar_url === GITEE_DEFAULT_AVATAR_URL
        ? getRandomAvatar(user.id)
        : user.avatar_url,
    homepage: user.html_url,
    id: user.id,
    login: user.login,
    ...(user.bio ? { bio: user.bio } : {}),
    ...(user.email ? { email: user.email } : {}),
    ...(user.created_at ? { createAt: new Date(user.created_at) } : {}),
    ...(user.updated_at ? { updateAt: new Date(user.updated_at) } : {}),
  }
}

export function getRandomAvatar(uuid: number) {
  return avatarBaseURl + avatarList[getUniqueIndexById(uuid, avatarList.length)]
}

function getUniqueIndexById(id: number, range: number): number {
  if (range <= 0) {
    throw new Error('Range must be a positive number.')
  }
  const positiveId = Math.abs(id)
  const hash = (positiveId * 2654435761) >>> 0 // >>> 0 确保结果是无符号整数

  return hash % range
}

export function normalizeIssueToBlog(issue: GITEE.IssueInfo): ForumAPI.Post {
  return {
    type: 'POST',
    id: issue.number,
    title: issue.title.split('%%')[0]?.trim(),
    path: issue.title.split('%%')[1]?.trim() || issue.number,
    link: issue.html_url,
    content: markdownToTextWithImages(issue.body),
    contentRaw: issue.body,
    commentCount: issue.comments,
    user: normalizeUser(issue.assignee || issue.user),
    author: normalizeUser(issue.assignee || issue.user),
    tags: filterWhitelistTags(issue.labels),
    state: issue.state,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  }
}

export function normalizeIssue(issue: GITEE.IssueInfo): ForumAPI.Topic {
  const { type, title } = getTopicTypeFromTitle(issue.title)
  const tags = filterWhitelistTags(issue.labels)

  return {
    tags,
    title,
    id: issue.number,
    type: type || 'BUG',
    content: markdownToTextWithImages(issue.body),
    contentRaw: issue.body,
    link: issue.html_url,
    commentCount: getCommentAreaState(issue.labels) ? -1 : issue.comments,
    user: normalizeUser(issue.user),
    state: issue.state,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    language: getLanguageFromLabel(issue.labels),
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

function getCommentAreaState(labels: GITEE.IssueLabel[]) {
  return labels.map(val => val.name).includes('COMMENT-CLOSED')
}

export function setFilterTags(arr: string[] = []) {
  const tags = ['WEB-FEEDBACK', ...arr]
  return tags.join(',')
}

export function isUpperCase(str: string) {
  return str.toLocaleUpperCase() === str
}

export function replaceAtMentions(text: string): string {
  const regex = /@([a-z0-9]+)(?=\s|$)/gi

  if (regex.exec(text) == null)
    return text

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
    .match(new RegExp(`^(${GITEE_API_CONFIG.TOPIC_TYPE.join('|')}):`))

  if (match) {
    const prefix = match[0].replace(':', '') as ForumAPI.TopicType
    if (prefix)
      return { type: prefix, title: title.slice(prefix.length + 1) }
  }

  return { type: null, title }
}

export function getLanguageFromLabel(label: GITEE.IssueLabel[]): string | undefined {
  if (!label || label.length === 0) {
    return undefined
  }

  const languageLabel = label
    .map(val => val && val.name)
    .find(item => item && item.startsWith('LC-'))

  if (!languageLabel) {
    return undefined
  }

  return languageLabel.split('-')[1]?.toLowerCase() || undefined
}

export function filterWhitelistTags(labels: GITEE.IssueLabel[]) {
  return labels
    .map(val => val.name)
    .filter(val => isUpperCase(val))
    .filter(
      val =>
        GITEE_API_CONFIG.STATE_TAGS.has(val)
        || forumLocaleLabelGetter.isLabel(val)
        || topicTypeLabelGetter.isLabel(val)
        || topicTagLabelGetter.isLabel(val),
    )
}

function markdownToTextWithImages(markdown?: string): {
  text: string
  images?: ForumAPI.ImageInfo[]
} {
  // 如果输入为空，返回默认值
  if (!markdown) {
    return { text: '' }
  }

  const images: ForumAPI.ImageInfo[] = []

  // 匹配 Markdown 图片语法，包括可选的 {} 元数据
  const imageRegex = /!\[(.*?)\]\((.*?)\)\s*(\{[^}]*\})?/g

  // 替换图片语法为空字符串，并提取图片信息
  let text = markdown.replace(imageRegex, (_match, altText, src, meta) => {
    let thumbHash: string | undefined
    let width: number | undefined
    let height: number | undefined

    if (meta) {
      const metaContent = meta.slice(1, -1).trim()
      const metaPairs = metaContent.split(',').map((pair: string) => pair.trim())

      metaPairs.forEach((pair: string) => {
        const [key, value] = pair.split(':').map((item: string) => item.trim())
        if (!value)
          return

        const cleanValue = value.replace(/^"|"$/g, '')

        switch (key) {
          case 'thumbhash':
            thumbHash = cleanValue
            break
          case 'width':
            width = Number(cleanValue)
            break
          case 'height':
            height = Number(cleanValue)
            break
        }
      })
    }

    images.push({
      src,
      alt: altText || undefined,
      thumbHash,
      width,
      height,
    })

    return ''
  })

  // 移除 HTML 注释（如 <!-- -->）
  text = text.replace(/<!--.*?-->/gs, '').trim()

  // 清理多余空格和换行，替换为单个空格
  text = text.replace(/\s+/g, ' ').trim()

  // 返回处理后的文本和图片信息（如果有）
  return {
    text,
    images: images.length > 0 ? images : undefined,
  }
}

export function processLabels(
  value: ForumAPI.Query['filter'],
): Record<string, string> {
  return {
    ...(value
      ? {
          labels: isArray(value)
            ? uniq(value.filter(v => v.trim() !== '')).join(',')
            : value,
        }
      : {}),
  }
}

export function extractPagination(
  params?: Record<string, any>,
  body?: Record<string, any>,
): number | null {
  return (params ? params.page : body?.page) ?? null
}

export function getGiteeApiPaginationParams(
  response: KyResponse,
): [ForumAPI.PaginationParams, undefined] | [undefined, Error] {
  const [pagination, error] = getHeader(response, ['Total_count', 'Total_page'])

  if (error) {
    return [
      undefined,
      new GiteeAPIError(GiteeApiErrorType.MissingPaginationParams),
    ]
  }

  return [
    {
      total: Number(pagination[0]),
      totalPage: Number(pagination[1]),
    },
    undefined,
  ]
}

export async function handlePagination(
  response: KyResponse,
): Promise<[ForumAPI.PaginationParams, undefined] | [undefined, Error]> {
  const [pagination, error] = getHeader(response, ['Total_count', 'Total_page'])

  if (error && !pagination) {
    return [
      undefined,
      new GiteeAPIError(GiteeApiErrorType.MissingPaginationParams),
    ]
  }

  return [
    {
      total: Number(pagination[0]),
      totalPage: Number(pagination[1]),
    },
    undefined,
  ]
}

export async function parseErrorMessage(
  response: Response,
): Promise<string | null> {
  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const { message } = (await response.json()) as { message?: string }
      return message || 'Unknown error'
    }
    return await response.text()
  }
  catch {
    console.error('Failed to parse error response')
    return null
  }
}

export default {
  normalizeUser,
  normalizeIssue,
  normalizeComment,
  processLabels,
}
