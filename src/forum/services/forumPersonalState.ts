import type ForumAPI from '~/forum/api/types'
import { stripMarkdownImages } from './forumContentCodec'
import { TOPIC_STATUS_DEFINITIONS } from './forumTopicStatus'

const FOLLOWED_TOPIC_LIMIT = 50
const RECENT_PARTICIPATED_LIMIT = 20
const TOPIC_STATUSES = new Set(TOPIC_STATUS_DEFINITIONS.map(definition => definition.id))

interface ForumPersonalTopic {
  topicId: string
  title: string
  type: ForumAPI.TopicType
  authorLogin: string
  recordedAt: string
  commentCount?: number
  state?: ForumAPI.TopicState
  status?: ForumAPI.TopicStatus
  goodIssue?: boolean
  closedAt?: string
}

export interface ForumPersonalState {
  version: 1
  followedTopics: ForumPersonalTopic[]
  recentParticipated: ForumPersonalTopic[]
}

type ForumPersonalStateDecodeResult
  = | { ok: true, state: ForumPersonalState }
    | { ok: false, reason: string, kind: 'corrupt' | 'unsupported-version' }

function validDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

export function emptyForumPersonalState(): ForumPersonalState {
  return { version: 1, followedTopics: [], recentParticipated: [] }
}

function normalizeTopic(value: unknown): ForumPersonalTopic | null {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return null
  const topic = value as Partial<ForumPersonalTopic>
  const id: unknown = topic.topicId
  const topicId = typeof id === 'string' ? id.trim() : typeof id === 'number' && Number.isSafeInteger(id) && id > 0 ? String(id) : ''
  if (!topicId || typeof topic.title !== 'string' || typeof topic.authorLogin !== 'string' || !topic.authorLogin.trim() || !validDate(topic.recordedAt))
    return null
  if (!['BUG', 'FEAT', 'ANN', 'POST'].includes(String(topic.type)))
    return null
  const title = stripMarkdownImages(topic.title)
  if (!title)
    return null
  return {
    topicId,
    title,
    type: topic.type as ForumAPI.TopicType,
    authorLogin: topic.authorLogin.trim(),
    recordedAt: topic.recordedAt,
    ...(typeof topic.commentCount === 'number' && Number.isSafeInteger(topic.commentCount) && topic.commentCount >= 0 ? { commentCount: topic.commentCount } : {}),
    ...(['open', 'closed', 'progressing'].includes(String(topic.state)) ? { state: topic.state as ForumAPI.TopicState } : {}),
    ...(TOPIC_STATUSES.has(topic.status as ForumAPI.TopicStatus) ? { status: topic.status as ForumAPI.TopicStatus } : {}),
    ...(typeof topic.goodIssue === 'boolean' ? { goodIssue: topic.goodIssue } : {}),
    ...(validDate(topic.closedAt) ? { closedAt: topic.closedAt } : {}),
  }
}

function normalizeTopics(value: unknown, limit: number, rejectInvalid = false): ForumPersonalTopic[] | null {
  if (!Array.isArray(value))
    return rejectInvalid ? null : []
  const seen = new Set<string>()
  const topics = value.flatMap((item) => {
    const topic = normalizeTopic(item)
    if (!topic)
      return rejectInvalid ? [null] : []
    if (seen.has(topic.topicId))
      return []
    seen.add(topic.topicId)
    return [topic]
  })
  return topics.includes(null)
    ? null
    : (topics as ForumPersonalTopic[]).slice(0, limit)
}

