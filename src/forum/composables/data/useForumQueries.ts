import type { MaybeRefOrGetter } from 'vue'
import type ForumAPI from '~/forum/api/types'
import type { ForumPage, ForumTopicListParams } from '~/forum/services/forumQueryContracts'
import { useInfiniteQuery, useQuery } from '@pinia/colada'
import { computed, toValue, watch } from 'vue'
import { issues, user } from '~/forum/api/gitee'
import { usePermissionData } from '~/forum/composables/auth/usePermissionData'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { FORUM_CONFIG } from '~/forum/services/forumConfig'
import {
  buildForumListCacheKey,
  saveSkeletonListCount,
} from '~/forum/services/forumListSkeleton'
import {
  flattenForumPages,
  forumKeys,
  normalizeTopicListParams,
} from '~/forum/services/forumQueryContracts'
import { getForumTopics, getPinnedForumTopics } from '~/forum/services/forumTopics'

// 列表页 scope：传入时首屏成功记录条数供骨架屏复用（见 forumListSkeleton）；pageSize=1 的计数查询不要传
export function useForumTopicsQuery(
  params: MaybeRefOrGetter<ForumTopicListParams>,
  enabled: MaybeRefOrGetter<boolean> = true,
  skeletonScope?: MaybeRefOrGetter<string | null>,
) {
  const { getTeamMemberIds, getFeedbackMemberIds } = usePermissionData()
  const { hasAnyRoles } = useRuleChecks()
  const canViewArchived = hasAnyRoles('teamMember', 'feedbackMember')
  const normalized = computed(() => {
    const value = normalizeTopicListParams(toValue(params))
    // Archived lists are admin-only; a hand-edited URL falls back to the default list.
    return value.filter === 'archived' && !canViewArchived.value
      ? { ...value, filter: 'all' as const }
      : value
  })
  const query = useInfiniteQuery<ForumPage<ForumAPI.Topic>, Error, number>({
    key: () => forumKeys.topicList(normalized.value),
    initialPageParam: 1,
    enabled: () => toValue(enabled),
    query: async ({ pageParam }) => {
      const result = await getForumTopics({
        ...normalized.value,
        page: pageParam,
      }, userId => getTeamMemberIds.value.has(Number(userId)) || getFeedbackMemberIds.value.has(Number(userId)))
      return { items: result.topics, total: result.total, totalPage: result.totalPage }
    },
    getNextPageParam: (lastPage, _pages, page) => nextPage(lastPage, page, normalized.value.pageSize),
    staleTime: 60_000,
  })

  const rows = computed(() => flattenForumPages(query.data.value?.pages ?? []))
  const total = computed(() => query.data.value?.pages.at(-1)?.total ?? 0)
  const loadingMore = computed(() => query.isLoading.value && rows.value.length > 0)

  // 只记录首屏第一页条数；追加加载不改动第一页，不会重复覆盖
  const scope = computed(() => toValue(skeletonScope) ?? null)
  watch([scope, () => query.data.value?.pages[0]?.items.length], ([currentScope, firstPageCount]) => {
    if (!currentScope || !firstPageCount)
      return
    saveSkeletonListCount(buildForumListCacheKey(currentScope, normalized.value), firstPageCount)
  })

  return {
    ...query,
    rows,
    total,
    loadingMore,
    canLoadMore: query.hasNextPage,
    loadMore: () => query.loadNextPage({ cancelRefetch: false, throwOnError: false }),
  }
}

export function usePinnedTopicsQuery() {
  return useQuery({
    key: forumKeys.pinned,
    query: getPinnedForumTopics,
    staleTime: 5 * 60_000,
  })
}

export function useForumTopicQuery(topicId: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => forumKeys.topic(toValue(topicId)),
    query: () => issues.getTopic(toValue(topicId)),
    enabled: () => Boolean(toValue(topicId)),
    staleTime: 60_000,
  })
}

export function useForumTopicTimelineQuery(topicId: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => forumKeys.topicTimeline(toValue(topicId)),
    query: () => issues.getTopicTimeline(toValue(topicId)),
    enabled: () => Boolean(toValue(topicId)),
    staleTime: 60_000,
  })
}

export function useForumUserProfileQuery(
  username: MaybeRefOrGetter<string>,
  accessToken?: MaybeRefOrGetter<string | undefined>,
) {
  return useQuery({
    key: () => forumKeys.user(toValue(username)),
    query: () => user.getUser(toValue(username), accessToken ? toValue(accessToken) : undefined),
    enabled: () => Boolean(toValue(username)),
    staleTime: 5 * 60_000,
  })
}

export function useForumCommentsQuery(options: {
  topicId: MaybeRefOrGetter<string>
  repo: MaybeRefOrGetter<ForumAPI.Repo>
  enabled: MaybeRefOrGetter<boolean>
}) {
  const pageSize = FORUM_CONFIG.DEFAULT_PAGE_SIZE
  const query = useInfiniteQuery<ForumPage<ForumAPI.Comment>, Error, number>({
    key: () => forumKeys.comments(toValue(options.topicId)),
    initialPageParam: 1,
    enabled: () => Boolean(toValue(options.topicId)) && toValue(options.enabled),
    query: async ({ pageParam }) => {
      const result = await issues.getTopicComments(toValue(options.repo), {
        current: pageParam,
        pageSize,
        sort: 'created',
        filter: null,
        creator: null,
      }, toValue(options.topicId))
      return {
        items: result.data,
        total: result.total ?? 0,
        totalPage: result.totalPage ?? 0,
      }
    },
    getNextPageParam: (lastPage, _pages, page) => nextPage(lastPage, page, pageSize),
    staleTime: 60_000,
  })

  const rows = computed(() => flattenForumPages(query.data.value?.pages ?? []))
  const total = computed(() => query.data.value?.pages.at(-1)?.total ?? rows.value.length)

  return {
    ...query,
    rows,
    total,
    loadingMore: computed(() => query.isLoading.value && rows.value.length > 0),
    canLoadMore: query.hasNextPage,
    loadMore: () => query.loadNextPage({ cancelRefetch: false, throwOnError: false }),
  }
}

function nextPage<T>(lastPage: ForumPage<T>, page: number, pageSize: number): number | undefined {
  if (lastPage.totalPage > page)
    return page + 1
  if (!lastPage.totalPage && lastPage.items.length >= pageSize)
    return page + 1
  return undefined
}
