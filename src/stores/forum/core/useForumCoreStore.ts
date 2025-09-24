import { defineStore } from 'pinia'
import { useForumRouteState } from './useForumRouteState'
import { useForumSearchHistory } from './useForumSearchHistory'
import { useForumSearchState } from './useForumSearchState'
import { useForumViewState } from './useForumViewState'

/**
 * Forum Core Store - Composition Root
 * Combines specialized stores into a cohesive interface
 * Following Composition over Inheritance principle
 */
export const useForumCoreStore = defineStore('forum-core', () => {
  // Initialize specialized stores
  const routeState = useForumRouteState()
  const searchState = useForumSearchState()
  const searchHistory = useForumSearchHistory()
  const viewState = useForumViewState()

  // Composite actions that work across stores
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      searchState.clearSearch()
      return
    }

    // Update search state
    searchState.setSearchQuery(query)
    searchState.setSearching(true)
    searchState.setSearchActive(true)

    try {
      // Add to history
      searchHistory.addToHistory(query)

      // Reset pagination when searching
      routeState.resetPage()

      // The actual search API call would be handled by data stores
      // This store only manages UI state
    }
    catch (error) {
      console.error('Search failed:', error)
      searchState.setSearching(false)
    }
  }

  const clearAllSearch = () => {
    searchState.clearSearch()
    searchHistory.clearHistory()
  }

  const resetAllSettings = () => {
    viewState.resetToDefaults()
    searchState.clearSearch()
    routeState.resetPage()
  }

  // Cross-store computed values
  const globalState = {
    // Route info
    get currentRoute() { return routeState.routeInfo },
    get pageType() { return routeState.pageType },
    get currentFilter() { return routeState.routeFilter },

    // Search info
    get searchActive() { return searchState.isSearchActive },
    get hasSearchQuery() { return searchState.hasSearchQuery },
    get searchQuery() { return searchState.searchQuery },

    // View info
    get viewMode() { return viewState.viewMode },
    get layoutConfig() { return viewState.layoutConfig },

    // History info
    get hasSearchHistory() { return searchHistory.hasHistory },
    get recentSearches() { return searchHistory.recentSearches },
  }

  return {
    // Expose specialized stores
    route: routeState,
    search: searchState,
    history: searchHistory,
    view: viewState,

    // Composite actions
    performSearch,
    clearAllSearch,
    resetAllSettings,

    // Global state
    globalState,
  }
})
