import type { EventMap } from '~/services/events/SimpleEventManager'

interface PersistentForumEvent {
  id: string
  type: keyof EventMap
  payload: EventMap[keyof EventMap]
  timestamp: number
}

const SKIP_PERSISTENCE = new Set([
  'ui:topic-expand',
  'ui:comment-reply',
  'ui:search',
  'ui:filter-change',
  'ui:sort-change',
  'ui:topic-action',
  'ui:comment-action',
  'form:validation-error',
  'form:submit-start',
  'nav:topic-detail',
  'nav:user-profile',
  'nav:back',
])

export class ForumEventPersistence {
  private static readonly PREFIX = 'forum:event:'
  private static readonly TTL = 5 * 60 * 1000
  private static readonly MAX_EVENTS = 50
  private static readonly CLEANUP_INTERVAL = 2 * 60 * 1000
  private static readonly FLUSH_DELAY = 100
  private static readonly MAX_BATCH_SIZE = 10

  private static pendingEvents: PersistentForumEvent[] = []
  private static flushTimer: NodeJS.Timeout | null = null
  private static cleanupTimer: NodeJS.Timeout | null = null

  static saveEvent<K extends keyof EventMap>(type: K, payload: EventMap[K]): void {
    // 跳过不需要持久化的事件
    if (SKIP_PERSISTENCE.has(type))
      return

    try {
      if (typeof localStorage === 'undefined')
        return

      const eventId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const event: PersistentForumEvent = {
        id: eventId,
        type,
        payload,
        timestamp: Date.now(),
      }

      this.pendingEvents.push(event)

      // 达到批处理大小时立即刷新
      if (this.pendingEvents.length >= this.MAX_BATCH_SIZE) {
        this.flushPendingEvents()
        return
      }

      // 否则调度延迟刷新
      this.scheduleFlush()
    }
    catch {
      // 保存事件失败 - silent fail
    }
  }

  private static scheduleFlush(): void {
    if (this.flushTimer)
      return

    this.flushTimer = setTimeout(() => {
      this.flushPendingEvents()
      this.flushTimer = null
    }, this.FLUSH_DELAY)
  }

  private static flushPendingEvents(): void {
    if (this.pendingEvents.length === 0)
      return

    const eventsToFlush = [...this.pendingEvents]
    this.pendingEvents = []

    try {
      // 批量写入
      eventsToFlush.forEach((event) => {
        localStorage.setItem(this.PREFIX + event.id, JSON.stringify(event))
      })

      // 批量写入后清理
      if (eventsToFlush.length > 5) {
        this.cleanup()
      }
    }
    catch {
      // 批量保存失败 - silent fail
    }
  }

  static consumePendingEvents(): PersistentForumEvent[] {
    try {
      if (typeof localStorage === 'undefined')
        return []

      const events: PersistentForumEvent[] = []
      const keysToRemove: string[] = []
      const now = Date.now()

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith(this.PREFIX))
          continue

        try {
          const eventData = localStorage.getItem(key)
          if (!eventData)
            continue

          const event: PersistentForumEvent = JSON.parse(eventData)

          if (now - event.timestamp > this.TTL) {
            keysToRemove.push(key)
            continue
          }

          events.push(event)
          keysToRemove.push(key)
        }
        catch {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
      return events.sort((a, b) => a.timestamp - b.timestamp)
    }
    catch {
      return []
    }
  }

  static cleanup(): void {
    try {
      if (typeof localStorage === 'undefined')
        return

      const keysToRemove: string[] = []
      const now = Date.now()
      let eventCount = 0

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith(this.PREFIX))
          continue

        eventCount++

        try {
          const eventData = localStorage.getItem(key)
          if (!eventData) {
            keysToRemove.push(key)
            continue
          }

          const event: PersistentForumEvent = JSON.parse(eventData)
          if (now - event.timestamp > this.TTL)
            keysToRemove.push(key)
        }
        catch {
          keysToRemove.push(key)
        }
      }

      if (eventCount > this.MAX_EVENTS) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith(this.PREFIX))
            keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
    catch {
      // Silent fail
    }
  }

  static startPeriodicCleanup(): void {
    if (typeof window === 'undefined' || this.cleanupTimer)
      return

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.CLEANUP_INTERVAL)
  }

  static stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  static forceCleanup(): void {
    try {
      if (typeof localStorage === 'undefined')
        return

      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.PREFIX))
          keysToRemove.push(key)
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
    catch {
      // Silent fail
    }
  }
}

if (typeof window !== 'undefined') {
  ForumEventPersistence.startPeriodicCleanup()
  window.addEventListener('beforeunload', () => {
    // 页面卸载前刷新待处理事件
    ForumEventPersistence.stopPeriodicCleanup()
  })
}
