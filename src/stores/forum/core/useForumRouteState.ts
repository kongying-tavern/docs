import type ForumAPI from '@/apis/forum/api'
import { defineStore } from 'pinia'
import { useRouter } from 'vitepress'
import { computed, ref, watch } from 'vue'
import { FILTER_SETS, FORUM_CONFIG } from '~/components/forum/constants'

/**
 * Forum Route State Management
 * Handles route-based filters, navigation and URL synchronization
 */
export const useForumRouteState = defineStore('forum-route-state', () => {
  const { route, go } = useRouter()

  // Core route state
  const currentPage = ref(FORUM_CONFIG.DEFAULT_PAGE)
  const currentCreator = ref<string | null>(FORUM_CONFIG.DEFAULT_CREATOR)
  const currentSort = ref<ForumAPI.SortMethod>(FORUM_CONFIG.DEFAULT_SORT)

  // Route-based filter computation
  const routeFilter = computed<ForumAPI.FilterBy>({
    get: () => {
      const routeType = route.data?.params?.type
      return FILTER_SETS.TOPIC_TYPES.has(routeType)
        ? routeType as ForumAPI.FilterBy
        : FORUM_CONFIG.DEFAULT_FILTER
    },
    set: (newFilter) => {
      // Navigate to new route when filter changes
      const basePath = '/forum'
      const newPath = newFilter === 'all' ? basePath : `${basePath}/${newFilter}`
      go(newPath)
    },
  })

  // Route information
  const routeInfo = computed(() => ({
    path: route.path,
    params: route.data?.params || {},
    isHomePage: route.path === '/forum' || route.path === '/forum/',
    isUserPage: route.path.includes('/forum/user/'),
    isTopicPage: route.path.includes('/forum/topic/'),
    currentFilter: routeFilter.value,
  }))

  // Route-based page type detection
  const pageType = computed<'home' | 'user' | 'topic'>(() => {
    const path = route.path
    if (path.includes('/forum/user/'))
      return 'user'
    if (path.includes('/forum/topic/'))
      return 'topic'
    return 'home'
  })

  // Extract creator from user page routes
  const routeCreator = computed(() => {
    if (pageType.value === 'user') {
      const userMatch = route.path.match(/\/forum\/user\/([^/]+)/)
      return userMatch ? decodeURIComponent(userMatch[1]) : null
    }
    return null
  })

  // Actions
  const navigateToFilter = (filter: ForumAPI.FilterBy): void => {
    routeFilter.value = filter
  }

  const navigateToUser = (username: string): void => {
    go(`/forum/user/${encodeURIComponent(username)}`)
  }

  const navigateToTopic = (topicId: string | number): void => {
    go(`/forum/topic/${topicId}`)
  }

  const navigateToHome = (): void => {
    go('/forum')
  }

  const setPage = (page: number): void => {
    if (page > 0) {
      currentPage.value = page as 1
    }
  }

  const resetPage = (): void => {
    currentPage.value = FORUM_CONFIG.DEFAULT_PAGE
  }

  const setCreator = (creator: string | null): void => {
    currentCreator.value = creator
  }

  const setSort = (sort: ForumAPI.SortMethod): void => {
    currentSort.value = sort
  }

  // Build query parameters for API calls
  const buildQueryParams = (additionalParams?: Record<string, any>) => {
    const params: Record<string, any> = {
      filter: routeFilter.value,
      sort: currentSort.value,
      page: currentPage.value,
    }

    if (currentCreator.value || routeCreator.value) {
      params.creator = currentCreator.value || routeCreator.value
    }

    return { ...params, ...additionalParams }
  }

  // Watch route changes to update creator
  watch(
    routeCreator,
    (newCreator) => {
      if (newCreator !== currentCreator.value) {
        currentCreator.value = newCreator
      }
    },
    { immediate: true },
  )

  return {
    // State
    currentPage,
    currentCreator,
    currentSort,

    // Computed
    routeFilter,
    routeInfo,
    pageType,
    routeCreator,

    // Actions
    navigateToFilter,
    navigateToUser,
    navigateToTopic,
    navigateToHome,
    setPage,
    resetPage,
    setCreator,
    setSort,
    buildQueryParams,
  }
})
