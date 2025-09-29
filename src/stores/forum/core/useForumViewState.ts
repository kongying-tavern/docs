import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useForumViewMode } from '~/composables/useForumViewMode'

export const useForumViewState = defineStore('forum-view-state', () => {
  const { viewMode, toggleViewMode, setViewMode } = useForumViewMode()
  const showSidebar = ref(true)
  const compactMode = ref(false)
  const showTopicPreviews = ref(true)
  const showAuthorAvatars = ref(true)

  const VALID_ITEMS_PER_PAGE = [10, 20, 30, 50, 100]
  const DEFAULT_ITEMS_PER_PAGE = 20

  const rawItemsPerPage = useLocalStorage('forum-items-per-page', DEFAULT_ITEMS_PER_PAGE)

  // 创建带验证的computed属性
  const itemsPerPage = computed({
    get: () => {
      return VALID_ITEMS_PER_PAGE.includes(rawItemsPerPage.value) ? rawItemsPerPage.value : DEFAULT_ITEMS_PER_PAGE
    },
    set: (value: number) => {
      if (VALID_ITEMS_PER_PAGE.includes(value)) {
        rawItemsPerPage.value = value
      }
    },
  })

  // 立即修复无效的初始值
  if (!import.meta.env.SSR && !VALID_ITEMS_PER_PAGE.includes(rawItemsPerPage.value)) {
    rawItemsPerPage.value = DEFAULT_ITEMS_PER_PAGE
  }
  const autoRefresh = ref(false)
  const autoRefreshInterval = ref(30000)

  const isCardView = computed(() => viewMode.value === 'card')
  const isCompactView = computed(() => viewMode.value === 'compact')
  const isTableView = computed(() => false)

  const layoutConfig = computed(() => ({
    viewMode: viewMode.value,
    showSidebar: showSidebar.value,
    compactMode: compactMode.value,
    showPreviews: showTopicPreviews.value,
    showAvatars: showAuthorAvatars.value,
    itemsPerPage: itemsPerPage.value,
  }))

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
    viewMode.value = 'card'
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
