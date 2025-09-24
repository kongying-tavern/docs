import type { Ref } from 'vue'
import type { useTopicCache } from './useTopicCache'
import type ForumAPI from '@/apis/forum/api'

export interface TopicOperationsConfig {
  pageType: 'home' | 'user' | 'topic'
  logPrefix?: string
}

export function useTopicOperations(
  data: Ref<ForumAPI.Topic[] | undefined>,
  userSubmittedTopic: Ref<ForumAPI.Topic[]>,
  pinnedTopicsData: Ref<ForumAPI.Topic[] | undefined> | undefined,
  topicCache: ReturnType<typeof useTopicCache>,
  config: TopicOperationsConfig,
) {
  // Helper function to get all topic lists for iteration
  function getAllTopicLists() {
    return [
      { list: data, name: 'main' },
      { list: userSubmittedTopic, name: 'userSubmitted' },
      ...(pinnedTopicsData ? [{ list: pinnedTopicsData, name: 'pinned' }] : []),
    ] as const
  }

  function findTopicInLists(id: ForumAPI.Topic['id']): {
    topic: ForumAPI.Topic | undefined
    location: 'cache' | 'main' | 'userSubmitted' | 'pinned' | null
  } {
    // Check cache first
    const cachedTopic = topicCache.getCachedTopic(id)
    if (cachedTopic) {
      return { topic: cachedTopic, location: 'cache' }
    }

    // Check main data
    const mainTopic = data.value?.find(t => t.id === id)
    if (mainTopic) {
      topicCache.setCachedTopic(mainTopic)
      return { topic: mainTopic, location: 'main' }
    }

    // Check user submitted topics
    const userTopic = userSubmittedTopic.value.find(t => t.id === id)
    if (userTopic) {
      topicCache.setCachedTopic(userTopic)
      return { topic: userTopic, location: 'userSubmitted' }
    }

    // Check pinned topics (if available)
    if (pinnedTopicsData?.value) {
      const pinnedTopic = pinnedTopicsData.value.find(t => t.id === id)
      if (pinnedTopic) {
        topicCache.setCachedTopic(pinnedTopic)
        return { topic: pinnedTopic, location: 'pinned' }
      }
    }

    return { topic: undefined, location: null }
  }

  function addTopic(topic: ForumAPI.Topic): void {
    // Update cache
    topicCache.setCachedTopic(topic)

    // Check if topic already exists in userSubmittedTopic to prevent duplicates
    const existsInUserSubmitted = userSubmittedTopic.value.some(t => t.id === topic.id)
    if (!existsInUserSubmitted) {
      // Force reactivity by replacing the entire array
      const currentTopics = [...userSubmittedTopic.value]
      userSubmittedTopic.value = [topic, ...currentTopics]
    }

    // Remove from main data if exists to prevent duplication
    if (data.value) {
      const existsInMainData = data.value.some(t => t.id === topic.id)
      if (existsInMainData) {
        data.value = data.value.filter(t => t.id !== topic.id)
      }
    }
  }

  function removeTopic(id: ForumAPI.Topic['id']): void {
    // Remove from cache
    topicCache.removeCachedTopic(id)

    // Remove from all topic lists
    getAllTopicLists().forEach(({ list }) => {
      if (list.value) {
        list.value = list.value.filter(t => t.id !== id)
      }
    })
  }

  function updateTopicInAllLists(id: ForumAPI.Topic['id'], updater: (topic: ForumAPI.Topic) => void): boolean {
    let updated = false

    // Update in all topic lists
    getAllTopicLists().forEach(({ list }) => {
      const topic = list.value?.find(t => t.id === id)
      if (topic) {
        updater(topic)
        topicCache.setCachedTopic(topic)
        updated = true
      }
    })

    return updated
  }

  function replaceTopicTags(id: ForumAPI.Topic['id'], tags: ForumAPI.Topic['tags']): void {
    updateTopicInAllLists(id, (topic) => {
      topic.tags = tags
    })
  }

  function changeTopicType(id: ForumAPI.Topic['id'], type: ForumAPI.TopicType): void {
    updateTopicInAllLists(id, (topic) => {
      topic.type = type
    })
  }

  function changeTopicPinState(id: ForumAPI.Topic['id'], pinned: boolean): void {
    updateTopicInAllLists(id, (topic) => {
      topic.pinned = pinned
    })

    // Handle pinnedTopicsData list management (only for home store)
    if (config.pageType === 'home' && pinnedTopicsData?.value) {
      if (pinned) {
        // Add to pinned list if not already there
        const existsInPinned = pinnedTopicsData?.value?.some(t => t.id === id)
        if (!existsInPinned) {
          const { topic } = findTopicInLists(id)
          if (topic && pinnedTopicsData?.value) {
            pinnedTopicsData.value.unshift({ ...topic, pinned: true })
          }
        }
      }
      else if (pinnedTopicsData?.value) {
        // Remove from pinned list
        pinnedTopicsData.value = pinnedTopicsData.value.filter(t => t.id !== id)
      }
    }
  }

  function updateTopicVisibility(id: ForumAPI.Topic['id'], updates: { hidden?: boolean, closed?: boolean }): void {
    updateTopicInAllLists(id, (topic) => {
      Object.assign(topic, updates)
    })
  }

  return {
    findTopicInLists,
    addTopic,
    removeTopic,
    updateTopicInAllLists,
    replaceTopicTags,
    changeTopicType,
    changeTopicPinState,
    updateTopicVisibility,
  }
}
