import type ForumAPI from '@/apis/forum/api'
import type { ForumSearchState } from '~/services/forum/forumSearchQuery'
import { FORUM_CONFIG } from '~/services/forum/forumConfig'
import { getTopicDisplayStatus } from '~/services/forum/forumTopicStatus'

export type TopicStateFilter = ForumAPI.TopicState | 'all'

export interface ForumTopicListParams {
  filter: ForumAPI.FilterBy
  topicType?: 'all' | 'bug' | 'feat'
  sort: ForumAPI.SortMethod
  creator: string | null
  q: string
  labels?: string[]
  tags?: string[]
  statuses?: ForumSearchState[]
  pageSize?: number
  /** 话题状态过滤；缺省按 filter 推断（'closed'→progressing，其余 open） */
  state?: TopicStateFilter
}

export interface ForumPage<T> {
  items: T[]
  total: number
  totalPage: number
}

export const forumKeys = {
  all: ['forum'] as const,
  topics: () => ['forum', 'topics'] as const,
  topicLists: () => ['forum', 'topics', 'list'] as const,
  topicList: (params: ForumTopicListParams) => ['forum', 'topics', 'list', normalizeTopicListParams(params)] as const,
  topic: (id: string | number) => ['forum', 'topics', 'detail', String(id)] as const,
  topicTimeline: (id: string | number) => ['forum', 'topics', 'timeline', String(id)] as const,
  comments: (topicId: string | number) => ['forum', 'comments', String(topicId)] as const,
  user: (username: string) => ['forum', 'users', 'detail', username.trim()] as const,
  sessionUser: () => ['session', 'user'] as const,
  pinned: () => ['forum', 'topics', 'list', 'pinned'] as const,
  personalState: (userId: string | number) => ['forum', 'personal-state', String(userId)] as const,
  reactionResource: (resourceIdentity: string) => ['forum', 'reactions', resourceIdentity] as const,
  reaction: (resourceIdentity: string, viewerIdentity: string) =>
    [...forumKeys.reactionResource(resourceIdentity), viewerIdentity] as const,
}

export type ForumMutationKind
  = | 'createTopic'
    | 'editTopic'
    | 'changeTopicMembership'
    | 'pinTopic'
    | 'closeTopic'
    | 'createComment'
    | 'deleteComment'
    | 'toggleCommentArea'

interface ForumMutationPolicy {
  patchDetail: boolean
  invalidateDetail: boolean
  invalidateTopicLists: boolean
  invalidatePinned: boolean
  invalidateComments: boolean
  /** 状态标签与 state 变更会写入操作日志，需刷新状态时间线 */
  invalidateTimeline: boolean
}

const BASE_TOPIC_POLICY: ForumMutationPolicy = {
  patchDetail: true,
  invalidateDetail: false,
  invalidateTopicLists: true,
  invalidatePinned: false,
  invalidateComments: false,
  invalidateTimeline: true,
}

export const forumMutationPolicies: Record<ForumMutationKind, ForumMutationPolicy> = {
  createTopic: BASE_TOPIC_POLICY,
  editTopic: BASE_TOPIC_POLICY,
  changeTopicMembership: BASE_TOPIC_POLICY,
  pinTopic: { ...BASE_TOPIC_POLICY, invalidatePinned: true },
  closeTopic: BASE_TOPIC_POLICY,
  createComment: {
    ...BASE_TOPIC_POLICY,
    patchDetail: false,
    invalidateDetail: true,
    invalidateComments: true,
    invalidateTimeline: false,
  },
  deleteComment: {
    ...BASE_TOPIC_POLICY,
    patchDetail: false,
    invalidateDetail: true,
    invalidateComments: true,
    invalidateTimeline: false,
  },
  toggleCommentArea: {
    ...BASE_TOPIC_POLICY,
    invalidateComments: true,
  },
}

export function normalizeTopicListParams(params: ForumTopicListParams) {
  const labels = normalizeStrings(params.labels)
  const tags = normalizeStrings(params.tags)
  const statuses = normalizeStrings(params.statuses) as ForumSearchState[]
  return {
    filter: params.filter || 'all',
    topicType: params.topicType ?? 'all',
    sort: params.sort || 'created',
    creator: params.creator?.trim() || null,
    q: params.q.trim(),
    pageSize: params.pageSize || FORUM_CONFIG.DEFAULT_PAGE_SIZE,
    ...(labels.length ? { labels } : {}),
    ...(tags.length ? { tags } : {}),
    ...(statuses.length ? { statuses } : {}),
    ...(params.state ? { state: params.state } : {}),
  } as const
}

export function normalizeStrings(values: readonly string[] | undefined): string[] {
  return (values ?? [])
    .map(value => value.trim())
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
    .toSorted()
}

export function isForumTopicListParams(value: unknown): value is ForumTopicListParams {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return false
  const params = value as Record<string, unknown>
  return typeof params.filter === 'string'
    && typeof params.sort === 'string'
    && (params.creator === null || typeof params.creator === 'string')
    && typeof params.q === 'string'
}

export function forumStateForFilter(filter: ForumAPI.FilterBy): TopicStateFilter {
  switch (filter) {
    case 'closed':
      return 'progressing'
    case 'archived':
      return 'closed'
    case 'everything':
      return 'all'
    default:
      return 'open'
  }
}

