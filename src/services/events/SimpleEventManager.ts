import type ForumAPI from '@/apis/forum/api'
import { LRUCacheWithTTL } from '~/utils/LRUCacheWithTTL'

/**
 * 便捷的事件发布函数定义
 * EventMap 将从这些函数自动推断类型
 */
const eventDefinitions = {
  // Topic events
  topicCreated: (topic: ForumAPI.Topic) => ({ topic }),
  topicUpdated: (id: string, updates: Partial<ForumAPI.Topic>) => ({ id, updates }),
  topicDeleted: (id: string) => ({ id }),
  topicPinned: (id: string, pinned: boolean) => ({ id, pinned }),
  topicVisibilityChanged: (id: string, updates: { hidden?: boolean, closed?: boolean }) => ({ id, ...updates }),
  topicClosed: (id: string, closed: boolean) => ({ id, closed }),
  topicHidden: (id: string, hidden: boolean) => ({ id, hidden }),
  topicTagsUpdated: (id: string, tags: string[]) => ({ id, tags }),
  topicTypeChanged: (id: string, type: ForumAPI.TopicType) => ({ id, type }),

  // Comment events
  commentCreated: (commentId: string | number, topicId: string, comment: ForumAPI.Comment) => ({ commentId, topicId, comment }),
  commentDeleted: (commentId: string | number, topicId: string) => ({ commentId, topicId }),
} as const

export const forumEvents = {
  // Topic events - 实际发出事件
  topicCreated: (topic: ForumAPI.Topic) => {
    SimpleEventManager.getInstance().emit('topic:created', eventDefinitions.topicCreated(topic))
  },
  topicUpdated: (id: string, updates: Partial<ForumAPI.Topic>) => {
    SimpleEventManager.getInstance().emit('topic:updated', eventDefinitions.topicUpdated(id, updates))
  },
  topicDeleted: (id: string) => {
    SimpleEventManager.getInstance().emit('topic:deleted', eventDefinitions.topicDeleted(id))
  },
  topicPinned: (id: string, pinned: boolean) => {
    SimpleEventManager.getInstance().emit('topic:pinned', eventDefinitions.topicPinned(id, pinned))
  },
  topicVisibilityChanged: (id: string, updates: { hidden?: boolean, closed?: boolean }) => {
    SimpleEventManager.getInstance().emit('topic:visibility-changed', eventDefinitions.topicVisibilityChanged(id, updates))
  },
  topicClosed: (id: string, closed: boolean) => {
    SimpleEventManager.getInstance().emit('topic:closed', eventDefinitions.topicClosed(id, closed))
  },
  topicHidden: (id: string, hidden: boolean) => {
    SimpleEventManager.getInstance().emit('topic:hidden', eventDefinitions.topicHidden(id, hidden))
  },
  topicTagsUpdated: (id: string, tags: string[]) => {
    SimpleEventManager.getInstance().emit('topic:tags-updated', eventDefinitions.topicTagsUpdated(id, tags))
  },
  topicTypeChanged: (id: string, type: ForumAPI.TopicType) => {
    SimpleEventManager.getInstance().emit('topic:type-changed', eventDefinitions.topicTypeChanged(id, type))
  },

  // Comment events - 实际发出事件
  commentCreated: (commentId: string | number, topicId: string, comment: ForumAPI.Comment) => {
    SimpleEventManager.getInstance().emit('comment:created', eventDefinitions.commentCreated(commentId, topicId, comment))
  },
  commentDeleted: (commentId: string | number, topicId: string) => {
    SimpleEventManager.getInstance().emit('comment:deleted', eventDefinitions.commentDeleted(commentId, topicId))
  },
}

/**
 * 简化版本：直接手动映射事件类型
 * 从 forumEvents 函数定义推断有效载荷类型
 */
export interface EventMap {
  // Topic events (从 eventDefinitions 函数推断)
  'topic:created': ReturnType<typeof eventDefinitions.topicCreated>
  'topic:updated': ReturnType<typeof eventDefinitions.topicUpdated>
  'topic:deleted': ReturnType<typeof eventDefinitions.topicDeleted>
  'topic:pinned': ReturnType<typeof eventDefinitions.topicPinned>
  'topic:visibility-changed': ReturnType<typeof eventDefinitions.topicVisibilityChanged>
  'topic:closed': ReturnType<typeof eventDefinitions.topicClosed>
  'topic:hidden': ReturnType<typeof eventDefinitions.topicHidden>
  'topic:tags-updated': ReturnType<typeof eventDefinitions.topicTagsUpdated>
  'topic:type-changed': ReturnType<typeof eventDefinitions.topicTypeChanged>

  // Comment events (从 eventDefinitions 函数推断)
  'comment:created': ReturnType<typeof eventDefinitions.commentCreated>
  'comment:deleted': ReturnType<typeof eventDefinitions.commentDeleted>
}

export type EventHandler<T> = (payload: T) => void
export type EventUnsubscribe = () => void

/**
 * 事件处理器映射类型 - 为每个事件存储其特定的处理器
 */
type EventHandlerMap = {
  [K in keyof EventMap]: EventHandler<EventMap[K]>[]
}

/**
 * 类型安全的事件管理器
 * 使用类型化的 Map 结构避免 unknown 类型
 */
