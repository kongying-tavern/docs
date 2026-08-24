import type { MaybeRefOrGetter } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import type { ForumPage, ForumTopicListParams } from '~/services/forum/forumQueryContracts'
import { useInfiniteQuery, useQuery } from '@pinia/colada'
import { computed, toValue } from 'vue'
import { issues, user } from '@/apis/forum/gitee'
import { FORUM_CONFIG } from '~/components/forum/constants'
import {
  flattenForumPages,
  forumKeys,
  normalizeTopicListParams,
} from '~/services/forum/forumQueryContracts'
import { ForumService } from '~/services/forumService'

export function useForumTopicsQuery(params: MaybeRefOrGetter<ForumTopicListParams>) {
  const normalized = computed(() => normalizeTopicListParams(toValue(params)))
  const query = useInfiniteQuery<ForumPage<ForumAPI.Topic>, Error, number>({
    key: () => forumKeys.topicList(normalized.value),
    initialPageParam: 1,
    query: async ({ pageParam }) => {
      const result = await ForumService.getTopics({
        ...normalized.value,
        page: pageParam,
      })
      return { items: result.topics, total: result.total, totalPage: result.totalPage }
    },
    getNextPageParam: (lastPage, _pages, page) => nextPage(lastPage, page, normalized.value.pageSize),
    staleTime: 60_000,
  })

  const rows = computed(() => flattenForumPages(query.data.value?.pages ?? []))
  const total = computed(() => query.data.value?.pages.at(-1)?.total ?? 0)
  const loadingMore = computed(() => query.isLoading.value && rows.value.length > 0)

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
    query: () => ForumService.getPinnedTopics(),
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
