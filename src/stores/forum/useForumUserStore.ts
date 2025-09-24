import type ForumAPI from '@/apis/forum/api'
import type { ForumQueryParams } from '~/types/forum/simplified'
import type { UserForumStore } from '~/types/forum/simplified'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useForumData } from '~/composables/useForumData'
import { useTopicCache } from '~/composables/useTopicCache'
import { useForumCacheManager } from '~/composables/useForumCacheManager'
import { simpleCrossPageSync } from '~/services/events/SimpleCrossPageSync'
import { SimpleStoreEventHandler } from '~/services/events/SimpleEventManager'
import { userPreloader } from '~/services/forum/ForumPreloader'

/**
 * 优化的用户页面Store
 * 使用统一的缓存管理器
 */
export const useForumUserStore = defineStore('forum-user', (): UserForumStore => {
  // 基础状态
  const sort = ref<ForumAPI.SortMethod>('created')
  const filter = ref<ForumAPI.FilterBy>('all')
  const isSearching = ref(false)
  const creator = ref<string | null>(null)

  // 用户提交的topics
  const userSubmittedTopics = ref<ForumAPI.Topic[]>([])

  // 数据管理（用户页面不需要自动加载置顶）
  const forumData = useForumData({
    manual: true,
    autoLoadPinned: false,
  })

  // 缓存管理
  const topicCache = useTopicCache()

  // === 通用缓存管理器 ===
  const cacheManager = useForumCacheManager(forumData, filter, sort, {
    pageType: 'user',
    preloader: userPreloader,
    getCacheKey: (filter: ForumAPI.FilterBy, metadata?: any) => `user-${metadata}-${filter}`,
    getMetadata: () => creator.value
  })

  // 从缓存管理器获取状态和功能
  const {
    isFilterChanging,
    setCachedData,
    triggerPreload,
    autoTriggerPreload,
    setupFilterWatcher,
    startCacheCleanup,
    cleanup: cleanupCacheManager
  } = cacheManager


  // 单一数据源的计算属性
  const userTopicData = computed(() => {
    if (isSearching.value) {
      return forumData.data.value || []
    }

    // 统一数据源：合并API数据和用户提交数据
    const apiTopics = forumData.data.value || []
    const userTopics = userSubmittedTopics.value || []

    // 使用Map去重和过滤
    const topicMap = new Map<string | number, ForumAPI.Topic>()

    // 先添加API数据，只保留当前用户的
    apiTopics.forEach((topic) => {
      if (creator.value && topic.user?.login === creator.value) {
        topicMap.set(topic.id, topic)
      }
    })
    // 再添加用户提交数据（会覆盖重复的）
    userTopics.forEach((topic) => {
      if (creator.value && topic.user?.login === creator.value) {
        topicMap.set(topic.id, topic)
      }
    })

    return Array.from(topicMap.values())
  })

  const displayTopics = computed(() => {
    const topics = userTopicData.value

    // 应用排序
    switch (sort.value) {
      case 'created':
        return topics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'updated_at':
        return topics.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      default:
        return topics
    }
  })

  // 简化的topic操作方法（兼容原有接口）
  const topicOperations = {
    // 兼容方法：查找方法
    findTopicInLists: (id: ForumAPI.Topic['id']) => {
      const cachedTopic = topicCache.getCachedTopic(id)
      if (cachedTopic) {
        return { topic: cachedTopic, location: 'cache' as const }
      }

      const mainTopic = forumData.data.value?.find(t => t.id === id)
      if (mainTopic) {
        return { topic: mainTopic, location: 'main' as const }
      }

      const userTopic = userSubmittedTopics.value.find(t => t.id === id)
      if (userTopic) {
        return { topic: userTopic, location: 'userSubmitted' as const }
      }

      return { topic: undefined, location: null }
    },

    // 兼容方法：更新所有列表（符合原有接口）
    updateTopicInAllLists: (id: ForumAPI.Topic['id'], updater: (topic: ForumAPI.Topic) => void): boolean => {
      let updated = false

      // 更新用户数据
      const userTopic = userSubmittedTopics.value.find(t => t.id === id)
      if (userTopic) {
        updater(userTopic)
        topicCache.setCachedTopic(userTopic)
        updated = true
      }

      // 更新主数据
      const mainTopic = forumData.data.value?.find(t => t.id === id)
      if (mainTopic) {
        updater(mainTopic)
        topicCache.setCachedTopic(mainTopic)
        updated = true
      }

      return updated
    },
    addTopic: (topic: ForumAPI.Topic) => {
      // 只有当前用户的topic才添加到用户提交列表
      if (creator.value && topic.user?.login === creator.value) {
        topicCache.setCachedTopic(topic)

        const existsInUserSubmitted = userSubmittedTopics.value.some(t => t.id === topic.id)
        if (!existsInUserSubmitted) {
          userSubmittedTopics.value.unshift(topic)
        }

        // 单一数据源模式：通过computed属性自动处理数据合并
      }
    },

    removeTopic: (id: ForumAPI.Topic['id']) => {
      topicCache.removeCachedTopic(id)
      userSubmittedTopics.value = userSubmittedTopics.value.filter(t => t.id !== id)
      // 单一数据源模式：通过computed属性自动更新显示
    },

    updateTopic: (id: ForumAPI.Topic['id'], updates: Partial<ForumAPI.Topic>) => {
      // 使用兼容方法（符合原有接口）
      topicOperations.updateTopicInAllLists(id, (topic) => {
        Object.assign(topic, updates)
      })
    },

    replaceTopicTags: (id: ForumAPI.Topic['id'], tags: ForumAPI.Topic['tags']) => {
      topicOperations.updateTopic(id, { tags })
    },

    changeTopicType: (id: ForumAPI.Topic['id'], type: ForumAPI.TopicType) => {
      topicOperations.updateTopic(id, { type })
    },

    changeTopicPinState: (id: ForumAPI.Topic['id'], pinned: boolean) => {
      topicOperations.updateTopic(id, { pinned })
    },

    updateTopicVisibility: (id: ForumAPI.Topic['id'], updates: { hidden?: boolean, closed?: boolean }) => {
      const stateUpdate: Partial<ForumAPI.Topic> = {}

      if (updates.hidden !== undefined) {
        stateUpdate.state = updates.hidden ? 'progressing' : 'open'
      }
      if (updates.closed !== undefined) {
        stateUpdate.state = updates.closed ? 'closed' : 'open'
      }

      topicOperations.updateTopic(id, stateUpdate)
    },
  }

  // 事件处理（传入creator引用，使用新的类型安全实现）
  const eventHandlers = new SimpleStoreEventHandler(topicOperations, {
    pageType: 'user',
    currentUser: creator.value,
  })

  // 用户特定的数据加载方法
  const loadUserData = async (username: string): Promise<void> => {
    // 重置状态（内联避免use before define）
    userSubmittedTopics.value = []
    isSearching.value = false
    topicCache.clearCache()
    eventHandlers.cleanup()
    forumData.resetState()

    creator.value = username

    // 加载用户数据，默认显示所有open状态的topics
    await forumData.refreshData({
      creator: username,
      filter: 'all',
    })

    // 保存初始数据到缓存
    if (forumData.data.value && forumData.data.value.length > 0) {
      setCachedData('all', forumData.data.value)
    }

    // 数据加载完成后自动触发预加载（仅一次）
    autoTriggerPreload()
  }

  const loadForumData = async (queryParams?: ForumQueryParams): Promise<void> => {
    const params = {
      creator: creator.value,
      filter: filter.value,
      sort: sort.value,
      ...queryParams,
    }

    await forumData.refreshData(params)

    // 保存加载的数据到缓存
    if (forumData.data.value && forumData.data.value.length > 0) {
      const targetFilter = queryParams?.filter || filter.value
      setCachedData(targetFilter, forumData.data.value)
    }
  }

  const searchTopics = async (query: string | string[], additionalParams?: Omit<ForumQueryParams, 'searchQuery'>): Promise<void> => {
    if (!query || (Array.isArray(query) && query.length === 0) || (typeof query === 'string' && query.trim() === '')) {
      isSearching.value = false
      forumData.initialData()
      await forumData.refreshData()
      return
    }

    isSearching.value = true
    try {
      forumData.initialData()
      await forumData.searchTopics(query, {
        creator: creator.value,
        filter: filter.value,
        sort: sort.value,
        ...additionalParams,
      })
    }
    catch (error) {
      isSearching.value = false
      throw error
    }
  }

  const resetState = (options?: { reloadData?: boolean, clearUserTopics?: boolean }): void => {
    if (options?.clearUserTopics !== false) {
      userSubmittedTopics.value = []
    }
    isSearching.value = false
    topicCache.clearCache()
    eventHandlers.cleanup()
    forumData.resetState(options)
  }

  const cleanup = (): void => {
    eventHandlers.cleanup()
    topicCache.clearCache()
    cleanupCacheManager()
  }

  // === 设置过滤器监听和缓存管理 ===
  setupFilterWatcher(loadForumData)
  startCacheCleanup()

  return {
    // 状态
    sort,
    filter,
    isSearching,
    isFilterChanging,
    creator,
    userSubmittedTopics,

    // 计算属性 - 统一的数据视图
    data: displayTopics, // 为了兼容现有接口
    pinnedTopicsData: computed(() => []), // 用户页面不需要置顶数据

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
    loadUserData,
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
      // 启用跨页面同步
      simpleCrossPageSync.enable()
    },
  }
})
