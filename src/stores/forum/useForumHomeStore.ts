import type ForumAPI from '@/apis/forum/api'
import type { ForumQueryParams, ForumStore, ForumStoreConfig } from '~/types/forum/simplified'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { useForumCacheManager } from '~/composables/useForumCacheManager'
import { useForumData } from '~/composables/useForumData'
import { usePathParam } from '~/composables/usePathParam'
import { useOptimizedTopicList } from '~/composables/useStorePerformanceOptimizer'
import { useTopicOperations } from '~/composables/useTopicOperations'

import { simpleEventManager, SimpleStoreEventHandler } from '~/services/events/SimpleEventManager'
import { ForumBusinessLogic } from '~/services/forum/ForumBusinessLogic'
import { forumPreloader } from '~/services/forum/ForumPreloader'

export const useForumHomeStore = defineStore('forum-home', (): ForumStore => {
  const sort = ref<ForumAPI.SortMethod>('created')
  const filter = usePathParam<ForumAPI.FilterBy>('type', {
    defaultValue: 'all',
    validValues: ['all', 'bug', 'feat', 'closed'],
    history: 'push',
  })
  const isSearching = ref(false)
  const userSubmittedTopics = ref<ForumAPI.Topic[]>([])

  const forumData = useForumData({
    manual: true,
    autoLoadPinned: true,
  })

  const optimizedTopicList = useOptimizedTopicList()

  const cacheManager = useForumCacheManager(forumData, filter, sort, {
    pageType: 'home',
    preloader: forumPreloader,
    getCacheKey: (filter: ForumAPI.FilterBy) => `${filter}-${sort.value}`,
  })

  const {
    isFilterChanging,
    setCachedData,
    triggerPreload,
    autoTriggerPreload,
    setupFilterWatcher,
    startCacheCleanup,
    cleanup: cleanupCacheManager,
  } = cacheManager

  // === 单一数据源计算属性 ===
  const mergedData = computed(() => {
    if (isSearching.value) {
      return forumData.data.value || []
    }

    return ForumBusinessLogic.mergeTopicsData(
      forumData.data.value,
      userSubmittedTopics.value,
      {
        deduplication: true,
        enableUserFilter: false,
      },
    )
  })

  const displayTopics = computed(() => {
    const topics = mergedData.value
    const filtered = ForumBusinessLogic.filterTopics(topics, filter.value)
    return ForumBusinessLogic.sortTopics(filtered, sort.value)
  })

  const pinnedTopicsData = computed(() => {
    if (forumData.pinnedTopicsData.value && forumData.pinnedTopicsData.value.length > 0) {
      return forumData.pinnedTopicsData.value
    }
    const { pinnedTopics } = ForumBusinessLogic.separatePinnedTopics(mergedData.value)
    return pinnedTopics
  })

  const topicOperations = useTopicOperations(
    {
      data: forumData.data,
      userSubmittedTopics,
      pinnedTopicsData: forumData.pinnedTopicsData,
    },
    {
      pageType: 'home',
      optimizer: optimizedTopicList,
    },
  )

  const eventHandlers = new SimpleStoreEventHandler(topicOperations, {
    pageType: 'home',
  })

  const customEventHandlers = {
    handleCommentCreated: (payload: { topicId: string, comment: ForumAPI.Comment }) => {
      const { topic: targetTopic } = topicOperations.findTopicInLists(payload.topicId)

      if (targetTopic && typeof targetTopic.commentCount === 'number' && targetTopic.commentCount >= 0) {
        const newCommentCount = targetTopic.commentCount + 1
        const currentRelatedComments = targetTopic.relatedComments || []
        const newRelatedComments = [payload.comment, ...currentRelatedComments].slice(0, 3)

        topicOperations.updateTopic(payload.topicId, {
          commentCount: newCommentCount,
          relatedComments: newRelatedComments,
        })
      }
    },

    handleCommentDeleted: (payload: { commentId: string | number, topicId: string }) => {
      const { topic: targetTopic } = topicOperations.findTopicInLists(payload.topicId)

      if (targetTopic && typeof targetTopic.commentCount === 'number' && targetTopic.commentCount > 0) {
        const newCommentCount = targetTopic.commentCount - 1
        const currentRelatedComments = targetTopic.relatedComments || []
        const newRelatedComments = currentRelatedComments.filter(c => c.id !== payload.commentId)

        topicOperations.updateTopic(payload.topicId, {
          commentCount: newCommentCount,
          relatedComments: newRelatedComments,
        })
      }
    },
  }

  const loadForumData = async (queryParams?: ForumQueryParams): Promise<void> => {
    const params = ForumBusinessLogic.buildSearchParams(
      {
        filter: filter.value,
        sort: sort.value,
      },
      undefined,
      queryParams,
    )

    if (!forumData.isInitialized.value) {
      await forumData.loadForumData(params)
    }
    else {
      await forumData.refreshData(params)
    }

    if (forumData.data.value && forumData.data.value.length > 0) {
      const targetFilter = queryParams?.filter || filter.value
      setCachedData(targetFilter, forumData.data.value)
    }

    autoTriggerPreload()
  }

  const searchTopics = async (
    query: string | string[],
    additionalParams?: Omit<ForumQueryParams, 'searchQuery'>,
  ): Promise<void> => {
    if (!query || (Array.isArray(query) && query.length === 0)
      || (typeof query === 'string' && query.trim() === '')) {
      isSearching.value = false
      forumData.initialData()
      await forumData.refreshData()
      return
    }

    isSearching.value = true

    try {
      // 执行搜索
      forumData.initialData()

      const params = ForumBusinessLogic.buildSearchParams(
        {
          filter: filter.value,
          sort: sort.value,
        },
        query,
        additionalParams,
      )

      await forumData.searchTopics(query, params)
    }
    catch (error) {
      isSearching.value = false
      ForumBusinessLogic.handleForumError(error, 'Search Topics')
      throw error
    }
  }

  const resetState = (options?: { reloadData?: boolean, clearUserTopics?: boolean, preserveForBfcache?: boolean }): void => {
    if (options?.preserveForBfcache) {
      eventHandlers.cleanup()
      return
    }

    if (options?.clearUserTopics !== false) {
      userSubmittedTopics.value = []
    }
    isSearching.value = false
    eventHandlers.cleanup()
    forumData.resetState(options)
    optimizedTopicList.setTopics([])
  }

  const cleanup = (): void => {
    eventHandlers.cleanup()
    cleanupCacheManager()
  }

  // === 设置过滤器监听和缓存管理 ===
  setupFilterWatcher(loadForumData)
  startCacheCleanup()

  return {
    sort,
    filter,
    isSearching,
    isFilterChanging,
    userSubmittedTopics,

    data: displayTopics,
    pinnedTopicsData,

    loading: forumData.loading,
    isDataLoading: forumData.isDataLoading,
    totalPage: forumData.totalPage,
    total: forumData.total,
    canLoadMore: forumData.canLoadMore,
    noMore: forumData.noMore,
    isFirstLoad: forumData.isFirstLoad,
    loadStateMessage: forumData.loadStateMessage,

    loadForumData,
    searchTopics,
    loadMoreTopics: forumData.loadMoreTopics,
    resetState,
    cleanup,

    // Topic操作
    ...topicOperations,

    // 预加载
    triggerPreload,

    // 事件管理
    setupEventListeners: () => {
      eventHandlers.setupEventListeners()

      const eventManager = simpleEventManager
      eventManager.subscribe('comment:created', customEventHandlers.handleCommentCreated)
      eventManager.subscribe('comment:deleted', customEventHandlers.handleCommentDeleted)
    },
  }
})

export function createForumHomeStore(_config?: Partial<ForumStoreConfig>) {
  return useForumHomeStore
}
