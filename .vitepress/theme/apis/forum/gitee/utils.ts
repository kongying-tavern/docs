import type { KyResponse } from 'ky'
import type ForumAPI from '../api'
import { isArray, uniq } from 'lodash-es'
import { avatarBaseURl, avatarList } from '@/composables/avatarList'
import { getForumLocaleLabelGetter } from '~/composables/getForumLocaleGetter'
import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { decodeCommentBody, decodeTopicBody } from '~/services/forum/forumContentCodec'

import { GITEE_API_CONFIG } from './config'

const GITEE_DEFAULT_AVATAR_URL = 'https://gitee.com/assets/no_portrait.png'

/** Matches a page number in API pagination links */
const PAGE_QUERY_PARAM_REGEX = /[?&](?:page|current)=([^&>]+)/

/** Matches the last-page relation in API pagination links */
const LAST_PAGE_REL_REGEX = /rel="?last"?/

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
  const decoded = decodeTopicBody(issue.body)
  return {
    type: 'POST',
    id: issue.number,
    title: issue.title.split('%%')[0]?.trim(),
    path: issue.title.split('%%')[1]?.trim() || issue.number,
    link: issue.html_url,
    content: {
      text: decoded.content.text,
      ...(decoded.attachments ? { images: decoded.attachments } : {}),
    },
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
  const decoded = decodeTopicBody(issue.body)

  return {
    tags,
    title,
    id: issue.number,
    type: type || 'BUG',
    content: {
      text: decoded.content.text,
      ...(decoded.attachments ? { images: decoded.attachments } : {}),
    },
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
  const decoded = decodeCommentBody(comment.body)
  return {
    id: comment.id,
    content: {
      text: decoded.content.kind === 'tiptap'
        ? JSON.stringify(decoded.content.doc)
        : decoded.content.text,
      ...(decoded.attachments ? { images: decoded.attachments } : {}),
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

export function isUpperCase(str: string) {
  return str.toLocaleUpperCase() === str
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

/**
 * 从响应头解析分页参数（Gitee 的 Total_count/Total_page 头，
 * 或 GitHub 风格 Link 头中的 last 页）。解析不到时返回 undefined。
 */
export function extractPaginationParams(
  response: KyResponse,
): ForumAPI.PaginationParams | undefined {
  const total = getNumericHeader(response, ['Total_count', 'X-Total-Count'])
  const totalPage
    = getNumericHeader(response, ['Total_page', 'X-Total-Page', 'X-Total-Pages'])
      ?? getLastPageFromLinkHeader(response.headers.get('Link'))

  if (total === undefined && totalPage === undefined)
    return undefined

  return {
    total: total ?? 0,
    totalPage: totalPage ?? 0,
  }
}

function getNumericHeader(response: KyResponse, headerNames: string[]): number | undefined {
  for (const headerName of headerNames) {
    const value = response.headers.get(headerName)
    if (!value)
      continue

    const numericValue = Number(value)
    if (Number.isFinite(numericValue))
      return numericValue
  }
}

function getLastPageFromLinkHeader(linkHeader: string | null): number | undefined {
  if (!linkHeader)
    return undefined

  const lastLink = linkHeader
    .split(',')
    .find(link => LAST_PAGE_REL_REGEX.test(link))

  const page = lastLink?.match(PAGE_QUERY_PARAM_REGEX)?.[1]
  if (!page)
    return undefined

  const numericPage = Number(page)
  return Number.isFinite(numericPage) ? numericPage : undefined
}
