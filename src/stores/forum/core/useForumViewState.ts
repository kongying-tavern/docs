import type { FORUM } from '~/components/forum/types'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { STORAGE_KEYS } from '~/components/forum/constants'

/**
 * Forum View State Management
 * Manages UI view modes, layout preferences and display options
 */
export const useForumViewState = defineStore('forum-view-state', () => {
  // View mode with persistence
  const viewMode = useLocalStorage<FORUM.TopicViewMode>(
    STORAGE_KEYS.FORUM_VIEW_MODE,
    'Card',
  )

  // Layout preferences
  const showSidebar = ref(true)
  const compactMode = ref(false)
  const showTopicPreviews = ref(true)
  const showAuthorAvatars = ref(true)

  // Display options
  const itemsPerPage = useLocalStorage('forum-items-per-page', 20)
  const autoRefresh = ref(false)
  const autoRefreshInterval = ref(30000) // 30 seconds

  // Computed properties
  const isCardView = computed(() => viewMode.value === 'Card')
  const isCompactView = computed(() => viewMode.value === 'Compact')
  const isTableView = computed(() => false) // Table view not implemented

  const layoutConfig = computed(() => ({
    viewMode: viewMode.value,
    showSidebar: showSidebar.value,
    compactMode: compactMode.value,
    showPreviews: showTopicPreviews.value,
    showAvatars: showAuthorAvatars.value,
    itemsPerPage: itemsPerPage.value,
  }))

  // Actions
  const setViewMode = (mode: FORUM.TopicViewMode): void => {
    viewMode.value = mode
  }

  const toggleViewMode = (): void => {
    const modes: FORUM.TopicViewMode[] = ['Card', 'Compact']
    const currentIndex = modes.indexOf(viewMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    viewMode.value = modes[nextIndex]
  }

  const toggleSidebar = (): void => {
    showSidebar.value = !showSidebar.value
  }

  const setCompactMode = (compact: boolean): void => {
    compactMode.value = compact
  }

  const toggleCompactMode = (): void => {
    compactMode.value = !compactMode.value
  }

  const setShowTopicPreviews = (show: boolean): void => {
    showTopicPreviews.value = show
  }

  const setShowAuthorAvatars = (show: boolean): void => {
    showAuthorAvatars.value = show
  }

  const setItemsPerPage = (count: number): void => {
    if (count > 0 && count <= 100) {
      itemsPerPage.value = count
    }
  }

  const setAutoRefresh = (enabled: boolean): void => {
    autoRefresh.value = enabled
  }

  const setAutoRefreshInterval = (ms: number): void => {
    if (ms >= 5000 && ms <= 300000) { // 5 seconds to 5 minutes
      autoRefreshInterval.value = ms
    }
  }

  // Reset to defaults
  const resetToDefaults = (): void => {
    viewMode.value = 'Card'
    showSidebar.value = true
    compactMode.value = false
    showTopicPreviews.value = true
    showAuthorAvatars.value = true
    itemsPerPage.value = 20
    autoRefresh.value = false
    autoRefreshInterval.value = 30000
  }

  return {
    // State
    viewMode,
    showSidebar,
    compactMode,
    showTopicPreviews,
    showAuthorAvatars,
    itemsPerPage,
    autoRefresh,
    autoRefreshInterval,

    // Computed
    isCardView,
    isCompactView,
    isTableView,
    layoutConfig,

    // Actions
    setViewMode,
    toggleViewMode,
    toggleSidebar,
    setCompactMode,
    toggleCompactMode,
    setShowTopicPreviews,
    setShowAuthorAvatars,
    setItemsPerPage,
    setAutoRefresh,
    setAutoRefreshInterval,
    resetToDefaults,
  }
})
