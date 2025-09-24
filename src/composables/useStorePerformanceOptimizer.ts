import type ForumAPI from '@/apis/forum/api'
import { computed, ref } from 'vue'
import { useBatchUpdates, useDebouncedComputed, useMemoizedComputed, useShallowState } from './usePerformanceOptimizer'

/**
 * Store Performance Optimizer
 * Specialized performance optimizations for Pinia stores
 */

// Optimized topic list management
export function useOptimizedTopicList(initialTopics: ForumAPI.Topic[] = []) {
  const { state: topics, updateState: setTopics, patchState: patchTopics } = useShallowState(initialTopics)
  const batchUpdater = useBatchUpdates()

  // Memoized filtering with smart dependency tracking
  const createMemoizedFilter = (filterFn: (topics: ForumAPI.Topic[]) => ForumAPI.Topic[]) => {
    return useMemoizedComputed(
      topicList => filterFn(topicList),
      () => [topics.value] as [ForumAPI.Topic[]],
      ([a], [b]) => a === b, // Reference equality check for shallow updates
    )
  }

  // Batch topic operations
  const batchUpdateTopics = (updates: Array<{ id: string, changes: Partial<ForumAPI.Topic> }>) => {
    batchUpdater.scheduleUpdate('topics', () => {
      const currentTopics = topics.value
      const updatedTopics = currentTopics.map((topic) => {
        const update = updates.find(u => u.id === topic.id)
        return update ? { ...topic, ...update.changes } : topic
      })
      setTopics(updatedTopics)
    })
  }

  // Optimized single topic updates
  const updateTopic = (id: string, changes: Partial<ForumAPI.Topic>) => {
    const topicIndex = topics.value.findIndex(t => t.id === id)
    if (topicIndex !== -1) {
      const updatedTopics = [...topics.value]
      updatedTopics[topicIndex] = { ...updatedTopics[topicIndex], ...changes }
      setTopics(updatedTopics)
    }
  }

  // Optimized topic removal
  const removeTopics = (ids: (string | number)[]) => {
    const idsSet = new Set(ids.map(id => String(id)))
    const filteredTopics = topics.value.filter(topic => !idsSet.has(String(topic.id)))
    setTopics(filteredTopics)
  }

  // Optimized topic addition
  const addTopics = (newTopics: ForumAPI.Topic[], position: 'start' | 'end' = 'start') => {
    const currentTopics = topics.value
    const updatedTopics = position === 'start'
      ? [...newTopics, ...currentTopics]
      : [...currentTopics, ...newTopics]
    setTopics(updatedTopics)
  }

  return {
    topics,
    setTopics,
    patchTopics,
    createMemoizedFilter,
    batchUpdateTopics,
    updateTopic,
    removeTopics,
    addTopics,
    flushUpdates: batchUpdater.flushUpdates,
  }
}

// Debounced search optimization
export function useOptimizedSearch() {
  const searchQuery = ref('')
  const isSearching = ref(false)
  const searchResults = ref<ForumAPI.Topic[]>([])

  // Debounced search query processing
  const debouncedQuery = useDebouncedComputed(
    () => searchQuery.value.trim(),
    300,
    { maxWait: 1000 },
  )

  // Memoized search results filtering
  const filteredResults = useMemoizedComputed(
    (query, results) => {
      if (!query)
        return []
      const lowerQuery = query.toLowerCase()
      return results.filter((topic: ForumAPI.Topic) =>
        topic.title.toLowerCase().includes(lowerQuery)
        || topic.content.text.toLowerCase().includes(lowerQuery)
        || topic.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery)),
      )
    },
    () => [debouncedQuery.value.value, searchResults.value] as [string | undefined, ForumAPI.Topic[]],
  )

  // Search state management
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const setSearching = (searching: boolean) => {
    isSearching.value = searching
  }

  const setSearchResults = (results: ForumAPI.Topic[]) => {
    searchResults.value = results
  }

  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    isSearching.value = false
    debouncedQuery.cancel()
  }

  return {
    searchQuery,
    debouncedQuery: debouncedQuery.value,
    isSearching,
    searchResults,
    filteredResults,
    setSearchQuery,
    setSearching,
    setSearchResults,
    clearSearch,
    flushSearch: debouncedQuery.flush,
  }
}

