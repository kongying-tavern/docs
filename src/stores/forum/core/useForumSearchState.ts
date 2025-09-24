import type ForumAPI from '@/apis/forum/api'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Forum Search State Management
 * Focused on search query state, history and suggestions
 */
export const useForumSearchState = defineStore('forum-search-state', () => {
  // Core search state
  const searchQuery = ref<string>('')
  const isSearching = ref(false)
  const searchResults = ref<ForumAPI.Topic[]>([])
  const isSearchActive = ref(false)

  // Search configuration
  const searchConfig = {
    minQueryLength: 2,
    debounceMs: 300,
  }

  // Computed
  const hasSearchQuery = computed(() =>
    searchQuery.value.trim().length >= searchConfig.minQueryLength,
  )
  const hasSearchResults = computed(() => searchResults.value.length > 0)

  const searchState = computed(() => ({
    query: searchQuery.value,
    isSearching: isSearching.value,
    results: searchResults.value,
    isActive: isSearchActive.value,
    hasQuery: hasSearchQuery.value,
    hasResults: hasSearchResults.value,
  }))

  // Actions
  const setSearchQuery = (query: string): void => {
    searchQuery.value = query
  }

  const setSearching = (searching: boolean): void => {
    isSearching.value = searching
  }

  const setSearchResults = (results: ForumAPI.Topic[]): void => {
    searchResults.value = results
  }

  const setSearchActive = (active: boolean): void => {
    isSearchActive.value = active
  }

  const clearSearch = (): void => {
    searchQuery.value = ''
    searchResults.value = []
    isSearching.value = false
    isSearchActive.value = false
  }

  return {
    // State
    searchQuery,
    isSearching,
    searchResults,
    isSearchActive,

    // Config
    searchConfig,

    // Computed
    hasSearchQuery,
    hasSearchResults,
    searchState,

    // Actions
    setSearchQuery,
    setSearching,
    setSearchResults,
    setSearchActive,
    clearSearch,
  }
})
