import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

/**
 * Forum Search History Management
 * Handles search history, suggestions and persistence
 */
export const useForumSearchHistory = defineStore('forum-search-history', () => {
  // Persistent storage
  const searchHistory = useLocalStorage<string[]>('forum-search-history', [])
  const searchSuggestions = useLocalStorage<string[]>('forum-search-suggestions', [])

  // Configuration
  const historyConfig = {
    maxHistoryItems: 15,
    maxSuggestions: 8,
  }

  // Computed
  const recentSearches = computed(() =>
    searchHistory.value.slice(0, historyConfig.maxHistoryItems),
  )

  const topSuggestions = computed(() =>
    searchSuggestions.value.slice(0, historyConfig.maxSuggestions),
  )

  const hasHistory = computed(() => searchHistory.value.length > 0)

  // Actions
  const addToHistory = (query: string): void => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery || trimmedQuery.length < 2)
      return

    // Remove if already exists to avoid duplicates
    const filtered = searchHistory.value.filter(item => item !== trimmedQuery)

    // Add to beginning and limit size
    searchHistory.value = [trimmedQuery, ...filtered].slice(0, historyConfig.maxHistoryItems)
  }

  const removeFromHistory = (query: string): void => {
    searchHistory.value = searchHistory.value.filter(item => item !== query)
  }

  const clearHistory = (): void => {
    searchHistory.value = []
  }

  const addSuggestion = (suggestion: string): void => {
    const trimmedSuggestion = suggestion.trim()
    if (!trimmedSuggestion)
      return

    if (!searchSuggestions.value.includes(trimmedSuggestion)) {
      searchSuggestions.value = [trimmedSuggestion, ...searchSuggestions.value]
        .slice(0, historyConfig.maxSuggestions)
    }
  }

  const removeSuggestion = (suggestion: string): void => {
    searchSuggestions.value = searchSuggestions.value.filter(item => item !== suggestion)
  }

  const clearSuggestions = (): void => {
    searchSuggestions.value = []
  }

  const getFilteredSuggestions = (query: string): string[] => {
    if (!query.trim())
      return topSuggestions.value

    const lowerQuery = query.toLowerCase().trim()
    return searchSuggestions.value
      .filter(suggestion => suggestion.toLowerCase().includes(lowerQuery))
      .slice(0, historyConfig.maxSuggestions)
  }

  const getFilteredHistory = (query: string): string[] => {
    if (!query.trim())
      return recentSearches.value

    const lowerQuery = query.toLowerCase().trim()
    return searchHistory.value
      .filter(item => item.toLowerCase().includes(lowerQuery))
      .slice(0, historyConfig.maxHistoryItems)
  }

  return {
    // State
    searchHistory,
    searchSuggestions,

    // Config
    historyConfig,

    // Computed
    recentSearches,
    topSuggestions,
    hasHistory,

    // Actions
    addToHistory,
    removeFromHistory,
    clearHistory,
    addSuggestion,
    removeSuggestion,
    clearSuggestions,
    getFilteredSuggestions,
    getFilteredHistory,
  }
})
