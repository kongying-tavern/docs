import type { Ref } from 'vue'
import type ForumAPI from '@/apis/forum/api'

/**
 * Composable for syncing forum filter state with URL path
 * Handles bidirectional sync: URL changes update filter, filter changes can optionally update URL
 */
export function useUrlFilterSync(filter: Ref<ForumAPI.FilterBy>, _logPrefix = '🔗') {
  let originalPushState: typeof window.history.pushState
  let originalReplaceState: typeof window.history.replaceState
  let handleUrlChange: (() => void) | null = null

  // Initialize filter from current URL
  function initializeFromUrl() {
    if (typeof window === 'undefined')
      return

    const currentPath = window.location.pathname
    const pathSegments = currentPath.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1]

    if (lastSegment === 'bug' || lastSegment === 'feat' || lastSegment === 'closed') {
      filter.value = lastSegment as ForumAPI.FilterBy
    }
  }

  // Setup URL change monitoring
  function setupUrlMonitoring() {
    if (typeof window === 'undefined')
      return

    // Save original history methods
    originalPushState = window.history.pushState
    originalReplaceState = window.history.replaceState

    handleUrlChange = () => {
      const currentPath = window.location.pathname
      const pathSegments = currentPath.split('/').filter(Boolean)
      const lastSegment = pathSegments[pathSegments.length - 1]

      let newFilter: ForumAPI.FilterBy = 'all'
      if (lastSegment === 'bug' || lastSegment === 'feat' || lastSegment === 'closed') {
        newFilter = lastSegment as ForumAPI.FilterBy
      }

      // Only update filter if it's different
      if (newFilter !== filter.value) {
        filter.value = newFilter
      }
    }

    // Only listen for browser back/forward to avoid double triggering
    window.addEventListener('popstate', handleUrlChange)
  }

  // Cleanup function
  function cleanup() {
    if (typeof window === 'undefined' || !handleUrlChange)
      return

    window.removeEventListener('popstate', handleUrlChange)
    // Restore original history methods
    if (originalPushState)
      window.history.pushState = originalPushState
    if (originalReplaceState)
      window.history.replaceState = originalReplaceState
  }

  // Auto-initialize and setup
  initializeFromUrl()
  setupUrlMonitoring()

  return {
    initializeFromUrl,
    cleanup,
  }
}
