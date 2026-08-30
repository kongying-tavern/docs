import type ForumAPI from '@/apis/forum/api'

export type TopicStateFilter = ForumAPI.TopicState | 'all'

export interface ForumTopicListParams {
  filter: ForumAPI.FilterBy
  sort: ForumAPI.SortMethod
  creator: string | null
  q: string
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
  comments: (topicId: string | number) => ['forum', 'comments', String(topicId)] as const,
  user: (username: string) => ['forum', 'users', 'detail', username.trim()] as const,
  sessionUser: () => ['session', 'user'] as const,
  pinned: () => ['forum', 'topics', 'list', 'pinned'] as const,
  personalState: (userId: string | number) => ['forum', 'personal-state', String(userId)] as const,
  reaction: (resourceIdentity: string, viewerIdentity: string) =>
    ['forum', 'reactions', resourceIdentity, viewerIdentity] as const,
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
}

const BASE_TOPIC_POLICY: ForumMutationPolicy = {
  patchDetail: true,
  invalidateDetail: false,
  invalidateTopicLists: true,
  invalidatePinned: false,
  invalidateComments: false,
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
  },
  deleteComment: {
    ...BASE_TOPIC_POLICY,
    patchDetail: false,
    invalidateDetail: true,
    invalidateComments: true,
  },
  toggleCommentArea: {
    ...BASE_TOPIC_POLICY,
    invalidateComments: true,
  },
}

export function normalizeTopicListParams(params: ForumTopicListParams) {
  return {
    filter: params.filter || 'all',
    sort: params.sort || 'created',
    creator: params.creator?.trim() || null,
    q: params.q.trim(),
    pageSize: params.pageSize || 20,
    ...(params.state ? { state: params.state } : {}),
  } as const
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

export function forumStateForFilter(filter: ForumAPI.FilterBy): ForumAPI.TopicState {
  return filter === 'closed' ? 'progressing' : 'open'
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
  const expectedState = params.state ?? forumStateForFilter(params.filter)
  const stateMatches = expectedState === 'all' || topic.state === expectedState
  const typeMatches = params.filter === 'bug'
    ? topic.type === 'BUG'
    : params.filter === 'feat'
      ? topic.type === 'FEAT'
      : true
  const creatorMatches = !params.creator
    || topic.user.login.toLocaleLowerCase() === params.creator.toLocaleLowerCase()
  const query = params.q.trim().toLocaleLowerCase()
  const queryMatches = !query
    || topic.title.toLocaleLowerCase().includes(query)
    || topic.content.text.toLocaleLowerCase().includes(query)

  return stateMatches && typeMatches && creatorMatches && queryMatches
}

export function requiresAuthoritativeRefetch(status: 'success' | 'partial' | 'unknown'): boolean {
  return status === 'partial' || status === 'unknown'
}
