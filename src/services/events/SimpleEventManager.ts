import type ForumAPI from '@/apis/forum/api'

/**
 * 简化的事件类型定义 - 修复版本
 * 直接定义具体的事件处理器类型，避免复杂的联合类型
 */
export type EventHandler<T = any> = (payload: T) => void
export type EventUnsubscribe = () => void

/**
 * 类型安全的事件管理器
 * 使用泛型确保类型安全，避免类型断言
 */
export class SimpleEventManager {
  private static instance: SimpleEventManager
  private listeners = new Map<string, Set<EventHandler>>()

  private constructor() {}

  static getInstance(): SimpleEventManager {
    if (!SimpleEventManager.instance) {
      SimpleEventManager.instance = new SimpleEventManager()
    }
    return SimpleEventManager.instance
  }

  /**
   * 订阅事件
   */
  subscribe<T>(
    eventType: string,
    handler: EventHandler<T>,
  ): EventUnsubscribe {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    const handlers = this.listeners.get(eventType)!
    handlers.add(handler)

    // 返回取消订阅函数
    return () => {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(eventType)
      }
    }
  }

  /**
   * 发布事件
   */
  emit<T>(eventType: string, payload: T): void {
    const handlers = this.listeners.get(eventType)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload)
        }
        catch (error) {
          console.error(`Event handler error for ${eventType}:`, error)
        }
      })
    }
  }

  /**
   * 清理指定事件的所有监听器
   */
  clearListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType)
    }
    else {
      this.listeners.clear()
    }
  }
}

/**
 * 类型安全的Store事件处理器
 */
export class SimpleStoreEventHandler {
  private unsubscribers: EventUnsubscribe[] = []
  private eventManager = SimpleEventManager.getInstance()

  constructor(
    private topicOperations: {
      addTopic: (topic: ForumAPI.Topic) => void
      removeTopic: (id: string | number) => void
      updateTopic: (id: string | number, updates: Partial<ForumAPI.Topic>) => void
      replaceTopicTags: (id: string | number, tags: string[]) => void
      changeTopicType: (id: string | number, type: ForumAPI.TopicType) => void
      changeTopicPinState: (id: string | number, pinned: boolean) => void
      updateTopicVisibility: (id: string | number, updates: { hidden?: boolean, closed?: boolean }) => void
    },
    _options: {
      pageType: 'home' | 'user' | 'topic'
      currentUser?: string | null
    },
  ) {}

  /**
   * 设置事件监听器
   */
  setupEventListeners(): void {
    // Topic创建事件
    this.unsubscribers.push(
      this.eventManager.subscribe<{ topic: ForumAPI.Topic }>('topic:created', (payload) => {
        this.topicOperations.addTopic(payload.topic)
      }),
    )

    // Topic更新事件
    this.unsubscribers.push(
      this.eventManager.subscribe<{ id: string | number, updates: Partial<ForumAPI.Topic> }>('topic:updated', (payload) => {
        this.topicOperations.updateTopic(payload.id, payload.updates)
      }),
    )

    // Topic删除事件
    this.unsubscribers.push(
      this.eventManager.subscribe<{ id: string | number }>('topic:deleted', (payload) => {
        this.topicOperations.removeTopic(payload.id)
      }),
    )

    // Topic置顶事件
    this.unsubscribers.push(
      this.eventManager.subscribe<{ id: string | number, pinned: boolean }>('topic:pinned', (payload) => {
        this.topicOperations.changeTopicPinState(payload.id, payload.pinned)
      }),
    )

    // Topic可见性变更事件
    this.unsubscribers.push(
      this.eventManager.subscribe<{ id: string | number, hidden?: boolean, closed?: boolean }>('topic:visibility-changed', (payload) => {
        this.topicOperations.updateTopicVisibility(payload.id, { hidden: payload.hidden, closed: payload.closed })
      }),
    )

    // Topic标签更新事件
    this.unsubscribers.push(
      this.eventManager.subscribe<{ id: string | number, tags: string[] }>('topic:tags-updated', (payload) => {
        this.topicOperations.replaceTopicTags(payload.id, payload.tags)
      }),
    )

    // Topic类型变更事件
    this.unsubscribers.push(
      this.eventManager.subscribe<{ id: string | number, type: ForumAPI.TopicType }>('topic:type-changed', (payload) => {
        this.topicOperations.changeTopicType(payload.id, payload.type)
      }),
    )
  }

