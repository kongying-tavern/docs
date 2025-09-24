import { computed, onUnmounted, ref, watch } from 'vue'
import { usePerformanceMonitor } from './usePerformanceOptimizer'

/**
 * Forum Performance Monitor
 * Comprehensive performance monitoring for forum stores and components
 */

interface PerformanceMetrics {
  componentName: string
  renderCount: number
  averageRenderTime: number
  lastRenderTime: number
  totalRenderTime: number
  memoryUsage: number
  cacheHitRate: number
  searchLatency: number
  dataLoadLatency: number
}

interface AlertThresholds {
  maxRenderTime: number
  maxAverageRenderTime: number
  minCacheHitRate: number
  maxSearchLatency: number
  maxDataLoadLatency: number
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  maxRenderTime: 16, // 60fps
  maxAverageRenderTime: 8,
  minCacheHitRate: 0.7, // 70%
  maxSearchLatency: 500, // 500ms
  maxDataLoadLatency: 2000, // 2s
}

export function useForumPerformanceMonitor(
  componentName: string,
  options?: {
    thresholds?: Partial<AlertThresholds>
    enableDetailedLogging?: boolean
    reportInterval?: number
  },
) {
  const {
    thresholds = DEFAULT_THRESHOLDS,
    enableDetailedLogging = false,
    reportInterval = 30000, // 30 seconds
  } = options || {}

  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }

  // Core performance monitoring
  const monitor = usePerformanceMonitor(componentName)

  // Extended metrics
  const extendedMetrics = ref({
    cacheHits: 0,
    cacheMisses: 0,
    searchOperations: 0,
    searchTotalTime: 0,
    dataLoadOperations: 0,
    dataLoadTotalTime: 0,
    errorCount: 0,
    lastErrorTime: 0,
  })

  // Memory monitoring
  const memoryUsage = ref(0)
  const updateMemoryUsage = () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
      memoryUsage.value = memory?.usedJSHeapSize || 0
    }
  }

  // Computed performance summary
  const performanceSummary = computed(() => {
    const { renderCount, averageRenderTime, lastRenderTime, totalRenderTime } = monitor.metrics.value
    const { cacheHits, cacheMisses, searchOperations, searchTotalTime, dataLoadOperations, dataLoadTotalTime }
      = extendedMetrics.value

    const cacheHitRate = cacheHits + cacheMisses > 0 ? cacheHits / (cacheHits + cacheMisses) : 0
    const averageSearchLatency = searchOperations > 0 ? searchTotalTime / searchOperations : 0
    const averageDataLoadLatency = dataLoadOperations > 0 ? dataLoadTotalTime / dataLoadOperations : 0

    return {
      componentName,
      renderCount,
      averageRenderTime,
      lastRenderTime,
      totalRenderTime,
      memoryUsage: memoryUsage.value,
      cacheHitRate,
      searchLatency: averageSearchLatency,
      dataLoadLatency: averageDataLoadLatency,
      errorRate: renderCount > 0 ? extendedMetrics.value.errorCount / renderCount : 0,
    } as PerformanceMetrics
  })

  // Performance alerts
  const alerts = ref<string[]>([])
  const checkPerformanceAlerts = () => {
    const newAlerts: string[] = []
    const metrics = performanceSummary.value

    if (metrics.lastRenderTime > finalThresholds.maxRenderTime) {
      newAlerts.push(`Slow render: ${metrics.lastRenderTime.toFixed(2)}ms > ${finalThresholds.maxRenderTime}ms`)
    }

    if (metrics.averageRenderTime > finalThresholds.maxAverageRenderTime) {
      newAlerts.push(`High average render time: ${metrics.averageRenderTime.toFixed(2)}ms`)
    }

    if (metrics.cacheHitRate < finalThresholds.minCacheHitRate) {
      newAlerts.push(`Low cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`)
    }

    if (metrics.searchLatency > finalThresholds.maxSearchLatency) {
      newAlerts.push(`Slow search: ${metrics.searchLatency.toFixed(2)}ms`)
    }

    if (metrics.dataLoadLatency > finalThresholds.maxDataLoadLatency) {
      newAlerts.push(`Slow data loading: ${metrics.dataLoadLatency.toFixed(2)}ms`)
    }

    alerts.value = newAlerts
  }

  // Measurement helpers
  const measureRender = <T>(renderFn: () => T): T => {
    const start = monitor.startMeasure()
    try {
      const result = renderFn()
      monitor.endMeasure(start)
      return result
    }
    catch (error) {
      extendedMetrics.value.errorCount++
      extendedMetrics.value.lastErrorTime = Date.now()
      monitor.endMeasure(start)
      throw error
    }
  }

  const measureAsync = async <T>(asyncFn: () => Promise<T>, operationType: 'search' | 'dataLoad'): Promise<T> => {
    const start = performance.now()
    try {
      const result = await asyncFn()
      const duration = performance.now() - start

      if (operationType === 'search') {
        extendedMetrics.value.searchOperations++
        extendedMetrics.value.searchTotalTime += duration
      }
      else if (operationType === 'dataLoad') {
        extendedMetrics.value.dataLoadOperations++
        extendedMetrics.value.dataLoadTotalTime += duration
      }

      return result
    }
    catch (error) {
      extendedMetrics.value.errorCount++
      extendedMetrics.value.lastErrorTime = Date.now()
      throw error
    }
  }

  const recordCacheHit = () => {
    extendedMetrics.value.cacheHits++
  }

  const recordCacheMiss = () => {
    extendedMetrics.value.cacheMisses++
  }

  // Helper function for generating recommendations
  const generateRecommendations = (metrics: PerformanceMetrics): string[] => {
    const recommendations: string[] = []

    if (metrics.averageRenderTime > 8) {
      recommendations.push('Consider using Vue.memo() or shallowRef for expensive computations')
    }

    if (metrics.cacheHitRate < 0.7) {
      recommendations.push('Improve caching strategy or increase cache size')
    }

    if (metrics.searchLatency > 300) {
      recommendations.push('Implement search debouncing or optimize search algorithm')
    }

    if (metrics.dataLoadLatency > 1000) {
      recommendations.push('Consider pagination, virtual scrolling, or background loading')
    }

    if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Monitor memory usage - consider clearing old data or using weak references')
    }

    return recommendations
  }

  // Reporting
  const generateReport = () => {
    const metrics = performanceSummary.value
    const report = {
      timestamp: new Date().toISOString(),
      component: componentName,
      metrics,
      alerts: [...alerts.value],
      recommendations: generateRecommendations(metrics),
    }

    if (enableDetailedLogging) {
      console.group(`🔍 Performance Report: ${componentName}`)
      console.table(metrics)
      if (alerts.value.length > 0) {
        console.warn('Performance Alerts:', alerts.value)
      }
      if (report.recommendations.length > 0) {
        console.info('Recommendations:', report.recommendations)
      }
      console.groupEnd()
    }

    return report
  }

  // Periodic reporting
  let reportInterval_: NodeJS.Timeout | null = null
  if (reportInterval > 0) {
    reportInterval_ = setInterval(() => {
      checkPerformanceAlerts()
      if (enableDetailedLogging || alerts.value.length > 0) {
        generateReport()
      }
      updateMemoryUsage()
    }, reportInterval)
  }

  // Watch for performance issues
  watch(
    () => monitor.metrics.value.lastRenderTime,
    (renderTime) => {
      if (renderTime > finalThresholds.maxRenderTime) {
        checkPerformanceAlerts()
      }
    },
  )

  // Cleanup
  onUnmounted(() => {
    if (reportInterval_) {
      clearInterval(reportInterval_)
    }
  })

  return {
    // Core monitoring
    ...monitor,

    // Extended metrics
    performanceSummary,
    alerts,
    extendedMetrics,

    // Measurement tools
    measureRender,
    measureAsync,
    recordCacheHit,
    recordCacheMiss,

    // Reporting
    generateReport,
    checkPerformanceAlerts,

    // Manual triggers
    updateMemoryUsage,
    resetAllMetrics: () => {
      monitor.resetMetrics()
      extendedMetrics.value = {
        cacheHits: 0,
        cacheMisses: 0,
        searchOperations: 0,
        searchTotalTime: 0,
        dataLoadOperations: 0,
        dataLoadTotalTime: 0,
        errorCount: 0,
        lastErrorTime: 0,
      }
      alerts.value = []
    },
  }
}
