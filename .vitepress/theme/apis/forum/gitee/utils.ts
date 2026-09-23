import type { KyResponse } from 'ky'
import type ForumAPI from '../api'
import { isArray, uniq } from 'lodash-es'
import { avatarBaseURl, avatarList } from '@/composables/avatarList'
import { getForumLocaleLabelGetter } from '~/composables/getForumLocaleGetter'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { decodeCommentBody, decodeTopicBody, stripMarkdownImages } from '~/services/forum/forumContentCodec'
import { isCategoryLabel } from '~/services/forum/forumLabel'
import { normalizeQuotedTopicReference } from '~/services/forum/forumTopicQuote'
import { getTopicStatus, getTopicStatusFromLabel } from '~/services/forum/forumTopicStatus'

import { GITEE_API_CONFIG, GITEE_ISSUE_STATE_TITLES } from './config'

const GITEE_DEFAULT_AVATAR_URL = 'https://gitee.com/assets/no_portrait.png'

/** Matches a page number in API pagination links */
const PAGE_QUERY_PARAM_REGEX = /[?&](?:page|current)=([^&>]+)/

/** Matches the last-page relation in API pagination links */
const LAST_PAGE_REL_REGEX = /rel="?last"?/

const forumLocaleLabelGetter = getForumLocaleLabelGetter()
const topicTypeLabelGetter = getTopicTypeLabelGetter()

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

/** 无权限账号的部分接口响应可能缺失 user/labels 等字段，统一兜底避免解析时抛错 */
const EMPTY_USER: ForumAPI.User = { username: '', avatar: '', homepage: '', id: 0, login: '' }

export function normalizeUser(user?: GITEE.User): ForumAPI.User {
  if (!user)
    return EMPTY_USER

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
  const labels = filterWhitelistTags(issue.labels)
  return {
    type: 'POST',
    id: issue.number,
    title: stripMarkdownImages(issue.title.split('%%')[0]?.trim() ?? ''),
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
    labels,
    // 反馈标签按前缀识别，不依赖静态映射表（管理页可动态增删 CATA- 标签）
    tags: labels.filter(isCategoryLabel),
    status: getTopicStatus(labels),
    goodIssue: labels.includes('GOOD-ISSUE'),
    state: issue.state,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  }
}

