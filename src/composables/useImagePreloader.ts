import type ForumAPI from '@/apis/forum/api'
import { onBeforeUnmount } from 'vue'

export interface ImagePreloadOptions {
  maxPreloadCount?: number
  priority?: 'high' | 'low'
}

export function useImagePreloader(options: ImagePreloadOptions = {}) {
  const {
    maxPreloadCount = 10,
    priority = 'high',
  } = options

  // 内存缓存已预加载的图片URL，避免重复预加载
  const preloadedUrls = new Set<string>()
  const preloadLinks = new Set<HTMLLinkElement>()

  // 对 topics 进行排序，优先显示最新或最重要的内容
  function sortTopicsForDisplay(topics: ForumAPI.Topic[], sortMethod: ForumAPI.SortMethod = 'updated'): ForumAPI.Topic[] {
    return [...topics].sort((a, b) => {
      // 置顶的优先显示
      if (a.pinned && !b.pinned)
        return -1
      if (!a.pinned && b.pinned)
        return 1

      // 按照排序方法
      switch (sortMethod) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })
  }

  // 预加载单个图片
  function createPreloadLink(imageUrl: string): HTMLLinkElement | null {
    // 检查内存缓存，避免重复预加载
    if (preloadedUrls.has(imageUrl)) {
      return null
    }

    try {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = imageUrl

      // 设置优先级（现代浏览器支持）
      if ('fetchPriority' in link) {
        (link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority = priority
      }

      document.head.appendChild(link)

      // 添加到内存缓存
      preloadedUrls.add(imageUrl)
      preloadLinks.add(link)

      return link
    }
    catch (error) {
      console.warn('Failed to preload image:', imageUrl, error)
      return null
    }
  }

  // 批量预加载 topics 中的图片
  function preloadTopicsImages(topics: ForumAPI.Topic[], sortMethod?: ForumAPI.SortMethod): string[] {
    if (!topics || topics.length === 0) {
      return []
    }

    // 1. 排序 topics，找到会显示在前面的内容
    const sortedTopics = sortTopicsForDisplay(topics, sortMethod)

    // 2. 获取前 N 个 topics
    const topicsToPreload = sortedTopics.slice(0, maxPreloadCount)

    // 3. 提取所有图片URL (使用现有的 topic.content.images 结构)
    const imageUrls: string[] = []

    topicsToPreload.forEach((topic) => {
      // 使用现有的 content.images 结构
      if (topic.content?.images && Array.isArray(topic.content.images)) {
        topic.content.images.forEach((img) => {
          if (img.src && !imageUrls.includes(img.src)) {
            imageUrls.push(img.src)
          }
        })
      }
    })

    // 4. 限制预加载数量并创建预加载链接
    const urlsToPreload = imageUrls.slice(0, maxPreloadCount)
    const preloadedUrls: string[] = []

    urlsToPreload.forEach((url) => {
      const link = createPreloadLink(url)
      if (link) {
        preloadedUrls.push(url)
      }
    })

    return preloadedUrls
  }

  // 清理预加载链接
  function cleanupPreloads(): void {
    preloadLinks.forEach((link) => {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
    })
    preloadLinks.clear()
    // 保留内存缓存，避免页面切换时重复预加载
  }

  // 清理所有缓存（包括内存缓存）
  function clearAllCaches(): void {
    cleanupPreloads()
    preloadedUrls.clear()
  }

  // 更新预加载（用于缓存数据变化时）
  function updatePreloads(topics: ForumAPI.Topic[], sortMethod?: ForumAPI.SortMethod): string[] {
    return preloadTopicsImages(topics, sortMethod)
  }

  // 生命周期管理
  onBeforeUnmount(() => {
    cleanupPreloads()
  })

  return {
    // 核心功能
    preloadTopicsImages,
    updatePreloads,
    sortTopicsForDisplay,

    // 工具函数
    createPreloadLink,
    cleanupPreloads,
    clearAllCaches,

    // 状态信息
    getPreloadedUrls: () => Array.from(preloadedUrls),
    getPreloadCount: () => preloadedUrls.size,
  }
}

// 专门用于论坛缓存数据的预加载
export function useForumImagePreloader(options: ImagePreloadOptions = {}) {
  const preloader = useImagePreloader({
    maxPreloadCount: 10,
    priority: 'high',
    ...options,
  })

  // 为缓存的反馈数据优化图片预加载
  function preloadCachedFeedbackImages(
    cachedData: ForumAPI.Topic[],
    sortMethod: ForumAPI.SortMethod = 'updated',
  ): string[] {
    if (!cachedData || cachedData.length === 0) {
      return []
    }

    return preloader.preloadTopicsImages(cachedData, sortMethod)
  }

  return {
    ...preloader,
    preloadCachedFeedbackImages,
  }
}
