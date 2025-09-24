import type ForumAPI from '@/apis/forum/api'
import type { EnhancedBlogPost } from '~/components/blog/composables/useBlogData'

/**
 * 便捷的事件发布函数定义
 * EventMap 将从这些函数自动推断类型
 */
const eventDefinitions = {
  // Topic events
  topicCreated: (topic: ForumAPI.Topic) => ({ topic }),
  topicUpdated: (id: string | number, updates: Partial<ForumAPI.Topic>) => ({ id, updates }),
  topicDeleted: (id: string | number) => ({ id }),
  topicPinned: (id: string | number, pinned: boolean) => ({ id, pinned }),
  topicVisibilityChanged: (id: string | number, updates: { hidden?: boolean, closed?: boolean }) => ({ id, ...updates }),
  topicClosed: (id: string | number, closed: boolean) => ({ id, closed }),
  topicHidden: (id: string | number, hidden: boolean) => ({ id, hidden }),
  topicTagsUpdated: (id: string | number, tags: string[]) => ({ id, tags }),
  topicTypeChanged: (id: string | number, type: ForumAPI.TopicType) => ({ id, type }),
  topicCommentToggled: (id: string | number, commentsClosed: boolean) => ({ id, commentsClosed }),

  // Blog events
  blogCreated: (blog: EnhancedBlogPost) => ({ blog }),
  blogUpdated: (id: string | number, updates: Partial<EnhancedBlogPost>) => ({ id, updates }),
  blogDeleted: (id: string | number, source: 'api' | 'draft') => ({ id, source }),
  blogPublished: (id: string | number, published: boolean) => ({ id, published }),
  blogDraftCreated: (draft: EnhancedBlogPost) => ({ draft }),
  blogDraftUpdated: (draftId: string, updates: Partial<EnhancedBlogPost>) => ({ draftId, updates }),
  blogDraftDeleted: (draftId: string) => ({ draftId }),

  // Comment events
  commentCreated: (commentId: string | number, topicId: string | number, comment: ForumAPI.Comment) => ({ commentId, topicId, comment }),
  commentUpdated: (commentId: string | number, updates: Partial<ForumAPI.Comment>) => ({ commentId, updates }),
  commentDeleted: (commentId: string | number, topicId: string | number) => ({ commentId, topicId }),
  commentHidden: (commentId: string | number, topicId: string | number, hidden: boolean) => ({ commentId, topicId, hidden }),

  // UI events
  uiTopicExpand: (topicId: string | number, expanded: boolean) => ({ topicId, expanded }),
  uiCommentReply: (topicId: string | number, targetUser: string) => ({ topicId, targetUser }),
  uiSearch: (query: string) => ({ query }),
  uiFilterChange: (filter: ForumAPI.FilterBy) => ({ filter }),
  uiSortChange: (sort: ForumAPI.SortMethod) => ({ sort }),
  uiTopicAction: (topicId: string | number, action: string, payload?: ForumAPI.TopicType | string[] | null) => ({ topicId, action, payload }),
  uiCommentAction: (commentId: string | number, topicId: string | number, action: string, payload?: string | null) => ({ commentId, topicId, action, payload }),

  // Form events
  formValidationError: (field: string, message: string) => ({ field, message }),
  formSubmitStart: (formType: string) => ({ formType }),
  formSubmitSuccess: (formType: string, data: ForumAPI.Topic | ForumAPI.Comment | EnhancedBlogPost) => ({ formType, data }),
  formSubmitError: (formType: string, error: Error) => ({ formType, error }),

  // Navigation events
  navTopicDetail: (topicId: string | number) => ({ topicId }),
  navUserProfile: (username: string) => ({ username }),
  navBack: () => ({} as const),
} as const

