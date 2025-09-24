import type ForumAPI from '@/apis/forum/api'
import { SimpleEventManager } from './SimpleEventManager'

/**
 * 跨页面广播数据的标准结构
 */
interface CrossPageEventData {
  topicId: string | number
  timestamp: number
  topic?: ForumAPI.Topic
  updates?: Partial<ForumAPI.Topic>
  pinned?: boolean
  tags?: string[]
  newType?: ForumAPI.TopicType
  hidden?: boolean
  closed?: boolean
  comment?: ForumAPI.Comment
}

/**
 * 跨页面事件同步 - 修复版本
 * 使用localStorage广播事件，避免循环触发
 */
export class SimpleCrossPageSync {
  private static instance: SimpleCrossPageSync
  private eventManager = SimpleEventManager.getInstance()
  private storageEventListener: ((e: StorageEvent) => void) | null = null
  private isSetup = false

  // 去重机制
  private recentEvents = new Set<string>()

  private constructor() {}

  static getInstance(): SimpleCrossPageSync {
    if (!SimpleCrossPageSync.instance) {
      SimpleCrossPageSync.instance = new SimpleCrossPageSync()
    }
    return SimpleCrossPageSync.instance
  }

  /**
   * 去重检查
   */
  private isRecentEvent(key: string): boolean {
    if (this.recentEvents.has(key)) {
      return true
    }
    this.recentEvents.add(key)
    // 1秒后清理
    setTimeout(() => this.recentEvents.delete(key), 1000)
    return false
  }

  /**
   * 启用跨页面同步
   */
  enable(): void {
    if (this.isSetup)
      return
    this.isSetup = true

    // 1. 监听storage事件（只处理跨tab事件，避免循环）
    this.storageEventListener = (e: StorageEvent) => {
      if ((!e.key?.startsWith('forum:topic:') && !e.key?.startsWith('forum:comment:')) || !e.newValue) {
        return
      }

      try {
        const data = JSON.parse(e.newValue)
        const { topicId, timestamp } = data

        // 去重检查
        const eventKey = `${e.key}-${topicId}-${timestamp}`
        if (this.isRecentEvent(eventKey)) {
          return
        }

        // 根据key分发事件
        switch (e.key) {
          case 'forum:topic:created':
            this.eventManager.emit('topic:created', { topic: data.topic })
            break
          case 'forum:topic:deleted':
            this.eventManager.emit('topic:deleted', { id: topicId })
            break
          case 'forum:topic:updated':
            this.eventManager.emit('topic:updated', { id: topicId, updates: data.updates })
            break
          case 'forum:topic:pinned':
            this.eventManager.emit('topic:pinned', { id: topicId, pinned: data.pinned })
            break
          case 'forum:topic:tags-updated':
            this.eventManager.emit('topic:tags-updated', { id: topicId, tags: data.tags })
            break
          case 'forum:topic:type-changed':
            this.eventManager.emit('topic:type-changed', { id: topicId, type: data.newType })
            break
          case 'forum:topic:hidden':
            this.eventManager.emit('topic:visibility-changed', { id: topicId, hidden: data.hidden })
            this.eventManager.emit('topic:hidden', { id: topicId, hidden: data.hidden })
            break
          case 'forum:topic:closed':
            this.eventManager.emit('topic:visibility-changed', { id: topicId, closed: data.closed })
            this.eventManager.emit('topic:closed', { id: topicId, closed: data.closed })
            break
          case 'forum:comment:created':
            this.eventManager.emit('comment:created', {
              commentId: data.comment?.id || data.commentId,
              topicId: data.topicId,
              comment: data.comment,
            })
            break
        }
      }
      catch (error) {
        console.error('Cross-page event parsing error:', error)
      }
    }

    window.addEventListener('storage', this.storageEventListener)

    // 2. 设置本地事件广播（单独的事件总线避免循环）
    this.setupEventBroadcasting()
  }

  /**
   * 禁用跨页面同步
   */
  disable(): void {
    if (this.storageEventListener) {
      window.removeEventListener('storage', this.storageEventListener)
      this.storageEventListener = null
    }
    this.isSetup = false
    this.recentEvents.clear()
  }

  /**
   * 设置事件广播 - 只广播到localStorage，不循环处理
   */
  private setupEventBroadcasting(): void {
    // 监听SimpleEventManager的事件并广播到localStorage
    // 注意：这里我们直接广播事件数据，而不是重新emit

    this.eventManager.subscribe('topic:created', (payload) => {
      this.broadcastToStorage('forum:topic:created', {
        topicId: payload.topic.id,
        topic: payload.topic,
        timestamp: Date.now(),
      })
    })

    this.eventManager.subscribe('topic:deleted', (payload) => {
      this.broadcastToStorage('forum:topic:deleted', { topicId: payload.id, timestamp: Date.now() })
    })

    this.eventManager.subscribe('topic:updated', (payload) => {
      this.broadcastToStorage('forum:topic:updated', {
        topicId: payload.id,
        updates: payload.updates,
        timestamp: Date.now(),
      })
    })

    this.eventManager.subscribe('topic:pinned', (payload) => {
      this.broadcastToStorage('forum:topic:pinned', {
        topicId: payload.id,
        pinned: payload.pinned,
        timestamp: Date.now(),
      })
    })

    this.eventManager.subscribe('topic:tags-updated', (payload) => {
      this.broadcastToStorage('forum:topic:tags-updated', {
        topicId: payload.id,
        tags: payload.tags,
        timestamp: Date.now(),
      })
    })

    this.eventManager.subscribe('topic:type-changed', (payload) => {
      this.broadcastToStorage('forum:topic:type-changed', {
        topicId: payload.id,
        newType: payload.type,
        timestamp: Date.now(),
      })
    })

    this.eventManager.subscribe('topic:visibility-changed', (payload) => {
      if (payload.hidden !== undefined) {
        this.broadcastToStorage('forum:topic:hidden', {
          topicId: payload.id,
          hidden: payload.hidden,
          timestamp: Date.now(),
        })
      }
      if (payload.closed !== undefined) {
        this.broadcastToStorage('forum:topic:closed', {
          topicId: payload.id,
          closed: payload.closed,
          timestamp: Date.now(),
        })
      }
    })

    this.eventManager.subscribe('comment:created', (payload) => {
      this.broadcastToStorage('forum:comment:created', {
        topicId: payload.topicId,
        comment: payload.comment,
        timestamp: Date.now(),
      })
    })
  }

  /**
   * 广播到localStorage
   */
  private broadcastToStorage(key: string, data: CrossPageEventData): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      // 自动清理
      setTimeout(() => localStorage.removeItem(key), 1000)
    }
    catch (error) {
      console.error('localStorage broadcast error:', error)
    }
  }
}

// 导出单例实例
export const simpleCrossPageSync = SimpleCrossPageSync.getInstance()