export function normalizeIssue(issue: GITEE.IssueInfo): ForumAPI.Topic {
  const { type, title } = getTopicTypeFromTitle(issue.title)
  const labels = filterWhitelistTags(issue.labels)
  const decoded = decodeTopicBody(issue.body)
  const quotedTopic = normalizeQuotedTopicReference(decoded.metadata.quotedTopic)

  return {
    labels,
    tags: labels.filter(isCategoryLabel),
    status: getTopicStatus(labels),
    goodIssue: labels.includes('GOOD-ISSUE'),
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
    pinned: getLabelNames(issue.labels).includes('PINNED'),
    user: normalizeUser(issue.user),
    state: issue.state,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    ...(issue.finished_at ? { closedAt: issue.finished_at } : {}),
    language: getLanguageFromLabel(issue.labels),
    ...(quotedTopic ? { quotedTopic } : {}),
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

interface TimelineCandidateBase {
  at: string
  logId: number
  actor?: ForumAPI.User
}

type TimelineCandidate
  = | (TimelineCandidateBase & { kind: 'created' })
    | (TimelineCandidateBase & { kind: 'state', state?: ForumAPI.TopicState, stateLabel?: string })
    | (TimelineCandidateBase & { kind: 'status', op: 'add' | 'remove', status: ForumAPI.TopicStatus })

function toTimestamp(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

/** 老版本 operate_logs 只有 content、没有前后值，退回文本里找受管标签名 */
const TOPIC_STATUS_LABEL_IN_TEXT = /ST-[A-Z0-9-]+/g

function findStatusLabelInText(text: string | null | undefined): ForumAPI.TopicStatus | undefined {
  // matchAll 内部复制正则，不会推进这里的 lastIndex
  for (const match of (text ?? '').matchAll(TOPIC_STATUS_LABEL_IN_TEXT)) {
    const status = getTopicStatusFromLabel(match[0])
    if (status)
      return status
  }
  return undefined
}

function toTimelineCandidate(log: GITEE.OperateLog | null | undefined): TimelineCandidate | undefined {
  if (!log?.created_at)
    return undefined

  const base: TimelineCandidateBase = {
    at: log.created_at,
    logId: log.id,
    ...(log.user ? { actor: normalizeUser(log.user) } : {}),
  }
  // 标签名只出现在 after_change_value：Gitee 对增删两种动作都不填 before_change_value，
  // 因此增删只能由 action_type 区分
  const value = (log.after_change_value ?? '').trim()

  switch (log.action_type) {
    case 'create':
      return { ...base, kind: 'created' }
    case 'add_label':
    case 'remove_label': {
      const status = getTopicStatusFromLabel(value) ?? findStatusLabelInText(log.content)
      // 其余标签（CATA-/LC-/TYP-）在机器人整组重放 labels 时会产生大量抖动，不成节点
      if (!status)
        return undefined
      return { ...base, kind: 'status', op: log.action_type === 'add_label' ? 'add' : 'remove', status }
    }
    case 'change_issue_state': {
      if (!value)
        return undefined
      const state = GITEE_ISSUE_STATE_TITLES[value]
      return state ? { ...base, kind: 'state', state } : { ...base, kind: 'state', stateLabel: value }
    }
    default:
      // change_description 与状态流转重复（正文内嵌 {"state":...} 元数据），不单独成节点
      return undefined
  }
}

function actorOf(candidate: TimelineCandidate): { actor?: ForumAPI.User } {
  return candidate.actor ? { actor: candidate.actor } : {}
}

/**
 * 把 Gitee 操作日志收敛为状态时间线：创建锚点 + 状态标签变更 + 状态流转。
 * 只有创建锚点时由 `hasTopicTimelineChanges` 判定区块是否渲染。
 */
export function normalizeTopicTimeline(logs: GITEE.OperateLogList): ForumAPI.TopicTimelineEvent[] {
  // operate_logs 已按 sort=asc 返回，这里仍显式排序以免依赖服务端行为；
  // Array#sort 自 ES2019 起稳定，同时间戳的条目保持 provider 原顺序
  const candidates = (logs ?? [])
    .map(log => toTimelineCandidate(log))
    .filter((candidate): candidate is TimelineCandidate => Boolean(candidate))
    .sort((a, b) => toTimestamp(a.at) - toTimestamp(b.at))

  const events: ForumAPI.TopicTimelineEvent[] = []
  let currentStatus: ForumAPI.TopicStatus | undefined
  let previousStateKey: string | undefined
  let hasCreated = false

  for (let index = 0; index < candidates.length; index++) {
    const candidate = candidates[index]
    if (!candidate)
      continue

    if (candidate.kind === 'created') {
      if (hasCreated)
        continue
      hasCreated = true
      events.push({ id: String(candidate.logId), kind: 'created', at: candidate.at, ...actorOf(candidate) })
      continue
    }

    if (candidate.kind === 'state') {
      const key = candidate.state ?? candidate.stateLabel ?? ''
      // 反复置为同一状态不产生额外节点
      if (key === previousStateKey)
        continue
      previousStateKey = key
      events.push({
        id: String(candidate.logId),
        kind: 'state',
        at: candidate.at,
        ...actorOf(candidate),
        ...(candidate.state ? { state: candidate.state } : { stateLabel: key }),
      })
      continue
    }

    // 一次整组 labels 提交会同时产生 remove(旧) 与 add(新)，合并为一次状态迁移
    const run: TimelineCandidate[] = []
    while (index < candidates.length) {
      const next = candidates[index]
      if (!next || next.kind !== 'status' || next.at !== candidate.at)
        break
      run.push(next)
      index += 1
    }
    // run 结束时 index 指向首个不属于本次 run 的条目，抵消外层自增以免跳过它
    index -= 1

    const lastOp = (direction: 'add' | 'remove') => {
      for (let offset = run.length - 1; offset >= 0; offset--) {
        const entry = run[offset]
        if (entry?.kind === 'status' && entry.op === direction)
          return entry
      }
      return undefined
    }
    const added = lastOp('add')
    const removed = lastOp('remove')
    // 仅 add 时此前状态即 from（同值会因 from === to 被丢弃）；仅 remove 时表示状态被清除
    const from = removed?.status ?? currentStatus
    const to = added?.status
    currentStatus = to ?? (removed ? undefined : currentStatus)

    if (from === to)
      continue

    const anchor = run[0] ?? candidate
    events.push({
      id: String(anchor.logId),
      kind: 'status',
      at: anchor.at,
      ...actorOf(anchor),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    })
  }

  return events
}

function getCommentAreaState(labels?: GITEE.IssueLabel[]) {
  return getLabelNames(labels).includes('COMMENT-CLOSED')
}

function getLabelNames(labels?: GITEE.IssueLabel[]): string[] {
  return (labels ?? []).flatMap(val => (val?.name ? [val.name] : []))
}

export function isUpperCase(str: string) {
  return str.toLocaleUpperCase() === str
}

function getTopicTypeFromTitle(title: string): {
  type: ForumAPI.FeedbackTopicType | null
  title: string
} {
  const match = (title ?? '')
    .toLocaleUpperCase()
    .match(new RegExp(`^(${GITEE_API_CONFIG.TOPIC_TYPE.join('|')}):`))

  if (match) {
    const prefix = match[0].replace(':', '') as ForumAPI.FeedbackTopicType
    if (prefix)
      return { type: prefix, title: stripMarkdownImages(title.slice(prefix.length + 1)) }
  }

  return { type: null, title: stripMarkdownImages(title ?? '') }
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

export function filterWhitelistTags(labels?: GITEE.IssueLabel[]) {
  return getLabelNames(labels)
    .filter(val => isUpperCase(val))
    .filter(
      val =>
        val.startsWith('ST-')
        || GITEE_API_CONFIG.STATE_TAGS.has(val)
        || forumLocaleLabelGetter.isLabel(val)
        || topicTypeLabelGetter.isLabel(val)
        // 反馈标签按前缀放行，不依赖静态映射表
        || isCategoryLabel(val),
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
