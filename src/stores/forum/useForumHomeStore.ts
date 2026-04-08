import type ForumAPI from '@/apis/forum/api'
import type { ForumQueryParams, ForumStore, ForumStoreConfig } from '~/types/forum/simplified'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { useForumCacheManager } from '~/composables/useForumCacheManager'
// 基础功能
import { useForumData } from '~/composables/useForumData'
import { useOptimizedTopicList } from '~/composables/useStorePerformanceOptimizer'
import { useTopicOperations } from '~/composables/useTopicOperations'
import { useUrlFilterSync } from '~/composables/useUrlFilterSync'

import { simpleEventManager, SimpleStoreEventHandler } from '~/services/events/SimpleEventManager'
// 业务逻辑和服务
import { ForumBusinessLogic } from '~/services/forum/ForumBusinessLogic'
import { forumPreloader } from '~/services/forum/ForumPreloader'

export const useForumHomeStore = defineStore('forum-home', (): ForumStore => {
  // === 基础状态管理 ===
  const sort = ref<ForumAPI.SortMethod>('created')
  const filter = ref<ForumAPI.FilterBy>('all')
  const isSearching = ref(false)

  // === 数据管理 ===
  const userSubmittedTopics = ref<ForumAPI.Topic[]>([])

  // URL同步
  const urlFilterSync = useUrlFilterSync(filter, '🏠')

  // 数据层
  const forumData = useForumData({
    manual: true,
    autoLoadPinned: true,
  })

  // 性能优化的topic管理
  const optimizedTopicList = useOptimizedTopicList()

  // === 通用缓存管理器 ===
  const cacheManager = useForumCacheManager(forumData, filter, sort, {
    pageType: 'home',
    preloader: forumPreloader,
    getCacheKey: (filter: ForumAPI.FilterBy) => `${filter}-${sort.value}`,
  })

  // 从缓存管理器获取状态和功能
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
    // 过滤掉关闭的topics
    const filtered = ForumBusinessLogic.filterTopics(topics, filter.value)
    return ForumBusinessLogic.sortTopics(filtered, sort.value)
  })

  const pinnedTopicsData = computed(() => {
    // 优先使用API专门获取的置顶主题数据
    if (forumData.pinnedTopicsData.value && forumData.pinnedTopicsData.value.length > 0) {
      return forumData.pinnedTopicsData.value
    }

    // 如果API数据不可用，从合并数据中筛选置顶主题作为备选
    const { pinnedTopics } = ForumBusinessLogic.separatePinnedTopics(mergedData.value)
    return pinnedTopics
  })

  // === 统一的 Topic 操作 ===
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

  // === 简化事件处理 ===
  const eventHandlers = new SimpleStoreEventHandler(topicOperations, {
    pageType: 'home',
  })

  // === 自定义事件处理 ===
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

  // === 数据加载操作 ===
  const loadForumData = async (queryParams?: ForumQueryParams): Promise<void> => {
    const params = ForumBusinessLogic.buildSearchParams(
      {
        filter: filter.value,
        sort: sort.value,
      },
      undefined,
      queryParams,
    )

    // 如果是首次加载，使用 loadForumData 确保置顶主题也被加载
    if (!forumData.isInitialized.value) {
      await forumData.loadForumData(params)
    }
    else {
      // 后续刷新使用 refreshData
      await forumData.refreshData(params)
    }

    // 保存加载的数据到缓存
    if (forumData.data.value && forumData.data.value.length > 0) {
      const targetFilter = queryParams?.filter || filter.value
      setCachedData(targetFilter, forumData.data.value)
    }

    // 初始数据加载完成后自动触发预加载（仅一次）
    autoTriggerPreload()
  }

  const searchTopics = async (
    query: string | string[],
    additionalParams?: Omit<ForumQueryParams, 'searchQuery'>,
  ): Promise<void> => {
    // 空查询处理
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
      const errorInfo = ForumBusinessLogic.handleForumError(error, 'Search Topics')
      console.error('Search error:', errorInfo)
      throw error
    }
  }

  // === 状态管理操作 ===
  const resetState = (options?: { reloadData?: boolean, clearUserTopics?: boolean, preserveForBfcache?: boolean }): void => {
    // If preserving for bfcache, only do minimal cleanup
    if (options?.preserveForBfcache) {
      eventHandlers.cleanup()
      return
    }

    if (options?.clearUserTopics !== false) {
      userSubmittedTopics.value = []
    }
    isSearching.value = false

    // 清理事件
    eventHandlers.cleanup()

    // 重置数据层
    forumData.resetState(options)

    // 清理性能优化组件
    optimizedTopicList.setTopics([])
  }

  const cleanup = (): void => {
    eventHandlers.cleanup()
    urlFilterSync?.cleanup()
    cleanupCacheManager()
  }

  // === 设置过滤器监听和缓存管理 ===
  setupFilterWatcher(loadForumData)
  startCacheCleanup()

  // === 返回Store接口 ===
  return {
    // 状态
    sort,
    filter,
    isSearching,
    isFilterChanging,
    userSubmittedTopics,

    // 数据视图
    data: displayTopics,
    pinnedTopicsData,

    // 从forumData继承的状态
    loading: forumData.loading,
    isDataLoading: forumData.isDataLoading,
    totalPage: forumData.totalPage,
    total: forumData.total,
    canLoadMore: forumData.canLoadMore,
    noMore: forumData.noMore,
    isFirstLoad: forumData.isFirstLoad,
    loadStateMessage: forumData.loadStateMessage,

    // 操作方法
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

      // 注册自定义事件处理器
      const eventManager = simpleEventManager
      eventManager.subscribe('comment:created', customEventHandlers.handleCommentCreated)
      eventManager.subscribe('comment:deleted', customEventHandlers.handleCommentDeleted)

      // 跨页面同步已自动启用
    },
  }
})

/**
 * 性能监控装饰器
 * 为关键操作添加性能监控
 */
export function useForumHomeStoreWithMonitoring() {
  const store = useForumHomeStore()

  // 包装关键操作以添加性能监控
  const originalLoadForumData = store.loadForumData
  store.loadForumData = async (params?: ForumQueryParams) => {
    const start = performance.now()
    try {
      await originalLoadForumData(params)
    }
    finally {
      const duration = performance.now() - start
      if (duration > 1000) {
        console.warn(`loadForumData took ${duration.toFixed(2)}ms`)
      }
    }
  }

  const originalSearchTopics = store.searchTopics
  store.searchTopics = async (query: string | string[], params?: Omit<ForumQueryParams, 'searchQuery'>) => {
    const start = performance.now()
    try {
      await originalSearchTopics(query, params)
    }
    finally {
      const duration = performance.now() - start
      if (duration > 800) {
        console.warn(`searchTopics took ${duration.toFixed(2)}ms`)
      }
    }
  }

  return store
}

// 导出配置化版本
export function createForumHomeStore(config?: Partial<ForumStoreConfig>) {
  const finalConfig: ForumStoreConfig = {
    pageType: 'home',
    autoLoadPinned: true,
    manual: true,
    ...config,
  }

  if (finalConfig.manual) {
    return useForumHomeStore
  }
  else {
    return useForumHomeStoreWithMonitoring
  }
}
