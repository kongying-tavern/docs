import type { EventMap } from './SimpleEventManager'
import { useBroadcastChannel } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import { toRaw, watch } from 'vue'
import { ForumEventPersistence } from '~/utils/forumEventPersistence'
import { LRUCacheWithTTL } from '~/utils/LRUCacheWithTTL'
import { SimpleEventManager } from './SimpleEventManager'

type ChannelEventData = {
  [K in keyof EventMap]: {
    type: K
    payload: EventMap[K]
    timestamp: number
    id: string // ${type}-${timestamp}-${random}
    source: string // 页面源标识
  }
}[keyof EventMap]

interface BroadcastEvent<K extends keyof EventMap> {
  type: K
  payload: EventMap[K]
  timestamp: number
  id: string
  source: string
}

export class BroadcastChannelSync {
  private static instance: BroadcastChannelSync
  private eventManager: SimpleEventManager | null = null
  private broadcastChannel: ReturnType<typeof useBroadcastChannel> | null = null

  private readonly CHANNEL_NAME = 'forum-events'
  private readonly DEDUP_WINDOW = 2000 // ms
  private readonly BROADCAST_THROTTLE = 100 // ms
  private readonly CLEAN_INTERVAL = 30_000 // ms

  private readonly pageId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  private isSetup = false
  private isProcessingCrossPageEvent = false
  private cleanupTimer: NodeJS.Timeout | null = null

  // 去重缓存
  private recentEvents = new LRUCacheWithTTL<string, boolean>(1000, this.DEDUP_WINDOW)
  private broadcastThrottles = new LRUCacheWithTTL<string, number>(100, 1000)

  private constructor() {
    this.startPeriodicCleanup()
  }

  static getInstance(): BroadcastChannelSync {
    if (typeof window === 'undefined' || import.meta.env.SSR) {
      throw new Error('BroadcastChannelSync 只能在客户端环境使用')
    }
    return this.instance ??= new BroadcastChannelSync()
  }

  private getEventManager() {
    return this.eventManager ??= SimpleEventManager.getInstance()
  }

  enable() {
    if (this.isSetup || import.meta.env.SSR) {
      return
    }

    try {
      this.broadcastChannel = useBroadcastChannel({ name: this.CHANNEL_NAME })
      if (!this.broadcastChannel.isSupported.value) {
        return
      }

      this.broadcastChannel.data.value = null
      this.setupMessageListener()
      this.setupEventBroadcasting()
      this.isSetup = true
    }
    catch (e) {
      console.warn('[BroadcastChannelSync] 启用失败:', e)
    }
  }

  disable() {
    this.broadcastChannel?.close()
    this.broadcastChannel = null
    if (this.cleanupTimer)
      clearInterval(this.cleanupTimer)

    this.cleanupTimer = null
    this.isSetup = false
    this.recentEvents.clear()
    this.broadcastThrottles.clear()
  }

  private setupMessageListener() {
    watch(
      () => this.broadcastChannel?.data.value,
      data => data && this.handleMessage(data as ChannelEventData),
    )
  }

  private handleMessage(data: ChannelEventData) {
    const { type, payload, id, source, timestamp } = data

    if (source === this.pageId)
      return
    if (this.recentEvents.has(id) || Date.now() - timestamp > this.DEDUP_WINDOW)
      return

    this.isProcessingCrossPageEvent = true

    try {
      const cleanPayload = cloneDeep(toRaw(payload))
      this.getEventManager().emit(type, cleanPayload)
    }
    catch (e) {
      console.error('[BroadcastChannelSync] 处理消息失败:', e)
    }
    finally {
      this.isProcessingCrossPageEvent = false
    }
  }

  private setupEventBroadcasting() {
    (
      [
        'topic:created',
        'topic:updated',
        'topic:deleted',
        'topic:pinned',
        'topic:visibility-changed',
        'topic:closed',
        'topic:hidden',
        'topic:tags-updated',
        'topic:type-changed',
        'topic:comment-toggled',
        'comment:created',
        'comment:updated',
        'comment:deleted',
        'comment:hidden',
      ] as (keyof EventMap)[]
    ).forEach(e => this.subscribeAndBroadcast(e))
  }

  private subscribeAndBroadcast<K extends keyof EventMap>(eventType: K) {
    this.getEventManager().subscribe(eventType, (payload) => {
      if (this.isProcessingCrossPageEvent)
        return
      this.broadcastEvent(eventType, payload)
    })
  }

  private broadcastEvent<K extends keyof EventMap>(type: K, payload: EventMap[K]) {
    if (!this.broadcastChannel)
      return

    const now = Date.now()
    const lastBroadcast = this.broadcastThrottles.get(type)
    if (lastBroadcast && now - lastBroadcast < this.BROADCAST_THROTTLE)
      return
    this.broadcastThrottles.set(type, now)

    const id = `${type}-${now}-${Math.random().toString(36).slice(2, 6)}`
    const eventData: BroadcastEvent<K> = {
      type,
      payload: cloneDeep(toRaw(payload)),
      timestamp: now,
      id,
      source: this.pageId,
    }

    this.addRecentEvent(id)

    try {
      this.broadcastChannel.post(eventData)
    }
    catch (error) {
      console.warn(`[BroadcastChannelSync] 广播事件失败 (${type}):`, error)
    }

    try {
      ForumEventPersistence.saveEvent(type, payload)
    }
    catch {
      // Silent fail
    }
  }

  private startPeriodicCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.recentEvents.cleanup()
      this.broadcastThrottles.cleanup()
    }, this.CLEAN_INTERVAL)
  }

  private addRecentEvent(id: string) {
    this.recentEvents.set(id, true)
  }

  getStatus() {
    return {
      enabled: this.isSetup,
      pageId: this.pageId,
      channel: this.CHANNEL_NAME,
      recentEvents: this.recentEvents.size,
      throttles: this.broadcastThrottles.size,
      processing: this.isProcessingCrossPageEvent,
      supported: this.broadcastChannel?.isSupported.value ?? false,
      cacheStats: {
        recentEvents: this.recentEvents.getStats(),
        throttles: this.broadcastThrottles.getStats(),
      },
    }
  }
}
