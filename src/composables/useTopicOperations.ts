import type { Ref } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import { ForumBusinessLogic } from '~/services/forum/ForumBusinessLogic'

export interface TopicOperationsConfig {
  pageType: 'home' | 'user' | 'topic'
  optimizer?: {
    addTopics: (topics: ForumAPI.Topic[], position: 'start' | 'end') => void
    removeTopics: (ids: (string | number)[]) => void
    updateTopic: (id: string, updates: Partial<ForumAPI.Topic>) => void
  }
  currentUser?: Ref<string | null>
}

export interface TopicDataSources {
  data: Ref<ForumAPI.Topic[] | undefined>
  userSubmittedTopics: Ref<ForumAPI.Topic[]>
  pinnedTopicsData?: Ref<ForumAPI.Topic[] | undefined>
}

/**
 * 统一的 Topic 操作管理
 *
 * @example
 * ```ts
 * // 主页使用
 * const topicOperations = useTopicOperations(
 *   { data, userSubmittedTopics, pinnedTopicsData },
 *   { pageType: 'home', optimizer }
 * )
 *
 * // 用户页面使用
 * const topicOperations = useTopicOperations(
 *   { data, userSubmittedTopics },
 *   { pageType: 'user', currentUser: creator }
 * )
 * ```
 */
export function useTopicOperations(
  sources: TopicDataSources,
  config: TopicOperationsConfig,
) {
  const { data, userSubmittedTopics, pinnedTopicsData } = sources
  const { optimizer, currentUser, pageType } = config

  function getAllTopicLists() {
    return [
      { list: data, name: 'main' as const },
      { list: userSubmittedTopics, name: 'userSubmitted' as const },
      ...(pinnedTopicsData ? [{ list: pinnedTopicsData, name: 'pinned' as const }] : []),
    ] as const
  }

  function shouldIncludeTopic(topic: ForumAPI.Topic): boolean {
    if (!currentUser?.value)
      return true
    return topic.user?.login === currentUser.value
  }

  function findTopicInLists(id: ForumAPI.Topic['id']): {
    topic: ForumAPI.Topic | undefined
    location: 'main' | 'userSubmitted' | 'pinned' | null
  } {
    const mainTopic = data.value?.find(t => t.id === id)
    if (mainTopic) {
      return { topic: mainTopic, location: 'main' }
    }

    const userTopic = userSubmittedTopics.value.find(t => t.id === id)
    if (userTopic) {
      return { topic: userTopic, location: 'userSubmitted' }
    }

    if (pinnedTopicsData?.value) {
      const pinnedTopic = pinnedTopicsData.value.find(t => t.id === id)
      if (pinnedTopic) {
        return { topic: pinnedTopic, location: 'pinned' }
      }
    }

    return { topic: undefined, location: null }
  }

  function addTopic(topic: ForumAPI.Topic): void {
    if (!shouldIncludeTopic(topic)) {
      return
    }

    const existsInUserSubmitted = userSubmittedTopics.value.some(t => t.id === topic.id)
    if (!existsInUserSubmitted) {
      userSubmittedTopics.value = [topic, ...userSubmittedTopics.value]
    }

    optimizer?.addTopics([topic], 'start')
  }

  function removeTopic(id: ForumAPI.Topic['id']): void {
    userSubmittedTopics.value = userSubmittedTopics.value.filter(t => t.id !== id)
    optimizer?.removeTopics([id])
  }

  function updateTopicInAllLists(
    id: ForumAPI.Topic['id'],
    updater: (topic: ForumAPI.Topic) => void,
  ): boolean {
    let updated = false

    getAllTopicLists().forEach(({ list }) => {
      const topic = list.value?.find(t => t.id === id)
      if (topic) {
        updater(topic)
        updated = true
      }
    })

    return updated
  }

  function updateTopic(
    id: ForumAPI.Topic['id'],
    updates: Partial<ForumAPI.Topic>,
  ): void {
    updateTopicInAllLists(id, (topic) => {
      Object.assign(topic, updates)
    })

    optimizer?.updateTopic(String(id), updates)
  }

  function replaceTopicTags(
    id: ForumAPI.Topic['id'],
    tags: ForumAPI.Topic['tags'],
  ): void {
    updateTopic(id, { tags })
  }

  function changeTopicType(
    id: ForumAPI.Topic['id'],
    type: ForumAPI.TopicType,
  ): void {
    updateTopic(id, { type })
  }

  /**
   * PinnedTopicsData 可能来自 API 专门获取，需手动同步以保持 UI 一致
   */
  function changeTopicPinState(
    id: ForumAPI.Topic['id'],
    pinned: boolean,
  ): void {
    updateTopic(id, { pinned })

    // 主页特有：同步管理置顶列表
    if (pageType === 'home' && pinnedTopicsData?.value) {
      if (pinned) {
        // 添加到置顶列表
        const existsInPinned = pinnedTopicsData.value.some(t => t.id === id)
        if (!existsInPinned) {
          const { topic } = findTopicInLists(id)
          if (topic) {
            pinnedTopicsData.value = [{ ...topic, pinned: true }, ...pinnedTopicsData.value]
          }
        }
      }
      else {
        // 从置顶列表移除
        pinnedTopicsData.value = pinnedTopicsData.value.filter(t => t.id !== id)
      }
    }
  }

  /**
   * 更新 topic 可见性
   * - 隐藏的 topic: 从 userSubmittedTopics 中移除，更新 state 为 'progressing'
   * - 关闭的 topic: 从所有列表中移除，更新 state 为 'closed'
   */
  function updateTopicVisibility(
    id: ForumAPI.Topic['id'],
    updates: { hidden?: boolean, closed?: boolean },
  ): void {
    const stateUpdate = ForumBusinessLogic.updateTopicVisibility(null, updates)

    // 隐藏的 topic 从 userSubmittedTopics 中移除
    if (updates.hidden === true) {
      userSubmittedTopics.value = userSubmittedTopics.value.filter(t => t.id !== id)
    }

    // 关闭的 topic 从所有列表中移除
    if (updates.closed === true) {
      removeTopic(id)
      return
    }

    updateTopic(id, stateUpdate)
  }

  return {
    // 核心操作
    findTopicInLists,
    addTopic,
    removeTopic,
    updateTopic,
    updateTopicInAllLists,

    // 便捷方法
    replaceTopicTags,
    changeTopicType,
    changeTopicPinState,
    updateTopicVisibility,
  }
}

export type TopicOperations = ReturnType<typeof useTopicOperations>
