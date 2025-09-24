import { onScopeDispose } from 'vue'

export interface EventListenerConfig {
  maxListeners?: number
  autoCleanup?: boolean
  debugMode?: boolean
}

// Using any[] for event parameters to maintain compatibility with existing event systems
export interface EventBus {
  on: (event: string, handler: (...args: any[]) => void) => void
  off: (event: string, handler: (...args: any[]) => void) => void
  emit: (event: string, ...args: any[]) => void
}

export interface EventManagerStats {
  managerId: string
  listenerCount: number
  eventsRegistered: string[]
  createdAt: number
  disposed: boolean
}

interface ManagedEventListener {
  event: string
  handler: (...args: any[]) => void
  cleanup: () => void
  timestamp: number
  id: string
}

export class SafeEventManager {
  private listeners: Map<string, ManagedEventListener> = new Map()
  private eventBus: EventBus
  private config: Required<EventListenerConfig>
  private cleanupTimer: NodeJS.Timeout | null = null
  private disposed = false

  constructor(eventBus: EventBus, config: EventListenerConfig = {}) {
    this.eventBus = eventBus
    this.config = {
      maxListeners: config.maxListeners ?? 50,
      autoCleanup: config.autoCleanup ?? true,
      debugMode: config.debugMode ?? false,
    }

    // Setup periodic cleanup if auto cleanup is enabled
    if (this.config.autoCleanup) {
      this.scheduleCleanup()
    }

    // Auto dispose when Vue scope is disposed
    onScopeDispose(() => {
      this.dispose()
    })
  }

  /**
   * Add an event listener with automatic cleanup management
   */
  on<T extends any[]>(event: string, handler: (...args: T) => void): string {
    if (this.disposed) {
      console.warn('[SafeEventManager] Attempted to add listener to disposed manager')
      return ''
    }

    // Check listener limit
    if (this.listeners.size >= this.config.maxListeners) {
      this.performCleanup()

      if (this.listeners.size >= this.config.maxListeners) {
        console.warn(`[SafeEventManager] Maximum listeners (${this.config.maxListeners}) reached`)
        return ''
      }
    }

    const id = this.generateId()
    const cleanup = () => {
      if (this.eventBus?.off) {
        this.eventBus.off(event, handler)
      }
    }

    const listener: ManagedEventListener = {
      event,
      handler,
      cleanup,
      timestamp: Date.now(),
      id,
    }

    // Register with event bus
    if (this.eventBus?.on) {
      this.eventBus.on(event, handler)
    }

    // Store managed listener
    this.listeners.set(id, listener)

    if (this.config.debugMode) {
      console.log(`[SafeEventManager] Added listener for ${event} (${id})`)
    }

    return id
  }

  /**
   * Remove a specific event listener by ID
   */
  off(id: string): boolean {
    const listener = this.listeners.get(id)
    if (!listener) {
      return false
    }

    listener.cleanup()
    this.listeners.delete(id)

    if (this.config.debugMode) {
      console.log(`[SafeEventManager] Removed listener ${id}`)
    }

    return true
  }

  /**
   * Remove all listeners for a specific event
   */
  offByEvent(event: string): number {
    let removedCount = 0

    for (const [id, listener] of this.listeners.entries()) {
      if (listener.event === event) {
        listener.cleanup()
        this.listeners.delete(id)
        removedCount++
      }
    }

    if (this.config.debugMode && removedCount > 0) {
      console.log(`[SafeEventManager] Removed ${removedCount} listeners for ${event}`)
    }

    return removedCount
  }

  /**
   * Create a scoped listener that automatically cleans up
   */
  scope(): ScopedEventManager {
    return new ScopedEventManager(this)
  }

  /**
   * Get current listener statistics
   */
  getStats(): {
    total: number
    byEvent: Record<string, number>
    oldest: number | null
    newest: number | null
  } {
    const stats = {
      total: this.listeners.size,
      byEvent: {} as Record<string, number>,
      oldest: null as number | null,
      newest: null as number | null,
    }

    let oldestTime = Number.MAX_SAFE_INTEGER
    let newestTime = 0

    for (const listener of this.listeners.values()) {
      // Count by event
      stats.byEvent[listener.event] = (stats.byEvent[listener.event] || 0) + 1

      // Track timestamps
      oldestTime = Math.min(oldestTime, listener.timestamp)
      newestTime = Math.max(newestTime, listener.timestamp)
    }

    if (this.listeners.size > 0) {
      stats.oldest = oldestTime
      stats.newest = newestTime
    }

    return stats
  }

  /**
   * Perform cleanup of stale listeners
   */
  performCleanup(): void {
    const maxAge = 5 * 60 * 1000 // 5 minutes
    const now = Date.now()
    const toRemove: string[] = []

    for (const [id, listener] of this.listeners.entries()) {
      if (now - listener.timestamp > maxAge) {
        toRemove.push(id)
      }
    }

    for (const id of toRemove) {
      this.off(id)
    }

    if (this.config.debugMode && toRemove.length > 0) {
      console.log(`[SafeEventManager] Cleaned up ${toRemove.length} stale listeners`)
    }
  }

  /**
   * Dispose of all listeners and cleanup resources
   */
  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true

    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    // Cleanup all listeners
    for (const listener of this.listeners.values()) {
      listener.cleanup()
    }

    this.listeners.clear()

    if (this.config.debugMode) {
      console.log('[SafeEventManager] Disposed')
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private scheduleCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      if (this.disposed) {
        return
      }
      this.performCleanup()
    }, 2 * 60 * 1000) // Every 2 minutes
  }
}

/**
 * Scoped event manager that automatically cleans up all listeners
 */
export class ScopedEventManager {
  private listenerIds: Set<string> = new Set()
  private parent: SafeEventManager
  private disposed = false

  constructor(parent: SafeEventManager) {
    this.parent = parent

    // Auto dispose when Vue scope is disposed
    onScopeDispose(() => {
      this.dispose()
    })
  }

  on<T extends any[]>(event: string, handler: (...args: T) => void): string {
    if (this.disposed) {
      console.warn('[ScopedEventManager] Attempted to add listener to disposed scope')
      return ''
    }

    const id = this.parent.on(event, handler)
    if (id) {
      this.listenerIds.add(id)
    }
    return id
  }

  off(id: string): boolean {
    const success = this.parent.off(id)
    if (success) {
      this.listenerIds.delete(id)
    }
    return success
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true

    // Remove all tracked listeners
    for (const id of this.listenerIds) {
      this.parent.off(id)
    }

    this.listenerIds.clear()
  }

  getListenerCount(): number {
    return this.listenerIds.size
  }
}

/**
 * Create a safe event manager instance
 */
export function createSafeEventManager(eventBus: EventBus, config?: EventListenerConfig): SafeEventManager {
  return new SafeEventManager(eventBus, config)
}

/**
 * Global event managers registry for debugging
 */
const globalManagers = new WeakSet<SafeEventManager>()

export function registerEventManager(manager: SafeEventManager): void {
  globalManagers.add(manager)
}

export function getEventManagerStats(): EventManagerStats[] {
  const stats: EventManagerStats[] = []
  // Note: WeakSet doesn't allow iteration, this is just for type consistency
  // In practice, you'd need to track managers differently for global stats
  return stats
}