  /**
   * 清理事件监听器
   */
  cleanup(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
    this.unsubscribers = []
  }
}

// 导出单例实例
export const simpleEventManager = SimpleEventManager.getInstance()

/**
 * 便捷的事件发布函数
 */
export const forumEvents = {
  // Topic events
  topicCreated: (topic: ForumAPI.Topic) =>
    simpleEventManager.emit('topic:created', { topic }),

  topicUpdated: (id: string | number, updates: Partial<ForumAPI.Topic>) =>
    simpleEventManager.emit('topic:updated', { id, updates }),

  topicDeleted: (id: string | number) =>
    simpleEventManager.emit('topic:deleted', { id }),

  topicPinned: (id: string | number, pinned: boolean) =>
    simpleEventManager.emit('topic:pinned', { id, pinned }),

  topicVisibilityChanged: (id: string | number, updates: { hidden?: boolean, closed?: boolean }) =>
    simpleEventManager.emit('topic:visibility-changed', { id, ...updates }),

  topicTagsUpdated: (id: string | number, tags: string[]) =>
    simpleEventManager.emit('topic:tags-updated', { id, tags }),

  topicTypeChanged: (id: string | number, type: ForumAPI.TopicType) =>
    simpleEventManager.emit('topic:type-changed', { id, type }),

  topicHidden: (id: string | number, hidden: boolean) =>
    simpleEventManager.emit('topic:visibility-changed', { id, hidden }),

  topicClosed: (id: string | number, closed: boolean) =>
    simpleEventManager.emit('topic:visibility-changed', { id, closed }),

  topicCommentToggled: (id: string | number, commentsClosed: boolean) =>
    simpleEventManager.emit('topic:comment-toggled', { id, commentsClosed }),

  // Comment events
  commentCreated: (commentId: string | number, topicId: string | number, comment: ForumAPI.Comment) =>
    simpleEventManager.emit('comment:created', { commentId, topicId, comment }),

  commentUpdated: (commentId: string | number, updates: Partial<ForumAPI.Comment>) =>
    simpleEventManager.emit('comment:updated', { commentId, updates }),

  commentDeleted: (commentId: string | number, topicId: string | number) =>
    simpleEventManager.emit('comment:deleted', { commentId, topicId }),

  commentHidden: (commentId: string | number, topicId: string | number, hidden: boolean) =>
    simpleEventManager.emit('comment:hidden', { commentId, topicId, hidden }),

  // UI events
  topicExpand: (topicId: string | number, expanded: boolean) =>
    simpleEventManager.emit('ui:topic-expand', { topicId, expanded }),

  commentReply: (topicId: string | number, targetUser: string) =>
    simpleEventManager.emit('ui:comment-reply', { topicId, targetUser }),

  search: (query: string) =>
    simpleEventManager.emit('ui:search', { query }),

  filterChange: (filter: ForumAPI.FilterBy) =>
    simpleEventManager.emit('ui:filter-change', { filter }),

  sortChange: (sort: ForumAPI.SortMethod) =>
    simpleEventManager.emit('ui:sort-change', { sort }),

  topicAction: (topicId: string | number, action: string, payload?: unknown) =>
    simpleEventManager.emit('ui:topic-action', { topicId, action, payload }),

  commentAction: (commentId: string | number, topicId: string | number, action: string, payload?: unknown) =>
    simpleEventManager.emit('ui:comment-action', { commentId, topicId, action, payload }),

  // Form events
  formValidationError: (field: string, message: string) =>
    simpleEventManager.emit('form:validation-error', { field, message }),

  formSubmitStart: (formType: string) =>
    simpleEventManager.emit('form:submit-start', { formType }),

  formSubmitSuccess: (formType: string, data: any) =>
    simpleEventManager.emit('form:submit-success', { formType, data }),

  formSubmitError: (formType: string, error: Error) =>
    simpleEventManager.emit('form:submit-error', { formType, error }),

  // Navigation events
  navigateToTopic: (topicId: string | number) =>
    simpleEventManager.emit('nav:topic-detail', { topicId }),

  navigateToUser: (username: string) =>
    simpleEventManager.emit('nav:user-profile', { username }),

  navigateBack: () =>
    simpleEventManager.emit('nav:back', {}),
}
