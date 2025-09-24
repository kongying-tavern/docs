import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from '~/components/forum/types'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { useData, useRouter } from 'vitepress'
import { computed, readonly, ref } from 'vue'
import { FILTER_SETS, FORUM_CONFIG, STORAGE_KEYS } from '~/components/forum/constants'
import { forumEvents } from '~/services/events/SimpleEventManager'

export const useForumUIStore = defineStore('forum-ui', () => {
  const { route, go } = useRouter()
  const { lang: _lang } = useData()

  // State
  const isResetting = ref(false)
  const sort = ref<ForumAPI.SortMethod>(FORUM_CONFIG.DEFAULT_SORT)
  const page = ref<number>(FORUM_CONFIG.DEFAULT_PAGE)
  const creator = ref<string | null>(FORUM_CONFIG.DEFAULT_CREATOR)

  // View mode with localStorage persistence
  const viewMode = useLocalStorage<FORUM.TopicViewMode>(
    STORAGE_KEYS.FORUM_VIEW_MODE,
    'Card',
  )

  // Computed filter based on route
  const filter = computed<ForumAPI.FilterBy>({
    get: () => {
      const routeType = route.data?.params?.type
      return FILTER_SETS.TOPIC_TYPES.has(routeType) ? routeType : FORUM_CONFIG.DEFAULT_FILTER
    },
    set: (value) => {
      if (isResetting.value)
        return

      const parts = location.pathname.split('/').filter(Boolean)
      if (parts.length && FILTER_SETS.TOPIC_TYPES.has(parts.at(-1)!)) {
        parts.pop()
      }

      const newPath = `/${parts.join('/')}${parts.length ? '/' : ''}${value === 'all' ? '' : value}`
      go(newPath)

      // Emit filter change event
      forumEvents.filterChange(value)
    },
  })

  // Loading states
  const isLoading = ref(false)
  const isInitializing = ref(false)
  const canLoadMore = ref(true)
  const noMore = ref(false)

  // Pagination state
  const currentPage = ref(1)
  const totalPages = ref(0)
  const totalCount = ref(0)

  // Getters
  const isCardMode = computed(() => viewMode.value === 'Card')
  const isCompactMode = computed(() => viewMode.value === 'Compact')

  const paginationInfo = computed(() => ({
    current: currentPage.value,
    total: totalPages.value,
    count: totalCount.value,
    hasNext: currentPage.value < totalPages.value,
    hasPrev: currentPage.value > 1,
  }))

  // Actions
  function setSort(newSort: ForumAPI.SortMethod): void {
    sort.value = newSort
    forumEvents.sortChange(newSort)
  }

  function setViewMode(newViewMode: FORUM.TopicViewMode): void {
    viewMode.value = newViewMode
  }

  function setCreator(newCreator: string | null): void {
    creator.value = newCreator
  }

  function setPage(newPage: number): void {
    page.value = newPage
    currentPage.value = newPage
  }

  function nextPage(): boolean {
    if (currentPage.value < totalPages.value) {
      setPage(currentPage.value + 1)
      return true
    }
    return false
  }

  function prevPage(): boolean {
    if (currentPage.value > 1) {
      setPage(currentPage.value - 1)
      return true
    }
    return false
  }

  function setLoadingState(loading: boolean): void {
    isLoading.value = loading
  }

  function setInitializingState(initializing: boolean): void {
    isInitializing.value = initializing
  }

  function setPaginationData(data: {
    current: number
    total: number
    count: number
    hasMore: boolean
  }): void {
    currentPage.value = data.current
    totalPages.value = data.total
    totalCount.value = data.count
    canLoadMore.value = data.hasMore
    noMore.value = !data.hasMore
  }

  function resetPagination(): void {
    currentPage.value = 1
    totalPages.value = 0
    totalCount.value = 0
    canLoadMore.value = true
    noMore.value = false
  }

  function resetState(): void {
    isResetting.value = true

    // Reset pagination
    resetPagination()

    // Reset filters and sort
    sort.value = FORUM_CONFIG.DEFAULT_SORT
    page.value = FORUM_CONFIG.DEFAULT_PAGE
    creator.value = FORUM_CONFIG.DEFAULT_CREATOR

    // Reset loading states
    isLoading.value = false
    isInitializing.value = false

    // Note: Don't reset viewMode as it's persisted
    // Note: Don't reset filter as it's route-based

    setTimeout(() => {
      isResetting.value = false
    }, 100)
  }

  // Computed state messages
  const loadStateMessage = computed(() => {
    if (isLoading.value)
      return 'Loading more...'
    if (noMore.value)
      return 'No more data'
    if (totalCount.value === 0)
      return 'No data found'
    return ''
  })

  return {
    // State
    sort: readonly(sort),
    filter,
    page: readonly(page),
    creator: readonly(creator),
    viewMode,
    isLoading: readonly(isLoading),
    isInitializing: readonly(isInitializing),
    canLoadMore: readonly(canLoadMore),
    noMore: readonly(noMore),
    currentPage: readonly(currentPage),
    totalPages: readonly(totalPages),
    totalCount: readonly(totalCount),

    // Getters
    isCardMode,
    isCompactMode,
    paginationInfo,
    loadStateMessage,

    // Actions
    setSort,
    setViewMode,
    setCreator,
    setPage,
    nextPage,
    prevPage,
    setLoadingState,
    setInitializingState,
    setPaginationData,
    resetPagination,
    resetState,
  }
})
