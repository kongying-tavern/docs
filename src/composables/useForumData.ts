import type ForumAPI from '@/apis/forum/api'
import type { ForumQueryParams, ForumServiceOptions } from '~/services/forumService'
import { useLoadMore } from '@/hooks/useLoadMore'
import { useLocalized } from '@/hooks/useLocalized'
import { computed, ref } from 'vue'
import { useRequest } from 'vue-request'
import { handleError } from '~/composables/handleError'
import { ForumService } from '~/services/forumService'

export interface UseForumDataOptions {
  manual?: boolean
  autoLoadPinned?: boolean
}

export function useForumData(options: UseForumDataOptions = {}) {
  const { manual = true, autoLoadPinned = true } = options
  const { message } = useLocalized()

  // State
  const isInitialized = ref(false)
  const lastError = ref<Error | null>(null)

  // Load more hook for main topics
  const {
    data,
    runAsync,
    loading,
    loadMore,
    noMore,
    initialData,
    totalPage,
    total,
    isFirstLoad,
    canLoadMore,
  } = useLoadMore(async (queryParams: ForumAPI.Query, _state: string, searchQuery?: string) => {
    const serviceOptions: ForumServiceOptions = {
      onError: (error) => {
        lastError.value = error
      },
    }

    // Convert useLoadMore params to ForumService params
    const forumParams: ForumQueryParams = {
      page: queryParams.current,
      pageSize: queryParams.pageSize,
      sort: queryParams.sort as ForumAPI.SortMethod,
      filter: queryParams.filter as ForumAPI.FilterBy,
      creator: queryParams.creator,
      searchQuery,
    }

    const result = await ForumService.getTopics(forumParams, serviceOptions)
    return {
      data: result.topics,
      total: result.total,
      totalPage: result.totalPage,
    }
  }, {
    manual,
  })

  // Pinned topics request
  const {
    data: pinnedTopicsData,
    loading: pinnedTopicsLoading,
    runAsync: loadPinnedTopics,
  } = useRequest(async () => {
    const serviceOptions: ForumServiceOptions = {
      onError: (error) => {
        lastError.value = error
      },
    }
    return ForumService.getPinnedTopics(serviceOptions)
  }, {
    manual: true,
  })

  // Computed
  const loadStateMessage = computed(() => {
    if (loading.value)
      return message.value.forum.loadMore
    if (lastError.value)
      return `${message.value.forum.loadError}: ${ForumService.buildErrorMessage(lastError.value)}`
    if (data.value?.length === 0)
      return 'No topics found'
    if (noMore.value)
      return message.value.forum.noMore
    return ''
  })

  const isDataLoading = computed(() => loading.value || pinnedTopicsLoading.value)

  // Actions
  async function refreshData(queryParams?: ForumQueryParams): Promise<void> {
    if (import.meta.env.SSR)
      return

    try {
      lastError.value = null

      // Convert ForumQueryParams to useLoadMore format
      const loadMoreParams: ForumAPI.Query = {
        current: queryParams?.page || 1,
        pageSize: queryParams?.pageSize || 20,
        sort: queryParams?.sort || 'created',
        creator: queryParams?.creator || null,
        filter: queryParams?.filter || 'all',
      }

      // Note: state and filter mapping is now handled by ForumService
      await runAsync(
        loadMoreParams,
        'open', // Default state, ForumService will override this based on filter
        queryParams?.searchQuery ? String(queryParams.searchQuery) : undefined,
      )
    }
    catch (err) {
      lastError.value = err instanceof Error ? err : new Error('Unknown error')
      handleError(lastError.value, message, {
        errorMessage: `${message.value.forum.loadError}: ${ForumService.buildErrorMessage(lastError.value)}`,
      })
    }
  }

  async function loadForumData(queryParams?: ForumQueryParams): Promise<void> {
    if (import.meta.env.SSR || isInitialized.value)
      return

    try {
      isInitialized.value = true

      const promises: Promise<unknown>[] = [refreshData(queryParams)]

      if (autoLoadPinned) {
        promises.push(loadPinnedTopics())
      }

      await Promise.all(promises)
    }
    catch (err) {
      isInitialized.value = false
      lastError.value = err instanceof Error ? err : new Error('Failed to initialize forum data')
      throw lastError.value
    }
  }

  async function searchTopics(query: string | string[], additionalParams?: Omit<ForumQueryParams, 'searchQuery'>): Promise<void> {
    initialData()

    if (!query || (Array.isArray(query) && query.length === 0)) {
      return
    }

    await refreshData({
      ...additionalParams,
      searchQuery: query,
    })
  }

  async function loadMoreTopics(): Promise<void> {
    if (!canLoadMore.value || loading.value)
      return

    try {
      await loadMore()
    }
    catch (err) {
      lastError.value = err instanceof Error ? err : new Error('Failed to load more topics')
      handleError(lastError.value, message)
    }
  }

  function resetState(options?: { reloadData?: boolean }): void {
    // Reset local state
    isInitialized.value = false
    lastError.value = null
    initialData()

    // Optionally reload data
    if (options?.reloadData) {
      setTimeout(() => {
        loadForumData()
      }, 100)
    }
  }

  return {
    // State
    isInitialized,
    lastError,
    pinnedTopicsData,

    // Data
    data,

    // Loading states
    loading,
    pinnedTopicsLoading,
    isDataLoading,

    // Pagination
    totalPage,
    total,
    canLoadMore,
    noMore,
    isFirstLoad,

    // Computed
    loadStateMessage,

    // Actions
    refreshData,
    loadForumData,
    searchTopics,
    loadMoreTopics,
    resetState,
    initialData,
    loadPinnedTopics,
  }
}
