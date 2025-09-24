import type { Ref } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import type { ForumPreloader } from '~/services/forum/ForumPreloader'
import type { ForumQueryParams } from '~/types/forum/simplified'
import { nextTick, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useForumImagePreloader } from './useImagePreloader'

export interface CacheData<T = string | null> {
  data: ForumAPI.Topic[]
  timestamp: number
  filter: ForumAPI.FilterBy
  metadata?: T // 扩展数据，如 creator
}

export interface CacheManagerOptions {
  pageType: 'home' | 'user'
  preloader: ForumPreloader
  getCacheKey: (filter: ForumAPI.FilterBy, metadata?: string | null) => string
  getMetadata?: () => string | null // 获取额外的缓存元数据（如 creator）
}

export interface LoadDataFunction {
  (queryParams?: ForumQueryParams): Promise<void>
}

export function useForumCacheManager(
  forumData: ReturnType<typeof import('./useForumData').useForumData>,
  filter: Ref<ForumAPI.FilterBy>,
  sort: Ref<ForumAPI.SortMethod>,
  options: CacheManagerOptions,
) {
  const userAuthStore = useUserAuthStore()

  // === 缓存管理 ===
  const filterCache = ref<Map<string, CacheData>>(new Map())
  // Extend cache TTL for bfcache compatibility - users may return after several minutes
  const CACHE_TTL = 10 * 60 * 1000 // 10分钟过期 (increased from 2 minutes for bfcache)
  const MAX_CACHE_SIZE = 8 // Slightly increased cache size

  // === 自动预加载状态 ===
  const hasTriggeredAutoPreload = ref(false)
  const isFilterChanging = ref(false)

  // === 图片预加载 ===
  const imagePreloader = useForumImagePreloader({ maxPreloadCount: 10 })

  // === 缓存辅助函数 ===
  function isCacheValid(cached: CacheData): boolean {
    const age = Date.now() - cached.timestamp

    // Check if restored from bfcache using navigation API
    const isBackForward = typeof window !== 'undefined'
      && window.performance?.navigation?.type === window.performance?.navigation?.TYPE_BACK_FORWARD

    // If restored from bfcache, be more lenient with cache age
    if (isBackForward) {
      return age < (15 * 60 * 1000) // 15 minutes for bfcache scenarios
    }

    return age < CACHE_TTL
  }

  function getCachedData(filter: ForumAPI.FilterBy): ForumAPI.Topic[] | null {
    const metadata = options.getMetadata?.()

    // 1. 首先检查预加载器的缓存
    const preloaderCache = options.preloader.getCachedData(filter, metadata)
    if (preloaderCache) {
      // 为缓存的反馈数据预加载图片
      imagePreloader.preloadCachedFeedbackImages(preloaderCache, sort.value)
      return preloaderCache
    }

    // 2. 回退到本地缓存（只有有效的缓存数据）
    const cacheKey = options.getCacheKey(filter, metadata)
    const cached = filterCache.value.get(cacheKey)

    if (cached && isCacheValid(cached)) {
      // 为缓存的反馈数据预加载图片
      imagePreloader.preloadCachedFeedbackImages(cached.data, sort.value)
      return cached.data
    }

    return null
  }

  function setCachedData(filter: ForumAPI.FilterBy, data: ForumAPI.Topic[]): void {
    const metadata = options.getMetadata?.()

    // 同时保存到预加载器和本地缓存
    options.preloader.setCachedData(filter, data, metadata)

    const cacheKey = options.getCacheKey(filter, metadata)

    // LRU清理：如果缓存满了，删除最旧的
    if (filterCache.value.size >= MAX_CACHE_SIZE) {
      const firstKey = filterCache.value.keys().next().value
      if (firstKey) {
        filterCache.value.delete(firstKey)
      }
    }

    // 重置该 filter 的缓存到期时间（从现在开始计算10分钟）
    const now = Date.now()
    filterCache.value.set(cacheKey, {
      data: [...data], // 深拷贝避免引用问题
      timestamp: now, // 每次数据更新都重置时间戳
      filter,
      metadata,
    })

    // 为新缓存的数据预加载图片
    imagePreloader.preloadCachedFeedbackImages(data, sort.value)
  }

  // === 降级处理：前端过滤 ===
  function clientSideFilter(topics: ForumAPI.Topic[], targetFilter: ForumAPI.FilterBy): ForumAPI.Topic[] {
    switch (targetFilter) {
      case 'closed':
        return topics.filter(t => t.state === 'progressing')
      case 'bug':
        return topics.filter(t => t.state === 'open' && t.tags?.includes('TYP-BUG'))
      case 'feat':
        return topics.filter(t => t.state === 'open' && t.tags?.includes('TYP-FEAT'))
      case 'all':
        return topics.filter(t => t.state === 'open')
      default:
        return topics.filter(t => t.state === 'open')
    }
  }

  function getAllCachedData(): ForumAPI.Topic[] {
    // 获取所有缓存的数据，用于降级过滤
    const allData: ForumAPI.Topic[] = []

    for (const cached of filterCache.value.values()) {
      allData.push(...cached.data)
    }

    // 去重
    const dataMap = new Map<string | number, ForumAPI.Topic>()
    allData.forEach((topic: ForumAPI.Topic) => dataMap.set(topic.id, topic))

    // 如果缓存为空，使用当前数据
    if (dataMap.size === 0 && forumData.data.value) {
      forumData.data.value.forEach((topic: ForumAPI.Topic) => dataMap.set(topic.id, topic))
    }

    return Array.from(dataMap.values())
  }

  // === 智能预加载功能 ===
  function triggerPreload(): void {
    const metadata = options.getMetadata?.()
    const preloadOptions = {
      isLoggedIn: userAuthStore.isLoggedIn,
      currentFilter: filter.value,
      currentSort: sort.value,
      creator: metadata,
    }

    options.preloader.preloadAllOtherFilters(preloadOptions).catch((error) => {
      console.error('Preload error:', error)
    })
  }

  // 自动触发预加载（仅一次）
  function autoTriggerPreload(): void {
    const metadata = options.getMetadata?.()

    if (hasTriggeredAutoPreload.value || !userAuthStore.isLoggedIn) {
      return
    }

    // 对于 user 页面，还需要检查是否有 creator
    if (options.pageType === 'user' && !metadata) {
      return
    }

    hasTriggeredAutoPreload.value = true

    // 延迟触发，避免干扰初始数据加载
    setTimeout(() => {
      triggerPreload()
    }, 1000)
  }

  // === Filter变化监听 ===
  function setupFilterWatcher(loadDataFunction: LoadDataFunction): void {
    watch(() => filter.value, async (newFilter, oldFilter) => {
      if (oldFilter === undefined)
        return // 跳过初始化

      // 对于 user 页面，还需要检查是否有 creator
      if (options.pageType === 'user' && !options.getMetadata?.())
        return

      const metadata = options.getMetadata?.()

      const cachedData = getCachedData(newFilter)

      if (cachedData) {
        forumData.data.value = cachedData
        await nextTick()
      }
      else {
        isFilterChanging.value = true
        forumData.initialData()

        try {
          const queryParams: ForumQueryParams = { filter: newFilter }
          if (metadata) {
            queryParams.creator = metadata
          }

          await loadDataFunction(queryParams)

          if (forumData.data.value && forumData.data.value.length > 0) {
            setCachedData(newFilter, forumData.data.value)
          }
        }
        catch (error) {
          console.error('Failed to load data:', error)
          const allData = getAllCachedData()
          if (allData.length > 0) {
            const filtered = clientSideFilter(allData, newFilter)
            forumData.data.value = filtered

            toast.warning('网络请求失败，显示本地数据', {
              description: '数据可能不是最新的，请稍后重试',
              duration: 3000,
            })
          }
          else {
            forumData.data.value = []

            toast.error('无法加载数据', {
              description: '请检查网络连接后重试',
              duration: 5000,
            })
          }
        }
        finally {
          isFilterChanging.value = false
        }
      }
    }, { immediate: false })

    // 监听Sort变化
    watch(() => sort.value, async (newSort, oldSort) => {
      if (oldSort === undefined)
        return // 跳过初始化

      // 对于 user 页面，还需要检查是否有 creator
      if (options.pageType === 'user' && !options.getMetadata?.())
        return

      const metadata = options.getMetadata?.()

      const cachedData = getCachedData(filter.value)

      if (cachedData) {
        forumData.data.value = cachedData
        await nextTick()
      }
      else {
        isFilterChanging.value = true
        forumData.initialData()

        try {
          const queryParams: ForumQueryParams = {
            filter: filter.value,
            sort: newSort,
          }
          if (metadata) {
            queryParams.creator = metadata
          }

          await loadDataFunction(queryParams)

          if (forumData.data.value && forumData.data.value.length > 0) {
            setCachedData(filter.value, forumData.data.value)
          }
        }
        catch (error) {
          console.error('Failed to load data for sort change:', error)
          toast.error('排序数据加载失败', {
            description: '请稍后重试',
            duration: 3000,
          })
        }
        finally {
          isFilterChanging.value = false
        }
      }
    }, { immediate: false })
  }

  // === 定期清理过期缓存 ===
  function cleanExpiredCache(): void {
    const now = Date.now()

    for (const [key, cached] of filterCache.value.entries()) {
      if (now - cached.timestamp > CACHE_TTL) {
        filterCache.value.delete(key)
      }
    }
  }

  // 启动定期清理（每30秒检查一次）
  let cleanupInterval: NodeJS.Timeout | null = null

  function startCacheCleanup(): void {
    if (cleanupInterval)
      return

    cleanupInterval = setInterval(() => {
      cleanExpiredCache()
      options.preloader.cleanExpiredCache()
    }, 30 * 1000) // 30秒清理一次
  }

  function stopCacheCleanup(): void {
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  }

  // 清理函数
  function cleanup(): void {
    stopCacheCleanup()
    options.preloader.cleanExpiredCache()
    imagePreloader.cleanupPreloads()
  }

  return {
    // 状态
    isFilterChanging,
    hasTriggeredAutoPreload,

    // 缓存管理
    getCachedData,
    setCachedData,

    // 预加载
    triggerPreload,
    autoTriggerPreload,

    // Filter 管理
    setupFilterWatcher,

    // 缓存清理
    startCacheCleanup,
    stopCacheCleanup,
    cleanExpiredCache,

    // 图片预加载
    imagePreloader,

    // 清理
    cleanup,
  }
}
