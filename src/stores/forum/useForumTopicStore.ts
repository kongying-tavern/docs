import type ForumAPI from '@/apis/forum/api'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useForumData } from '~/composables/useForumData'
import { useTopicCache } from '~/composables/useTopicCache'
import { SimpleStoreEventHandler } from '~/services/events/SimpleEventManager'

/**
 * 优化的话题页面Store
 * 专门用于单个话题页面的数据管理
 */
export const useForumTopicStore = defineStore('forum-topic', () => {
  // 基础状态
  const currentTopicId = ref<string | number | null>(null)
  const topicDetail = ref<ForumAPI.Topic | null>(null)

  // 数据管理（话题页面不需要批量数据加载）
  const forumData = useForumData({
    manual: true,
    autoLoadPinned: false,
  })

  // 缓存管理
  const topicCache = useTopicCache()

  // 简化的topic操作方法（兼容原有接口）
  const topicOperations = {
    // 兼容方法：查找方法
    findTopicInLists: (id: ForumAPI.Topic['id']) => {
      const cachedTopic = topicCache.getCachedTopic(id)
      if (cachedTopic) {
        return { topic: cachedTopic, location: 'cache' as const }
      }
      if (topicDetail.value && topicDetail.value.id === id) {
        return { topic: topicDetail.value, location: 'main' as const }
      }
      return { topic: undefined, location: null }
    },

    // 兼容方法：更新所有列表（符合原有接口）
    updateTopicInAllLists: (id: ForumAPI.Topic['id'], updater: (topic: ForumAPI.Topic) => void): boolean => {
      if (topicDetail.value && topicDetail.value.id === id) {
        updater(topicDetail.value)
        topicCache.setCachedTopic(topicDetail.value)
        return true
      }
      return false
    },

    // Topic操作方法
    addTopic: (topic: ForumAPI.Topic) => {
      topicOperations.setCurrentTopic(topic)
    },

    removeTopic: (id: ForumAPI.Topic['id']) => {
      if (topicDetail.value && topicDetail.value.id === id) {
        topicDetail.value = null
        currentTopicId.value = null
      }
      topicCache.removeCachedTopic(id)
    },

    updateTopic: (id: ForumAPI.Topic['id'], updates: Partial<ForumAPI.Topic>) => {
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

    // 内部方法（保留原有功能）
    setCurrentTopic: (topic: ForumAPI.Topic) => {
      topicDetail.value = topic
      currentTopicId.value = topic.id
      topicCache.setCachedTopic(topic)
    },

    updateCurrentTopic: (updates: Partial<ForumAPI.Topic>) => {
      if (topicDetail.value) {
        Object.assign(topicDetail.value, updates)
        topicCache.setCachedTopic(topicDetail.value)
      }
    },
  }

  // 事件处理（传入null作为creator，因为话题页面不需要creator过滤，使用新的类型安全实现）
  const eventHandlers = new SimpleStoreEventHandler(topicOperations, {
    pageType: 'topic',
    currentUser: null,
  })

  // 话题页面专用的数据加载方法
  const loadTopicData = async (topicId: string | number): Promise<void> => {
    currentTopicId.value = topicId

    // 检查缓存
    const cached = topicCache.getCachedTopic(topicId)
    if (cached) {
      topicDetail.value = cached
      return
    }

    // 从API加载单个话题
    // 这里应该调用专门的单话题加载API，而不是列表API
    // 暂时使用现有的forumData结构，后续可以重构
    await forumData.refreshData({
      filter: 'all',
      sort: 'created',
      // 其他必要的查询参数
    })

    if (forumData.data.value && forumData.data.value.length > 0) {
      topicDetail.value = forumData.data.value[0]
      topicCache.setCachedTopic(topicDetail.value)
    }
  }

  const resetState = (): void => {
    currentTopicId.value = null
    topicDetail.value = null
    topicCache.clearCache()
    eventHandlers.cleanup()
    forumData.resetState()
  }

  const cleanup = (): void => {
    eventHandlers.cleanup()
    topicCache.clearCache()
  }

  return {
    // 状态
    currentTopicId,
    topicDetail,

    // 计算属性 - 为了兼容现有接口
    data: computed(() => topicDetail.value ? [topicDetail.value] : []),
    pinnedTopicsData: computed(() => []), // 话题页面不需要置顶数据

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
    loadTopicData,
    resetState,
    cleanup,

    // Topic操作
    ...topicOperations,

    // 事件管理
    setupEventListeners: () => {
      eventHandlers.setupEventListeners()
      // 跨页面同步已自动启用
    },
  }
})