export class SimpleEventManager {
  private static instance: SimpleEventManager
  private listenersByEvent: Partial<EventHandlerMap> = {}

  private constructor() {}

  static getInstance(): SimpleEventManager {
    if (!SimpleEventManager.instance) {
      SimpleEventManager.instance = new SimpleEventManager()
    }
    return SimpleEventManager.instance
  }

  /**
   * 订阅事件 - 完全类型安全的接口
   */
  subscribe<K extends keyof EventMap>(
    eventType: K,
    handler: EventHandler<EventMap[K]>,
  ): EventUnsubscribe {
    if (!this.listenersByEvent[eventType]) {
      this.listenersByEvent[eventType] = []
    }

    const handlers = this.listenersByEvent[eventType]!
    handlers.push(handler)

    // 返回取消订阅函数
    return () => {
      const currentHandlers = this.listenersByEvent[eventType]
      if (currentHandlers) {
        const index = currentHandlers.indexOf(handler)
        if (index > -1) {
          currentHandlers.splice(index, 1)
        }
        if (currentHandlers.length === 0) {
          delete this.listenersByEvent[eventType]
        }
      }
    }
  }

  /**
   * 发布事件 - 完全类型安全的接口
   */
  emit<K extends keyof EventMap>(eventType: K, payload: EventMap[K]): void {
    const handlers = this.listenersByEvent[eventType]

    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload)
        }
        catch {
          // Event handler error - silent fail
        }
      })
    }
  }

  /**
   * 清理指定事件的所有监听器
   */
  clearListeners<K extends keyof EventMap>(eventType?: K): void {
    if (eventType) {
      delete this.listenersByEvent[eventType]
    }
    else {
      this.listenersByEvent = {}
    }
  }
}

export class SimpleStoreEventHandler {
  private unsubscribers: EventUnsubscribe[] = []
  private eventManager = SimpleEventManager.getInstance()
  /** 500ms 去重窗口，防止快速重复事件 */
  private recentEvents = new LRUCacheWithTTL<string, boolean>(100, 500)

  constructor(
    private topicOperations: {
      addTopic: (topic: ForumAPI.Topic) => void
      removeTopic: (id: string) => void
      updateTopic: (id: string, updates: Partial<ForumAPI.Topic>) => void
      replaceTopicTags: (id: string, tags: string[]) => void
      changeTopicType: (id: string, type: ForumAPI.TopicType) => void
      changeTopicPinState: (id: string, pinned: boolean) => void
      updateTopicVisibility: (id: string, updates: { hidden?: boolean, closed?: boolean }) => void
    },
    _options: {
      pageType: 'home' | 'user' | 'topic'
      currentUser?: string | null
    },
  ) {}

  private isRecentStoreEvent(eventType: string, topicId: string): boolean {
    const key = `${eventType}-${topicId}`
    if (this.recentEvents.has(key)) {
      return true
    }
    this.recentEvents.set(key, true)
    return false
  }

  setupEventListeners(): void {
    // Topic创建事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:created', (payload) => {
        if (this.isRecentStoreEvent('created', payload.topic.id))
          return
        this.topicOperations.addTopic(payload.topic)
      }),
    )

    // Topic更新事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:updated', (payload) => {
        if (this.isRecentStoreEvent('updated', payload.id))
          return
        this.topicOperations.updateTopic(payload.id, payload.updates)
      }),
    )

    // Topic删除事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:deleted', (payload) => {
        if (this.isRecentStoreEvent('deleted', payload.id))
          return
        this.topicOperations.removeTopic(payload.id)
      }),
    )

    // Topic置顶事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:pinned', (payload) => {
        if (this.isRecentStoreEvent('pinned', payload.id))
          return
        this.topicOperations.changeTopicPinState(payload.id, payload.pinned)
      }),
    )

    // Topic可见性变更事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:visibility-changed', (payload) => {
        if (this.isRecentStoreEvent('visibility-changed', payload.id))
          return
        this.topicOperations.updateTopicVisibility(payload.id, { hidden: payload.hidden, closed: payload.closed })
      }),
    )

    // Topic关闭事件 - 单独监听
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:closed', (payload) => {
        if (this.isRecentStoreEvent('closed', payload.id))
          return
        this.topicOperations.updateTopicVisibility(payload.id, { closed: payload.closed })
      }),
    )

    // Topic隐藏事件 - 单独监听
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:hidden', (payload) => {
        if (this.isRecentStoreEvent('hidden', payload.id))
          return
        this.topicOperations.updateTopicVisibility(payload.id, { hidden: payload.hidden })
      }),
    )

    // Topic标签更新事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:tags-updated', (payload) => {
        if (this.isRecentStoreEvent('tags-updated', payload.id))
          return
        this.topicOperations.replaceTopicTags(payload.id, payload.tags)
      }),
    )

    // Topic类型变更事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:type-changed', (payload) => {
        if (this.isRecentStoreEvent('type-changed', payload.id))
          return
        this.topicOperations.changeTopicType(payload.id, payload.type)
      }),
    )
  }

  cleanup(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
    this.unsubscribers = []
    this.recentEvents.clear()
  }
}

// 导出单例实例
export const simpleEventManager = SimpleEventManager.getInstance()