export function decodeForumPersonalState(content: string | undefined): ForumPersonalStateDecodeResult {
  if (!content)
    return { ok: false, kind: 'corrupt', reason: 'The gist file is empty.' }
  try {
    const value = JSON.parse(content) as Partial<ForumPersonalState>
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return { ok: false, kind: 'corrupt', reason: 'The gist state is not an object.' }
    if (value.version !== 1)
      return { ok: false, kind: 'unsupported-version', reason: 'The gist uses an unsupported state version.' }
    if (!Array.isArray(value.followedTopics) || !Array.isArray(value.recentParticipated))
      return { ok: false, kind: 'corrupt', reason: 'The gist state lists are missing or invalid.' }

    const followedTopics = normalizeTopics(value.followedTopics, FOLLOWED_TOPIC_LIMIT, true)
    const recentParticipated = normalizeTopics(value.recentParticipated, RECENT_PARTICIPATED_LIMIT, true)
    if (!followedTopics || !recentParticipated)
      return { ok: false, kind: 'corrupt', reason: 'The gist contains an invalid topic entry.' }

    return { ok: true, state: {
      version: 1,
      followedTopics,
      recentParticipated,
    } }
  }
  catch {
    return { ok: false, kind: 'corrupt', reason: 'The gist file is not valid JSON.' }
  }
}

export function parseForumPersonalState(content: string | undefined): ForumPersonalState {
  if (!content)
    return emptyForumPersonalState()
  try {
    const value = JSON.parse(content) as Partial<ForumPersonalState>
    if (!value || typeof value !== 'object' || value.version !== 1)
      return emptyForumPersonalState()
    return {
      version: 1,
      followedTopics: normalizeTopics(value.followedTopics, FOLLOWED_TOPIC_LIMIT) ?? [],
      recentParticipated: normalizeTopics(value.recentParticipated, RECENT_PARTICIPATED_LIMIT) ?? [],
    }
  }
  catch {
    return emptyForumPersonalState()
  }
}

export function serializeForumPersonalState(state: ForumPersonalState): string {
  const content = JSON.stringify(state, null, 2)
  const result = decodeForumPersonalState(content)
  if (!result.ok)
    throw new Error(`Refusing to save invalid forum personal state: ${result.reason}`)
  return JSON.stringify(result.state, null, 2)
}

export function summarizePersonalTopic(topic: ForumAPI.Topic, recordedAt = new Date().toISOString()): ForumPersonalTopic {
  return {
    topicId: String(topic.id),
    title: topic.title,
    type: topic.type,
    authorLogin: topic.user.login,
    recordedAt,
    commentCount: topic.commentCount,
    state: topic.state,
    status: topic.status,
    goodIssue: topic.goodIssue,
    ...(topic.closedAt ? { closedAt: topic.closedAt } : {}),
  }
}

const CLOSED_TOPIC_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

export function isRecentClosedTopic(
  topic: { state?: ForumAPI.TopicState, closedAt?: string },
  now = Date.now(),
): boolean {
  if (topic.state !== 'closed' || !topic.closedAt)
    return true
  const closedAt = Date.parse(topic.closedAt)
  return Number.isNaN(closedAt) || now - closedAt <= CLOSED_TOPIC_RETENTION_MS
}

function prependTopic(list: ForumPersonalTopic[], topic: ForumPersonalTopic, limit: number): ForumPersonalTopic[] {
  return [topic, ...list.filter(item => item.topicId !== topic.topicId)].slice(0, limit)
}

export function toggleFollowedTopic(state: ForumPersonalState, topic: ForumPersonalTopic): ForumPersonalState {
  const exists = state.followedTopics.some(item => item.topicId === topic.topicId)
  return setFollowedTopic(state, topic, !exists)
}

export function setFollowedTopic(state: ForumPersonalState, topic: ForumPersonalTopic, followed: boolean): ForumPersonalState {
  return {
    ...state,
    followedTopics: followed
      ? prependTopic(state.followedTopics, topic, FOLLOWED_TOPIC_LIMIT)
      : state.followedTopics.filter(item => item.topicId !== topic.topicId),
  }
}

export function removeFollowedTopic(state: ForumPersonalState, topicId: string | number): ForumPersonalState {
  return {
    ...state,
    followedTopics: state.followedTopics.filter(topic => topic.topicId !== String(topicId)),
  }
}

export function recordParticipation(state: ForumPersonalState, topic: ForumPersonalTopic): ForumPersonalState {
  return {
    ...state,
    recentParticipated: prependTopic(state.recentParticipated, topic, RECENT_PARTICIPATED_LIMIT),
  }
}
