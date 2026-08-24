import type ForumAPI from '@/apis/forum/api'

export interface ForumTopicListParams {
  filter: ForumAPI.FilterBy
  sort: ForumAPI.SortMethod
  creator: string | null
  q: string
  pageSize?: number
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

export interface ForumMutationPolicy {
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
  } as const
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

export function requiresAuthoritativeRefetch(status: 'success' | 'partial' | 'unknown' | 'failure'): boolean {
  return status === 'partial' || status === 'unknown'
}