export const forumEvents = {
  // Topic events - 实际发出事件
  topicCreated: (topic: ForumAPI.Topic) => {
    SimpleEventManager.getInstance().emit('topic:created', eventDefinitions.topicCreated(topic))
  },
  topicUpdated: (id: string | number, updates: Partial<ForumAPI.Topic>) => {
    SimpleEventManager.getInstance().emit('topic:updated', eventDefinitions.topicUpdated(id, updates))
  },
  topicDeleted: (id: string | number) => {
    SimpleEventManager.getInstance().emit('topic:deleted', eventDefinitions.topicDeleted(id))
  },
  topicPinned: (id: string | number, pinned: boolean) => {
    SimpleEventManager.getInstance().emit('topic:pinned', eventDefinitions.topicPinned(id, pinned))
  },
  topicVisibilityChanged: (id: string | number, updates: { hidden?: boolean, closed?: boolean }) => {
    SimpleEventManager.getInstance().emit('topic:visibility-changed', eventDefinitions.topicVisibilityChanged(id, updates))
  },
  topicClosed: (id: string | number, closed: boolean) => {
    SimpleEventManager.getInstance().emit('topic:closed', eventDefinitions.topicClosed(id, closed))
  },
  topicHidden: (id: string | number, hidden: boolean) => {
    SimpleEventManager.getInstance().emit('topic:hidden', eventDefinitions.topicHidden(id, hidden))
  },
  topicTagsUpdated: (id: string | number, tags: string[]) => {
    SimpleEventManager.getInstance().emit('topic:tags-updated', eventDefinitions.topicTagsUpdated(id, tags))
  },
  topicTypeChanged: (id: string | number, type: ForumAPI.TopicType) => {
    SimpleEventManager.getInstance().emit('topic:type-changed', eventDefinitions.topicTypeChanged(id, type))
  },
  topicCommentToggled: (id: string | number, commentsClosed: boolean) => {
    SimpleEventManager.getInstance().emit('topic:comment-toggled', eventDefinitions.topicCommentToggled(id, commentsClosed))
  },

  // Blog events - 实际发出事件
  blogCreated: (blog: EnhancedBlogPost) => {
    SimpleEventManager.getInstance().emit('blog:created', eventDefinitions.blogCreated(blog))
  },
  blogUpdated: (id: string | number, updates: Partial<EnhancedBlogPost>) => {
    SimpleEventManager.getInstance().emit('blog:updated', eventDefinitions.blogUpdated(id, updates))
  },
  blogDeleted: (id: string | number, source: 'api' | 'draft') => {
    SimpleEventManager.getInstance().emit('blog:deleted', eventDefinitions.blogDeleted(id, source))
  },
  blogPublished: (id: string | number, published: boolean) => {
    SimpleEventManager.getInstance().emit('blog:published', eventDefinitions.blogPublished(id, published))
  },
  blogDraftCreated: (draft: EnhancedBlogPost) => {
    SimpleEventManager.getInstance().emit('blog:draft-created', eventDefinitions.blogDraftCreated(draft))
  },
  blogDraftUpdated: (draftId: string, updates: Partial<EnhancedBlogPost>) => {
    SimpleEventManager.getInstance().emit('blog:draft-updated', eventDefinitions.blogDraftUpdated(draftId, updates))
  },
  blogDraftDeleted: (draftId: string) => {
    SimpleEventManager.getInstance().emit('blog:draft-deleted', eventDefinitions.blogDraftDeleted(draftId))
  },

  // Comment events - 实际发出事件
  commentCreated: (commentId: string | number, topicId: string | number, comment: ForumAPI.Comment) => {
    SimpleEventManager.getInstance().emit('comment:created', eventDefinitions.commentCreated(commentId, topicId, comment))
  },
  commentUpdated: (commentId: string | number, updates: Partial<ForumAPI.Comment>) => {
    SimpleEventManager.getInstance().emit('comment:updated', eventDefinitions.commentUpdated(commentId, updates))
  },
  commentDeleted: (commentId: string | number, topicId: string | number) => {
    SimpleEventManager.getInstance().emit('comment:deleted', eventDefinitions.commentDeleted(commentId, topicId))
  },
  commentHidden: (commentId: string | number, topicId: string | number, hidden: boolean) => {
    SimpleEventManager.getInstance().emit('comment:hidden', eventDefinitions.commentHidden(commentId, topicId, hidden))
  },

  // UI events - 实际发出事件
  uiTopicExpand: (topicId: string | number, expanded: boolean) => {
    SimpleEventManager.getInstance().emit('ui:topic-expand', eventDefinitions.uiTopicExpand(topicId, expanded))
  },
  uiCommentReply: (topicId: string | number, targetUser: string) => {
    SimpleEventManager.getInstance().emit('ui:comment-reply', eventDefinitions.uiCommentReply(topicId, targetUser))
  },
  uiSearch: (query: string) => {
    SimpleEventManager.getInstance().emit('ui:search', eventDefinitions.uiSearch(query))
  },
  uiFilterChange: (filter: ForumAPI.FilterBy) => {
    SimpleEventManager.getInstance().emit('ui:filter-change', eventDefinitions.uiFilterChange(filter))
  },
  uiSortChange: (sort: ForumAPI.SortMethod) => {
    SimpleEventManager.getInstance().emit('ui:sort-change', eventDefinitions.uiSortChange(sort))
  },
  uiTopicAction: (topicId: string | number, action: string, payload?: ForumAPI.TopicType | string[] | null) => {
    SimpleEventManager.getInstance().emit('ui:topic-action', eventDefinitions.uiTopicAction(topicId, action, payload))
  },
  uiCommentAction: (commentId: string | number, topicId: string | number, action: string, payload?: string | null) => {
    SimpleEventManager.getInstance().emit('ui:comment-action', eventDefinitions.uiCommentAction(commentId, topicId, action, payload))
  },

  // Form events - 实际发出事件
  formValidationError: (field: string, message: string) => {
    SimpleEventManager.getInstance().emit('form:validation-error', eventDefinitions.formValidationError(field, message))
  },
  formSubmitStart: (formType: string) => {
    SimpleEventManager.getInstance().emit('form:submit-start', eventDefinitions.formSubmitStart(formType))
  },
  formSubmitSuccess: (formType: string, data: ForumAPI.Topic | ForumAPI.Comment | EnhancedBlogPost) => {
    SimpleEventManager.getInstance().emit('form:submit-success', eventDefinitions.formSubmitSuccess(formType, data))
  },
  formSubmitError: (formType: string, error: Error) => {
    SimpleEventManager.getInstance().emit('form:submit-error', eventDefinitions.formSubmitError(formType, error))
  },

  // Navigation events - 实际发出事件
  navTopicDetail: (topicId: string | number) => {
    SimpleEventManager.getInstance().emit('nav:topic-detail', eventDefinitions.navTopicDetail(topicId))
  },
  navUserProfile: (username: string) => {
    SimpleEventManager.getInstance().emit('nav:user-profile', eventDefinitions.navUserProfile(username))
  },
  navBack: () => {
    SimpleEventManager.getInstance().emit('nav:back', eventDefinitions.navBack())
  },

  // 向后兼容的别名
  topicExpand: (topicId: string | number, expanded: boolean) => {
    SimpleEventManager.getInstance().emit('ui:topic-expand', eventDefinitions.uiTopicExpand(topicId, expanded))
  },
  commentReply: (topicId: string | number, targetUser: string) => {
    SimpleEventManager.getInstance().emit('ui:comment-reply', eventDefinitions.uiCommentReply(topicId, targetUser))
  },
  search: (query: string) => {
    SimpleEventManager.getInstance().emit('ui:search', eventDefinitions.uiSearch(query))
  },
  filterChange: (filter: ForumAPI.FilterBy) => {
    SimpleEventManager.getInstance().emit('ui:filter-change', eventDefinitions.uiFilterChange(filter))
  },
  sortChange: (sort: ForumAPI.SortMethod) => {
    SimpleEventManager.getInstance().emit('ui:sort-change', eventDefinitions.uiSortChange(sort))
  },
  topicAction: (topicId: string | number, action: string, payload?: ForumAPI.TopicType | string[] | null) => {
    SimpleEventManager.getInstance().emit('ui:topic-action', eventDefinitions.uiTopicAction(topicId, action, payload))
  },
  commentAction: (commentId: string | number, topicId: string | number, action: string, payload?: string | null) => {
    SimpleEventManager.getInstance().emit('ui:comment-action', eventDefinitions.uiCommentAction(commentId, topicId, action, payload))
  },
  navigateToTopic: (topicId: string | number) => {
    SimpleEventManager.getInstance().emit('nav:topic-detail', eventDefinitions.navTopicDetail(topicId))
  },
  navigateToUser: (username: string) => {
    SimpleEventManager.getInstance().emit('nav:user-profile', eventDefinitions.navUserProfile(username))
  },
  navigateBack: () => {
    SimpleEventManager.getInstance().emit('nav:back', eventDefinitions.navBack())
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
  'topic:comment-toggled': ReturnType<typeof eventDefinitions.topicCommentToggled>

  // Blog events (从 eventDefinitions 函数推断)
  'blog:created': ReturnType<typeof eventDefinitions.blogCreated>
  'blog:updated': ReturnType<typeof eventDefinitions.blogUpdated>
  'blog:deleted': ReturnType<typeof eventDefinitions.blogDeleted>
  'blog:published': ReturnType<typeof eventDefinitions.blogPublished>
  'blog:draft-created': ReturnType<typeof eventDefinitions.blogDraftCreated>
  'blog:draft-updated': ReturnType<typeof eventDefinitions.blogDraftUpdated>
  'blog:draft-deleted': ReturnType<typeof eventDefinitions.blogDraftDeleted>

  // Comment events (从 eventDefinitions 函数推断)
  'comment:created': ReturnType<typeof eventDefinitions.commentCreated>
  'comment:updated': ReturnType<typeof eventDefinitions.commentUpdated>
  'comment:deleted': ReturnType<typeof eventDefinitions.commentDeleted>
  'comment:hidden': ReturnType<typeof eventDefinitions.commentHidden>

  // UI events (从 eventDefinitions 函数推断)
  'ui:topic-expand': ReturnType<typeof eventDefinitions.uiTopicExpand>
  'ui:comment-reply': ReturnType<typeof eventDefinitions.uiCommentReply>
  'ui:search': ReturnType<typeof eventDefinitions.uiSearch>
  'ui:filter-change': ReturnType<typeof eventDefinitions.uiFilterChange>
  'ui:sort-change': ReturnType<typeof eventDefinitions.uiSortChange>
  'ui:topic-action': ReturnType<typeof eventDefinitions.uiTopicAction>
  'ui:comment-action': ReturnType<typeof eventDefinitions.uiCommentAction>

  // Form events (从 eventDefinitions 函数推断)
  'form:validation-error': ReturnType<typeof eventDefinitions.formValidationError>
  'form:submit-start': ReturnType<typeof eventDefinitions.formSubmitStart>
  'form:submit-success': ReturnType<typeof eventDefinitions.formSubmitSuccess>
  'form:submit-error': ReturnType<typeof eventDefinitions.formSubmitError>

  // Navigation events (从 eventDefinitions 函数推断)
  'nav:topic-detail': ReturnType<typeof eventDefinitions.navTopicDetail>
  'nav:user-profile': ReturnType<typeof eventDefinitions.navUserProfile>
  'nav:back': ReturnType<typeof eventDefinitions.navBack>
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
        catch (error) {
          console.error(`Event handler error for ${eventType}:`, error)
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
      this.eventManager.subscribe('topic:created', (payload) => {
        this.topicOperations.addTopic(payload.topic)
      }),
    )

    // Topic更新事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:updated', (payload) => {
        this.topicOperations.updateTopic(payload.id, payload.updates)
      }),
    )

    // Topic删除事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:deleted', (payload) => {
        this.topicOperations.removeTopic(payload.id)
      }),
    )

    // Topic置顶事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:pinned', (payload) => {
        this.topicOperations.changeTopicPinState(payload.id, payload.pinned)
      }),
    )

    // Topic可见性变更事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:visibility-changed', (payload) => {
        this.topicOperations.updateTopicVisibility(payload.id, { hidden: payload.hidden, closed: payload.closed })
      }),
    )

    // Topic关闭事件 - 单独监听
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:closed', (payload) => {
        this.topicOperations.updateTopicVisibility(payload.id, { closed: payload.closed })
      }),
    )

    // Topic隐藏事件 - 单独监听
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:hidden', (payload) => {
        this.topicOperations.updateTopicVisibility(payload.id, { hidden: payload.hidden })
      }),
    )

    // Topic标签更新事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:tags-updated', (payload) => {
        this.topicOperations.replaceTopicTags(payload.id, payload.tags)
      }),
    )

    // Topic类型变更事件
    this.unsubscribers.push(
      this.eventManager.subscribe('topic:type-changed', (payload) => {
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
