import type { EventMap } from '~/services/events/SimpleEventManager'

interface PersistentForumEvent {
  id: string
  type: keyof EventMap
  payload: EventMap[keyof EventMap]
  timestamp: number
}

export class ForumEventPersistence {
  private static readonly PREFIX = 'forum:event:'
  private static readonly TTL = 5 * 60 * 1000
  private static readonly MAX_EVENTS = 50
  private static readonly CLEANUP_INTERVAL = 2 * 60 * 1000

  private static cleanupTimer: NodeJS.Timeout | null = null

  static saveEvent<K extends keyof EventMap>(type: K, payload: EventMap[K]): void {
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

      localStorage.setItem(this.PREFIX + eventId, JSON.stringify(event))
      this.cleanup()
    }
    catch (error) {
      console.warn('[ForumEventPersistence] 保存事件失败:', error)
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
    ForumEventPersistence.stopPeriodicCleanup()
  })
}
