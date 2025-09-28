interface CacheEntry<V> {
  value: V
  timestamp: number
}

export class LRUCacheWithTTL<K, V> {
  private readonly maxSize: number
  private readonly ttl: number
  private readonly cache = new Map<K, CacheEntry<V>>()
  private readonly accessOrder = new Set<K>() // 用于维护访问顺序，避免每次get删除Map项

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  /**
   * 获取值，会检查TTL并更新访问顺序
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    if (!entry)
      return undefined

    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key)
      return undefined
    }

    // 更新访问顺序
    this.touch(key)

    return entry.value
  }

  /**
   * 设置值
   */
  set(key: K, value: V): void {
    const now = Date.now()
    const entry: CacheEntry<V> = { value, timestamp: now }

    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      // 删除最久未使用的
      const oldestKey = this.accessOrder.values().next().value
      if (oldestKey !== undefined) {
        this.delete(oldestKey)
      }
    }

    this.cache.set(key, entry)
    this.touch(key)
  }

  /**
   * 检查是否存在且未过期
   */
  has(key: K): boolean {
    const entry = this.cache.get(key)
    if (!entry)
      return false

    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key)
      return false
    }

    this.touch(key)
    return true
  }

  /**
   * 删除指定key
   */
  delete(key: K): boolean {
    this.accessOrder.delete(key)
    return this.cache.delete(key)
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
  }

  /**
   * 获取当前缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 清理过期项
   */
  cleanup(): number {
    const now = Date.now()
    let cleanedCount = 0
    for (const key of this.cache.keys()) {
      const entry = this.cache.get(key)!
      if (now - entry.timestamp > this.ttl) {
        this.delete(key)
        cleanedCount++
      }
    }
    return cleanedCount
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number, maxSize: number, utilization: number, ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: Math.round((this.cache.size / this.maxSize) * 100),
      ttl: this.ttl,
    }
  }

  /**
   * 更新访问顺序
   */
  private touch(key: K) {
    this.accessOrder.delete(key)
    this.accessOrder.add(key)
  }
}