// Optimized view state management
export function useOptimizedViewState<T extends Record<string, any>>(initialState: T) {
  const batchUpdater = useBatchUpdates()
  const { flushUpdates } = batchUpdater
  const viewState = ref({ ...initialState })

  // Batch view updates to reduce re-renders
  const updateViewState = (updates: Partial<T>) => {
    batchUpdater.scheduleUpdate('viewState', () => {
      viewState.value = { ...viewState.value, ...updates }
    })
  }

  // Optimized computed properties with memoization
  const createMemoizedViewComputed = <R>(
    computation: (state: T) => R,
    dependencies?: (state: T) => any[],
  ) => {
    return useMemoizedComputed(
      state => computation(state),
      () => [viewState.value] as [T],
      ([a], [b]) => {
        if (dependencies) {
          const aDeps = dependencies(a)
          const bDeps = dependencies(b)
          return JSON.stringify(aDeps) === JSON.stringify(bDeps)
        }
        return a === b
      },
    )
  }

  // Reset to initial state
  const resetViewState = () => {
    viewState.value = { ...initialState }
  }

  return {
    viewState,
    updateViewState,
    createMemoizedViewComputed,
    resetViewState,
    flushViewUpdates: flushUpdates,
  }
}

// Cache optimization for frequently accessed data
export function useOptimizedCache<K, V>(
  maxSize: number = 100,
  ttl: number = 5 * 60 * 1000, // 5 minutes
) {
  const cache = new Map<K, { value: V, timestamp: number, accessCount: number }>()
  const accessOrder = new Set<K>()

  const get = (key: K): V | undefined => {
    const entry = cache.get(key)
    if (!entry)
      return undefined

    // Check TTL
    if (Date.now() - entry.timestamp > ttl) {
      cache.delete(key)
      accessOrder.delete(key)
      return undefined
    }

    // Update access tracking
    entry.accessCount++
    accessOrder.delete(key)
    accessOrder.add(key)

    return entry.value
  }

  const set = (key: K, value: V): void => {
    // Remove oldest entry if at capacity
    if (cache.size >= maxSize && !cache.has(key)) {
      const oldestKey = accessOrder.values().next().value
      if (oldestKey !== undefined) {
        cache.delete(oldestKey)
        accessOrder.delete(oldestKey)
      }
    }

    cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
    })
    accessOrder.delete(key)
    accessOrder.add(key)
  }

  const has = (key: K): boolean => {
    const entry = cache.get(key)
    if (!entry)
      return false

    // Check TTL
    if (Date.now() - entry.timestamp > ttl) {
      cache.delete(key)
      accessOrder.delete(key)
      return false
    }

    return true
  }

  const del = (key: K): boolean => {
    accessOrder.delete(key)
    return cache.delete(key)
  }

  const clear = (): void => {
    cache.clear()
    accessOrder.clear()
  }

  const stats = computed(() => ({
    size: cache.size,
    maxSize,
    hitRate: 0, // TODO: Implement hit rate tracking
    memoryUsage: cache.size * 1000, // Rough estimate
  }))

  return {
    get,
    set,
    has,
    delete: del,
    clear,
    stats,
  }
}

// Integration helper for existing stores
export function enhanceStoreWithPerformance<T extends Record<string, any>>(store: T) {
  const performanceMetrics = ref({
    renderCount: 0,
    updateCount: 0,
    lastUpdateTime: 0,
    averageUpdateTime: 0,
  })

  // Wrap store actions with performance tracking
  // Using precise generic constraints for better type safety
  const wrapAction = <A extends (...args: readonly unknown[]) => unknown>(action: A, name: string): A => {
    return ((...args: Parameters<A>) => {
      const start = performance.now()
      const result = action(...args)
      const duration = performance.now() - start

      performanceMetrics.value.updateCount++
      performanceMetrics.value.lastUpdateTime = duration
      performanceMetrics.value.averageUpdateTime
        = (performanceMetrics.value.averageUpdateTime * (performanceMetrics.value.updateCount - 1) + duration)
          / performanceMetrics.value.updateCount

      if (duration > 5) {
        console.warn(`Store action ${name} took ${duration.toFixed(2)}ms`)
      }

      return result
    }) as A
  }

  return {
    ...store,
    performanceMetrics,
    wrapAction,
  }
}