// Gitee 单次只能查一个 state，`everything` 在这里剔除归档
const FILTER_EXCLUDED_STATES: Partial<Record<ForumAPI.FilterBy, readonly ForumAPI.TopicState[]>> = {
  everything: ['closed'],
}

export function forumExcludedStatesForFilter(filter: ForumAPI.FilterBy): readonly ForumAPI.TopicState[] {
  return FILTER_EXCLUDED_STATES[filter] ?? []
}

export function flattenForumPages<T extends { id: string | number }>(pages: readonly ForumPage<T>[]): T[] {
  const seen = new Set<string>()
  return pages.flatMap(page => page.items).filter((item) => {
    const id = String(item.id)
    if (seen.has(id))
      return false
    seen.add(id)
    return true
  })
}

export function collectForumTopics(values: readonly unknown[]): ForumAPI.Topic[] {
  const topics = values.flatMap((value) => {
    if (isForumTopic(value))
      return [value]
    if (Array.isArray(value))
      return value.filter(isForumTopic)
    if (!value || typeof value !== 'object' || !Array.isArray((value as { pages?: unknown }).pages))
      return []
    return (value as { pages: Array<{ items?: unknown }> }).pages.flatMap(
      page => Array.isArray(page.items) ? page.items.filter(isForumTopic) : [],
    )
  })

  return flattenForumPages([{ items: topics, total: topics.length, totalPage: 1 }])
}

function isForumTopic(value: unknown): value is ForumAPI.Topic {
  if (!value || typeof value !== 'object')
    return false
  const topic = value as Partial<ForumAPI.Topic>
  return (typeof topic.id === 'string' || typeof topic.id === 'number')
    && typeof topic.title === 'string'
    && Boolean(topic.content && typeof topic.content.text === 'string')
}

export function removeTopicFromForumPages<T extends { id: string | number }, TPageParam>(
  data: { pages: ForumPage<T>[], pageParams: TPageParam[] },
  topicId: string | number,
) {
  const id = String(topicId)
  if (!data.pages.some(page => page.items.some(item => String(item.id) === id)))
    return data

  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      items: page.items.filter(item => String(item.id) !== id),
      total: Math.max(0, page.total - 1),
    })),
  }
}

export function mapTopicInForumPages<T extends { id: string | number }, TPageParam>(
  data: { pages: ForumPage<T>[], pageParams: TPageParam[] },
  topicId: string | number,
  update: (topic: T) => T,
) {
  const id = String(topicId)
  let changed = false
  const pages = data.pages.map(page => ({
    ...page,
    items: page.items.map((topic) => {
      if (String(topic.id) !== id)
        return topic
      changed = true
      return update(topic)
    }),
  }))

  return changed ? { ...data, pages } : data
}

export function prependTopicToForumPages<T extends { id: string | number }, TPageParam>(
  data: { pages: ForumPage<T>[], pageParams: TPageParam[] },
  topic: T,
) {
  const id = String(topic.id)
  if (data.pages.some(page => page.items.some(item => String(item.id) === id)))
    return mapTopicInForumPages(data, topic.id, cached => ({ ...cached, ...topic }))

  const [firstPage, ...remainingPages] = data.pages
  if (!firstPage)
    return data

  return {
    ...data,
    pages: [
      { ...firstPage, items: [topic, ...firstPage.items], total: firstPage.total + 1 },
      ...remainingPages.map(page => ({ ...page, total: page.total + 1 })),
    ],
  }
}

export function forumTopicBelongsToList(topic: ForumAPI.Topic, params: ForumTopicListParams): boolean {
  return matchesForumTopicListQuery(topic, params)
}

// 状态分面存在时由 displayStatus 表达语义，不再叠加 filter 推导的 state 约束
export function matchesForumTopicListQuery(topic: ForumAPI.Topic, params: ForumTopicListParams): boolean {
  const statuses = params.statuses ?? []
  const expectedState = params.state ?? forumStateForFilter(params.filter)
  const stateMatches = statuses.length > 0
    || (expectedState === 'all' || topic.state === expectedState)
  const excludedStates = forumExcludedStatesForFilter(params.filter)
  const exclusionMatches = statuses.length > 0
    || (!topic.state || !excludedStates.includes(topic.state))
  const topicType = params.topicType && params.topicType !== 'all' ? params.topicType : params.filter
  const typeMatches = topicType === 'bug'
    ? topic.type === 'BUG'
    : topicType === 'feat'
      ? topic.type === 'FEAT'
      : true
  const creatorMatches = !params.creator
    || topic.user.login.toLocaleLowerCase() === params.creator.toLocaleLowerCase()
  const query = params.q.trim().toLocaleLowerCase()
  const queryMatches = !query
    || topic.title.toLocaleLowerCase().includes(query)
    || topic.content.text.toLocaleLowerCase().includes(query)
  const labelsMatch = !params.labels?.length
    || params.labels.every(label => topic.labels.includes(label))
  const tagsMatch = !params.tags?.length
    || params.tags.some(tag => topic.tags.includes(tag))
  const displayStatus = getTopicDisplayStatus(topic.status, topic.state)
  const statusesMatch = !statuses.length
    || statuses.some(status => status === 'good-issue' ? topic.goodIssue : status === displayStatus)

  return stateMatches && exclusionMatches && typeMatches && creatorMatches && queryMatches && labelsMatch && tagsMatch && statusesMatch
}

export function requiresAuthoritativeRefetch(status: 'success' | 'partial' | 'unknown'): boolean {
  return status === 'partial' || status === 'unknown'
}
