import type ForumAPI from '@/apis/forum/api'
import { ref } from 'vue'

export interface TopicCacheConfig {
  maxSize: number
  ttl: number // Time to live in milliseconds
}

export interface TopicCache {
  topics: Map<string | number, ForumAPI.Topic>
  lastAccess: Map<string | number, number>
  maxSize: number
  ttl: number
}

const DEFAULT_CACHE_CONFIG: TopicCacheConfig = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
}

export function useTopicCache(config: Partial<TopicCacheConfig> = {}) {
  const cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...config }

  const cache = ref<TopicCache>({
    topics: new Map(),
    lastAccess: new Map(),
    maxSize: cacheConfig.maxSize,
    ttl: cacheConfig.ttl,
  })

  function getCachedTopic(id: string | number): ForumAPI.Topic | undefined {
    const topic = cache.value.topics.get(id)
    if (topic) {
      cache.value.lastAccess.set(id, Date.now())
      return topic
    }
    return undefined
  }

  function setCachedTopic(topic: ForumAPI.Topic): void {
    const cacheInstance = cache.value

    // Clean up expired entries if cache is full
    if (cacheInstance.topics.size >= cacheInstance.maxSize) {
      cleanupExpiredEntries()

      // If still full after cleanup, remove oldest entries
      if (cacheInstance.topics.size >= cacheInstance.maxSize) {
        removeOldestEntries()
      }
    }

    cacheInstance.topics.set(topic.id, topic)
    cacheInstance.lastAccess.set(topic.id, Date.now())
  }

  function cleanupExpiredEntries(): void {
    const now = Date.now()
    const expiredKeys: (string | number)[] = []

    cache.value.lastAccess.forEach((lastAccess, key) => {
      if (now - lastAccess > cache.value.ttl) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach((key) => {
      cache.value.topics.delete(key)
      cache.value.lastAccess.delete(key)
    })
  }

  function removeOldestEntries(): void {
    const entries = Array.from(cache.value.lastAccess.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, Math.floor(cache.value.maxSize * 0.2)) // Remove 20% oldest

    entries.forEach(([key]) => {
      cache.value.topics.delete(key)
      cache.value.lastAccess.delete(key)
    })
  }

  function removeCachedTopic(id: string | number): void {
    cache.value.topics.delete(id)
    cache.value.lastAccess.delete(id)
  }

  function clearCache(): void {
    cache.value.topics.clear()
    cache.value.lastAccess.clear()
  }

  function getCacheStats() {
    return {
      size: cache.value.topics.size,
      maxSize: cache.value.maxSize,
      usage: `${(cache.value.topics.size / cache.value.maxSize * 100).toFixed(1)}%`,
    }
  }

  return {
    cache,
    getCachedTopic,
    setCachedTopic,
    removeCachedTopic,
    clearCache,
    cleanupExpiredEntries,
    getCacheStats,
  }
}
