import { useDocumentVisibility } from '@vueuse/core'
import { onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * Browser Back/Forward Cache (bfcache) optimization composable
 * Provides utilities to work with browser's native page caching for optimal user experience
 */

export interface BfcacheState {
  isFromBfcache: boolean
  isPageVisible: boolean
  shouldPreserveState: boolean
}

export interface BfcacheOptions {
  onPageRestore?: () => void
  onPageHide?: () => void
  onVisibilityChange?: (visible: boolean) => void
  enableDebugLogging?: boolean
}

export function useBfcacheOptimization(options: BfcacheOptions = {}) {
  const {
    onPageRestore,
    onPageHide,
    onVisibilityChange,
  } = options

  // State tracking
  const isFromBfcache = ref(false)
  const documentVisibility = useDocumentVisibility()
  const shouldPreserveState = ref(true)

  // Check if browser supports bfcache
  const isBfcacheSupported = (): boolean => {
    return 'onpageshow' in window && 'onpagehide' in window
  }

  // Detect if page was restored from bfcache
  const handlePageShow = (event: PageTransitionEvent) => {
    isFromBfcache.value = event.persisted

    if (event.persisted && onPageRestore) {
      onPageRestore()
    }
  }

  // Handle page hide event
  const handlePageHide = () => {
    if (onPageHide) {
      onPageHide()
    }
  }

  // Watch visibility changes using VueUse
  let visibilityTimeoutId: NodeJS.Timeout | null = null

  watch(documentVisibility, (visible) => {
    if (onVisibilityChange) {
      onVisibilityChange(visible === 'visible')
    }

    // Clear previous timeout
    if (visibilityTimeoutId) {
      clearTimeout(visibilityTimeoutId)
      visibilityTimeoutId = null
    }

    // Only allow state clearing when page is truly hidden for a while
    if (visible === 'hidden') {
      visibilityTimeoutId = setTimeout(() => {
        if (documentVisibility.value === 'hidden') {
          shouldPreserveState.value = false
        }
      }, 5000)
    }
    else {
      shouldPreserveState.value = true
    }
  }, { immediate: true })

  // Get current bfcache state
  const getBfcacheState = (): BfcacheState => ({
    isFromBfcache: isFromBfcache.value,
    isPageVisible: documentVisibility.value === 'visible',
    shouldPreserveState: shouldPreserveState.value,
  })

  // Check if we should skip initialization (when restoring from bfcache)
  const shouldSkipInitialization = (): boolean => {
    return isFromBfcache.value && shouldPreserveState.value
  }

  // Check if we should perform cleanup
  const shouldPerformCleanup = (): boolean => {
    return !shouldPreserveState.value || documentVisibility.value === 'hidden'
  }

  // Setup event listeners (only for bfcache events, visibility handled by VueUse)
  const setupEventListeners = () => {
    if (!isBfcacheSupported()) {
      return
    }

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('pagehide', handlePageHide)
  }

  // Cleanup event listeners
  const cleanupEventListeners = () => {
    if (import.meta.env.SSR)
      return

    window.removeEventListener('pageshow', handlePageShow)
    window.removeEventListener('pagehide', handlePageHide)

    // Clear visibility timeout on cleanup
    if (visibilityTimeoutId) {
      clearTimeout(visibilityTimeoutId)
      visibilityTimeoutId = null
    }
  }

  // Auto-setup when component mounts
  onMounted(() => {
    setupEventListeners()
  })

  // Cleanup when component unmounts
  onUnmounted(() => {
    cleanupEventListeners()
  })

  return {
    // State
    isFromBfcache,
    isPageVisible: documentVisibility,
    shouldPreserveState,

    // Methods
    getBfcacheState,
    shouldSkipInitialization,
    shouldPerformCleanup,
    isBfcacheSupported,

    // Manual control
    setupEventListeners,
    cleanupEventListeners,
  }
}

/**
 * Simple bfcache detection utility
 * Use this for lightweight detection without full composable overhead
 */
export function detectBfcacheRestore(): boolean {
  return typeof window !== 'undefined'
    && window.performance?.navigation?.type === window.performance?.navigation?.TYPE_BACK_FORWARD
}

/**
 * Check if current environment supports bfcache
 */
export function isBfcacheAvailable(): boolean {
  return typeof window !== 'undefined'
    && 'onpageshow' in window
    && 'onpagehide' in window
}
