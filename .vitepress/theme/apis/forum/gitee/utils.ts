/* eslint-disable regexp/no-super-linear-backtracking */
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
    username: user.login,
    avatar:
      user.avatar_url === GITEE_DEFAULT_AVATAR_URL
        ? getRandomAvatar(user.id)
        : user.avatar_url,
    homepage: user.html_url,
    id: user.id,
    login: user.login,
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

export function normalizeIssueToBlog(issue: GITEE.IssueInfo): ForumAPI.Topic {
  const { type, title } = getTopicTypeFromTitle(issue.title)
  return {
    id: issue.number,
    title,
    content: markdownToTextWithImages(issue.body),
    contentRaw: issue.body,
    link: issue.html_url,
    commentCount: issue.comments,
    user: normalizeUser(issue.assignee || issue.user),
    tags: filterWhitelistTags(issue.labels),
    type,
    state: issue.state,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  }
}

export function normalizeIssue(issue: GITEE.IssueInfo): ForumAPI.Topic {
  const { type, title } = getTopicTypeFromTitle(issue.title)
  return {
    id: issue.number,
    title,
    content: markdownToTextWithImages(issue.body),
    contentRaw: issue.body,
    link: issue.html_url,
    commentCount: issue.comments,
    user: normalizeUser(issue.user),
    tags: filterWhitelistTags(issue.labels),
    type,
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
  if (!markdown)
    return { text: '' }

  const images: ForumAPI.ImageInfo[] = []
  const imageRegex = /!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\s*\)/g

  let text = markdown.replace(imageRegex, (match, altText, src, title) => {
    images.push({ src, alt: altText || undefined, title: title || undefined })
    return altText || ''
  })

  text = text.replace(/\s+/g, ' ').trim()

  return { text, images: images.length > 0 ? images : undefined }
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
