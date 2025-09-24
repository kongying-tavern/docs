import { debounce, throttle } from 'lodash-es'
import { computed, ref, shallowRef, triggerRef, watch } from 'vue'

/**
 * Performance Optimization Utilities
 * Provides tools for reducing re-renders, optimizing computations, and managing updates
 */

// Shallow reactive optimization for large datasets
export function useShallowState<T>(initialValue: T) {
  const state = shallowRef(initialValue)

  const updateState = (newValue: T) => {
    state.value = newValue
    triggerRef(state)
  }

  const patchState = (updates: Partial<T>) => {
    if (typeof state.value === 'object' && state.value !== null) {
      Object.assign(state.value, updates)
      triggerRef(state)
    }
  }

  return {
    state,
    updateState,
    patchState,
  }
}

// Debounced reactive computation
export function useDebouncedComputed<T>(
  getter: () => T,
  delay: number = 300,
  options?: { maxWait?: number },
) {
  const result = ref<T>()
  const isComputing = ref(false)

  const debouncedCompute = debounce(
    () => {
      isComputing.value = true
      try {
        result.value = getter()
      }
      finally {
        isComputing.value = false
      }
    },
    delay,
    options,
  )

  // Watch for reactive dependencies and trigger debounced computation
  const computedValue = computed(() => {
    debouncedCompute()
    return result.value
  })

  return {
    value: computedValue,
    isComputing,
    flush: () => debouncedCompute.flush(),
    cancel: () => debouncedCompute.cancel(),
  }
}

// Throttled reactive updates
export function useThrottledRef<T>(initialValue: T, delay: number = 100) {
  const internalValue = ref(initialValue)
  const publicValue = ref(initialValue)

  const throttledUpdate = throttle((newValue: T) => {
    publicValue.value = newValue
  }, delay, { leading: true, trailing: true })

  watch(internalValue, (newValue) => {
    throttledUpdate(newValue)
  })

  const setValue = (value: T) => {
    internalValue.value = value
  }

  return {
    value: publicValue,
    setValue,
    flush: () => throttledUpdate.flush(),
    cancel: () => throttledUpdate.cancel(),
  }
}

// Memoized computation with dependency tracking
// Using any[] for maximum compatibility with different dependency types
export function useMemoizedComputed<T>(
  computation: (...deps: any[]) => T,
  dependencies: () => any[],
  isEqual: (a: any[], b: any[]) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b),
) {
  const cache = ref<{ deps: any[], result: T } | null>(null)

  return computed(() => {
    const currentDeps = dependencies()

    // Check if we can use cached result
    if (cache.value && isEqual(cache.value.deps, currentDeps)) {
      return cache.value.result
    }

    // Compute new result and cache it
    const result = computation(...currentDeps)
    cache.value = { deps: currentDeps, result }
    return result
  })
}

// Virtual scrolling state management
export function useVirtualScrolling<T>(
  items: () => T[],
  options: {
    itemHeight: number
    containerHeight: number
    overscan?: number
  },
) {
  const scrollTop = ref(0)
  const { itemHeight, containerHeight, overscan = 3 } = options

  const visibleRange = computed(() => {
    const allItems = items()
    const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
    const endIndex = Math.min(
      allItems.length - 1,
      Math.ceil((scrollTop.value + containerHeight) / itemHeight) + overscan,
    )
    return { startIndex, endIndex }
  })

  const visibleItems = computed(() => {
    const allItems = items()
    const { startIndex, endIndex } = visibleRange.value
    return allItems.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight,
    }))
  })

  const totalHeight = computed(() => items().length * itemHeight)

  const updateScrollTop = (newScrollTop: number) => {
    scrollTop.value = newScrollTop
  }

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    updateScrollTop,
  }
}

// Batch updates for better performance
export function useBatchUpdates() {
  const updates = new Map<string, () => void>()
  const isScheduled = ref(false)

  const scheduleUpdate = (key: string, updateFn: () => void) => {
    updates.set(key, updateFn)

    if (!isScheduled.value) {
      isScheduled.value = true
      // Use microtask for batching
      queueMicrotask(() => {
        flushUpdates()
      })
    }
  }

  const flushUpdates = () => {
    const pendingUpdates = Array.from(updates.values())
    updates.clear()
    isScheduled.value = false

    // Execute all pending updates
    pendingUpdates.forEach((update) => {
      try {
        update()
      }
      catch (error) {
        console.error('Batch update failed:', error)
      }
    })
  }

  return {
    scheduleUpdate,
    flushUpdates,
    hasPendingUpdates: computed(() => updates.size > 0),
  }
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string) {
  const metrics = ref({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
  })

  const startMeasure = () => {
    return performance.now()
  }

  const endMeasure = (startTime: number) => {
    const duration = performance.now() - startTime
    metrics.value.renderCount++
    metrics.value.lastRenderTime = duration
    metrics.value.totalRenderTime += duration
    metrics.value.averageRenderTime = metrics.value.totalRenderTime / metrics.value.renderCount

    if (duration > 16) { // 16ms is 60fps threshold
      console.warn(`Performance: ${name} took ${duration.toFixed(2)}ms to render`)
    }
  }

  const resetMetrics = () => {
    metrics.value = {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
    }
  }

  return {
    metrics,
    startMeasure,
    endMeasure,
    resetMetrics,
  }
}
