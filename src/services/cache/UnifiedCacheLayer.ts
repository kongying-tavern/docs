import type ForumAPI from '@/apis/forum/api'
import { useOptimizedCache } from '~/composables/useStorePerformanceOptimizer'

/**
 * 统一缓存层
 * 为Forum系统提供统一的缓存管理
 */
export class UnifiedCacheLayer {
  private static instance: UnifiedCacheLayer

  // 不同类型的缓存实例
  private topicCache = useOptimizedCache<string, ForumAPI.Topic>(500, 10 * 60 * 1000) // 10分钟TTL
  private userCache = useOptimizedCache<string, ForumAPI.User>(100, 30 * 60 * 1000) // 30分钟TTL
  private searchCache = useOptimizedCache<string, ForumAPI.Topic[]>(50, 5 * 60 * 1000) // 5分钟TTL
  private metadataCache = useOptimizedCache<string, any>(200, 15 * 60 * 1000) // 15分钟TTL

  private constructor() {}

  static getInstance(): UnifiedCacheLayer {
    if (!UnifiedCacheLayer.instance) {
      UnifiedCacheLayer.instance = new UnifiedCacheLayer()
    }
    return UnifiedCacheLayer.instance
  }

  // Topic缓存管理
  getCachedTopic(id: string | number): ForumAPI.Topic | undefined {
    return this.topicCache.get(String(id))
  }

  setCachedTopic(topic: ForumAPI.Topic): void {
    this.topicCache.set(String(topic.id), topic)
    // 同时缓存用户信息
    if (topic.user) {
      this.userCache.set(topic.user.login, topic.user)
    }
  }

  removeCachedTopic(id: string | number): boolean {
    return this.topicCache.delete(String(id))
  }

  hasCachedTopic(id: string | number): boolean {
    return this.topicCache.has(String(id))
  }

  // 批量Topic缓存操作
  setCachedTopics(topics: ForumAPI.Topic[]): void {
    topics.forEach(topic => this.setCachedTopic(topic))
  }

  getCachedTopics(ids: (string | number)[]): (ForumAPI.Topic | undefined)[] {
    return ids.map(id => this.getCachedTopic(id))
  }

  // 用户缓存管理
  getCachedUser(username: string): ForumAPI.User | undefined {
    return this.userCache.get(username)
  }

  setCachedUser(user: ForumAPI.User): void {
    this.userCache.set(user.login, user)
  }

  // 搜索结果缓存
  getCachedSearchResults(query: string, params?: Record<string, any>): ForumAPI.Topic[] | undefined {
    const cacheKey = this.buildSearchCacheKey(query, params)
    return this.searchCache.get(cacheKey)
  }

  setCachedSearchResults(query: string, results: ForumAPI.Topic[], params?: Record<string, any>): void {
    const cacheKey = this.buildSearchCacheKey(query, params)
    this.searchCache.set(cacheKey, results)
  }

  private buildSearchCacheKey(query: string, params?: Record<string, any>): string {
    const baseKey = `search:${query.toLowerCase().trim()}`
    if (!params) return baseKey

    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')

    return `${baseKey}:${sortedParams}`
  }

  // 元数据缓存（分页信息、统计信息等）
  getCachedMetadata(key: string): any {
    return this.metadataCache.get(key)
  }

  setCachedMetadata(key: string, value: any): void {
    this.metadataCache.set(key, value)
  }

  // 缓存失效策略
  invalidateTopicCache(id?: string | number): void {
    if (id) {
      this.topicCache.delete(String(id))
    } else {
      this.topicCache.clear()
    }
  }

  invalidateUserCache(username?: string): void {
    if (username) {
      this.userCache.delete(username)
    } else {
      this.userCache.clear()
    }
  }

  invalidateSearchCache(query?: string): void {
    if (query) {
      // 删除所有包含该query的缓存项
      // TODO: 实现部分匹配删除
      this.searchCache.clear()
    } else {
      this.searchCache.clear()
    }
  }

  invalidateAllCaches(): void {
    this.topicCache.clear()
    this.userCache.clear()
    this.searchCache.clear()
    this.metadataCache.clear()
  }

  // 缓存预热
  preloadTopics(topics: ForumAPI.Topic[]): void {
    this.setCachedTopics(topics)
  }

  // 智能缓存更新
  updateTopicInCache(id: string | number, updates: Partial<ForumAPI.Topic>): ForumAPI.Topic | null {
    const cachedTopic = this.getCachedTopic(id)
    if (cachedTopic) {
      const updatedTopic = { ...cachedTopic, ...updates }
      this.setCachedTopic(updatedTopic)
      return updatedTopic
    }
    return null
  }

  // 缓存统计
  getCacheStats() {
    return {
      topic: this.topicCache.stats.value,
      user: this.userCache.stats.value,
      search: this.searchCache.stats.value,
      metadata: this.metadataCache.stats.value,
    }
  }

  // 缓存优化
  optimizeCaches(): void {
    // 清理过期的缓存项会自动进行
    // 这里可以添加额外的优化逻辑
    console.log('Cache optimization completed', this.getCacheStats())
  }

  // 导出/导入缓存（用于持久化）
  exportCache() {
    // 注意：这个方法应该谨慎使用，因为缓存可能包含大量数据
    return {
      timestamp: Date.now(),
      // 实际实现时需要考虑如何序列化Map数据
      topics: 'serialized_topic_cache',
      users: 'serialized_user_cache',
    }
  }

  importCache(cacheData: any): void {
    // 实际实现时需要考虑如何反序列化和验证数据
    console.log('Cache import completed', cacheData.timestamp)
  }
}

/**
 * 缓存策略配置
 */
export enum CacheStrategy {
  AGGRESSIVE = 'aggressive',  // 积极缓存，长TTL
  MODERATE = 'moderate',      // 适中缓存，中等TTL
  CONSERVATIVE = 'conservative', // 保守缓存，短TTL
  DISABLED = 'disabled'       // 禁用缓存
}

/**
 * 缓存管理器
 * 提供基于策略的缓存管理
 */
export class CacheManager {
  private cacheLayer: UnifiedCacheLayer
  private strategy: CacheStrategy

  constructor(strategy: CacheStrategy = CacheStrategy.MODERATE) {
    this.cacheLayer = UnifiedCacheLayer.getInstance()
    this.strategy = strategy
  }

  setStrategy(strategy: CacheStrategy): void {
    this.strategy = strategy

    // 根据策略调整缓存行为
    switch (strategy) {
      case CacheStrategy.DISABLED:
        this.cacheLayer.invalidateAllCaches()
        break
      case CacheStrategy.CONSERVATIVE:
        // 可以在这里调整TTL等参数
        break
    }
  }

  shouldCache(operation: string): boolean {
    if (this.strategy === CacheStrategy.DISABLED) {
      return false
    }

    // 根据操作类型和策略决定是否缓存
    const cacheableOperations = ['getTopic', 'getTopics', 'searchTopics', 'getUser']
    return cacheableOperations.includes(operation)
  }

  getCacheLayer(): UnifiedCacheLayer {
    return this.cacheLayer
  }

  // 智能缓存决策
  shouldInvalidateOnUpdate(operation: string, data: any): string[] {
    const invalidationRules: Record<string, string[]> = {
      'createTopic': ['search', 'metadata'],
      'updateTopic': ['topic', 'search'],
      'deleteTopic': ['topic', 'search', 'metadata'],
      'updateUser': ['user'],
    }

    return invalidationRules[operation] || []
  }
}

// 导出单例实例
export const globalCacheLayer = UnifiedCacheLayer.getInstance()
export const cacheManager = new CacheManager()