import type { EventMap } from './SimpleEventManager'
import { useBroadcastChannel } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import { toRaw, watch } from 'vue'
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
    this.log('实例创建')
    this.startPeriodicCleanup()
  }

  /** 获取单例 */
  static getInstance(): BroadcastChannelSync {
    return this.instance ??= new BroadcastChannelSync()
  }

  /** 延迟获取事件管理器 */
  private getEventManager() {
    return this.eventManager ??= SimpleEventManager.getInstance()
  }

  /** 统一日志 */
  private log(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.log('[BroadcastChannelSync]', ...args)
  }

  private warn(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.warn('[BroadcastChannelSync]', ...args)
  }

  private error(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error('[BroadcastChannelSync]', ...args)
  }

  /** 启用跨页面同步 */
  enable() {
    if (this.isSetup) {
      this.log('已启用，跳过重复启用')
      return
    }

    try {
      this.broadcastChannel = useBroadcastChannel({ name: this.CHANNEL_NAME })
      if (!this.broadcastChannel.isSupported.value) {
        this.warn('BroadcastChannel 不受支持，跳过跨页面同步')
        return
      }

      this.broadcastChannel.data.value = null
      this.setupMessageListener()
      this.setupEventBroadcasting()

      this.isSetup = true
      this.log('跨页面同步已启用')
    }
    catch (e) {
      this.error('启用失败:', e)
    }
  }

  /** 禁用跨页面同步 */
  disable() {
    this.broadcastChannel?.close()
    this.broadcastChannel = null
    if (this.cleanupTimer)
      clearInterval(this.cleanupTimer)

    this.cleanupTimer = null
    this.isSetup = false
    this.recentEvents.clear()
    this.broadcastThrottles.clear()
    this.log('跨页面同步已禁用')
  }

  /** 监听其他页面消息 */
  private setupMessageListener() {
    watch(
      () => this.broadcastChannel?.data.value,
      data => data && this.handleMessage(data as ChannelEventData),
    )
  }

  /** 处理来自其他页面的消息 */
  private handleMessage(data: ChannelEventData) {
    const { type, payload, id, source, timestamp } = data

    if (source === this.pageId)
      return
    if (this.recentEvents.has(id) || Date.now() - timestamp > this.DEDUP_WINDOW)
      return

    this.isProcessingCrossPageEvent = true
    const start = performance.now()

    try {
      const delay = Date.now() - timestamp
      if (delay > 100)
        this.warn(`事件延迟 ${type}: ${delay}ms`)

      const cleanPayload = cloneDeep(toRaw(payload))
      this.getEventManager().emit(type, cleanPayload)

      const duration = performance.now() - start
      if (duration > 25)
        this.warn(`慢处理 ${type}: ${duration.toFixed(2)}ms`)

      this.log(`收到事件 ${type}`, { id, delay: `${delay}ms`, processing: `${duration.toFixed(2)}ms` })
    }
    catch (e) {
      this.error('处理消息失败:', e)
    }
    finally {
      this.isProcessingCrossPageEvent = false
    }
  }

  /** 监听本地事件并广播 */
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

  /** 订阅指定事件并广播 */
  private subscribeAndBroadcast<K extends keyof EventMap>(eventType: K) {
    this.getEventManager().subscribe(eventType, (payload) => {
      if (this.isProcessingCrossPageEvent)
        return
      this.broadcastEvent(eventType, payload)
    })
  }

  /** 广播事件到其他页面 */
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

    // 添加到去重缓存
    this.addRecentEvent(id)

    // 性能监控
    const start = performance.now()
    try {
      this.broadcastChannel.post(eventData)
      const duration = performance.now() - start
      if (duration > 10) {
        this.warn(`慢广播: ${type} 耗时 ${duration.toFixed(2)}ms`)
      }
    }
    catch (error) {
      this.warn(`广播事件失败 (${type}):`, error)
    }
  }

  private startPeriodicCleanup() {
    this.cleanupTimer = setInterval(() => {
      const c1 = this.recentEvents.cleanup()
      const c2 = this.broadcastThrottles.cleanup()
      if (c1 + c2 > 0)
        this.log(`清理过期缓存: events=${c1}, throttles=${c2}`)
    }, this.CLEAN_INTERVAL)
  }

  private addRecentEvent(id: string) {
    this.recentEvents.set(id, true)
  }

  /** 调试状态 */
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

export const broadcastChannelSync = BroadcastChannelSync.getInstance()

if (typeof window !== 'undefined') {
  broadcastChannelSync.enable()
}
