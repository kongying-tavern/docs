import type ForumAPI from '@/apis/forum/api'
import type { ForumQueryParams } from '~/services/forumService'
import { ref } from 'vue'
import { ForumService } from '~/services/forumService'

export interface PreloaderOptions {
  isLoggedIn: boolean
  currentFilter: ForumAPI.FilterBy
  currentSort: ForumAPI.SortMethod
  creator?: string | null
}

export interface PreloaderCacheData {
  data: ForumAPI.Topic[]
  timestamp: number
  filter: ForumAPI.FilterBy
  creator?: string
}

export class ForumPreloader {
  private preloadingFilters = ref<Set<string>>(new Set())
  private preloadedFilters = ref<Set<string>>(new Set())
  private cache = ref<Map<string, PreloaderCacheData>>(new Map())

  private readonly ALL_FILTERS: ForumAPI.FilterBy[] = ['all', 'bug', 'feat', 'closed']
  private readonly CACHE_TTL = 10 * 1000 // 10秒过期
  private readonly MAX_CACHE_SIZE = 10

  constructor() {}

  /**
   * 生成缓存key
   */
  private getCacheKey(filter: ForumAPI.FilterBy, creator?: string | null): string {
    return creator ? `user-${creator}-${filter}` : `filter-${filter}`
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(cached: PreloaderCacheData): boolean {
    return Date.now() - cached.timestamp < this.CACHE_TTL
  }

  /**
   * 获取缓存数据
   */
  getCachedData(filter: ForumAPI.FilterBy, creator?: string | null): ForumAPI.Topic[] | null {
    const cacheKey = this.getCacheKey(filter, creator)
    const cached = this.cache.value.get(cacheKey)

    if (cached && this.isCacheValid(cached)) {
      return cached.data
    }

    return null
  }

  /**
   * 设置缓存数据
   */
  setCachedData(filter: ForumAPI.FilterBy, data: ForumAPI.Topic[], creator?: string | null): void {
    const cacheKey = this.getCacheKey(filter, creator)

    // LRU清理：如果缓存满了，删除最旧的
    if (this.cache.value.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.value.keys().next().value
      if (firstKey) {
        this.cache.value.delete(firstKey)
      }
    }

    this.cache.value.set(cacheKey, {
      data: [...data], // 深拷贝避免引用问题
      timestamp: Date.now(),
      filter,
      creator: creator || undefined,
    })
  }

  /**
   * 预加载单个filter的数据
   */
  private async preloadFilterData(targetFilter: ForumAPI.FilterBy, options: PreloaderOptions): Promise<void> {
    const preloadKey = this.getCacheKey(targetFilter, options.creator)

    // 如果5秒内已有缓存，跳过预加载
    if (this.getCachedData(targetFilter, options.creator)) {
      return
    }

    // 如果正在预加载同样的数据，跳过
    if (this.preloadingFilters.value.has(preloadKey)) {
      return
    }

    this.preloadingFilters.value.add(preloadKey)

    try {
      const params: ForumQueryParams = {
        filter: targetFilter,
        sort: options.currentSort,
        creator: options.creator || undefined,
        page: 1,
        pageSize: 20,
      }

      // 直接使用 ForumService，避免 VitePress 上下文依赖
      const result = await ForumService.getTopics(params)

      if (result.topics && result.topics.length > 0) {
        this.setCachedData(targetFilter, result.topics, options.creator)
      }
    }
    catch (error) {
      console.error(`[Preloader] Failed to preload ${targetFilter}:`, error)
    }
    finally {
      this.preloadingFilters.value.delete(preloadKey)
    }
  }

  /**
   * 预加载所有其他filter（并发执行）
   * 在用户 hover filter 切换器时调用
   */
  async preloadAllOtherFilters(options: PreloaderOptions): Promise<void> {
    // 只有登录用户才启用预加载
    if (!options.isLoggedIn) {
      return
    }

    const currentFilter = options.currentFilter
    const filtersToPreload = this.ALL_FILTERS.filter((f) => {
      if (f === currentFilter)
        return false
      return !this.getCachedData(f, options.creator)
    })

    if (filtersToPreload.length === 0) {
      return
    }

    console.group(`🎯 [Preloader] Preloading filters: ${filtersToPreload.join(', ')}${options.creator ? ` (${options.creator})` : ''}`)

    // 并发预加载所有其他filter
    const preloadPromises = filtersToPreload.map(targetFilter =>
      this.preloadFilterData(targetFilter, options).catch((error) => {
        console.error(`Failed to preload ${targetFilter}:`, error)
      }),
    )

    await Promise.all(preloadPromises)
    console.groupEnd()
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): void {
    const now = Date.now()

    for (const [key, cached] of this.cache.value.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.cache.value.delete(key)
        this.preloadedFilters.value.delete(key)
      }
    }
  }

  /**
   * 清空所有缓存和状态
   */
  clearAll(): void {
    this.cache.value.clear()
    this.preloadedFilters.value.clear()
    this.preloadingFilters.value.clear()
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.value.size,
      preloadedCount: this.preloadedFilters.value.size,
      preloadingCount: this.preloadingFilters.value.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
      cacheTTL: this.CACHE_TTL,
    }
  }
}

// 单例实例
export const forumPreloader = new ForumPreloader()
export const userPreloader = new ForumPreloader()
