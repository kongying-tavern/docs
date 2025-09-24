import type ForumAPI from '@/apis/forum/api'
import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { debounce } from '~/components/forum/utils/dom-utils'
import { forumEvents } from '~/services/events/SimpleEventManager'

export const useForumSearchStore = defineStore('forum-search', () => {
  // State
  const searchQuery = ref<string>('')
  const isSearching = ref(false)
  const searchResults = ref<ForumAPI.Topic[]>([])
  const searchHistory = ref<string[]>([])
  const suggestions = ref<string[]>([])
  const isSearchActive = ref(false)

  // Search configuration
  const searchConfig = {
    minQueryLength: 2,
    maxHistoryItems: 10,
    debounceMs: 300,
  }

  // Getters
  const hasSearchQuery = computed(() => searchQuery.value.trim().length >= searchConfig.minQueryLength)
  const hasSearchResults = computed(() => searchResults.value.length > 0)
  const recentSearches = computed(() => searchHistory.value.slice(0, searchConfig.maxHistoryItems))

  const searchState = computed(() => ({
    query: searchQuery.value,
    isSearching: isSearching.value,
    hasQuery: hasSearchQuery.value,
    hasResults: hasSearchResults.value,
    resultsCount: searchResults.value.length,
    isActive: isSearchActive.value,
  }))

  // Debounced search function
  const debouncedSearch = debounce((query: string) => {
    if (query.trim().length >= searchConfig.minQueryLength) {
      performSearch(query.trim())
    }
    else {
      clearSearchResults()
    }
  }, searchConfig.debounceMs)

  // Actions
  function setSearchQuery(query: string): void {
    searchQuery.value = query

    if (query.trim()) {
      debouncedSearch(query.trim())
    }
    else {
      clearSearchResults()
    }

    forumEvents.search(query)
  }

  function performSearch(query: string): void {
    if (!query || query.length < searchConfig.minQueryLength) {
      return
    }

    isSearching.value = true
    isSearchActive.value = true

    // Add to search history if not already present
    if (!searchHistory.value.includes(query)) {
      searchHistory.value.unshift(query)

      // Keep only the most recent searches
      if (searchHistory.value.length > searchConfig.maxHistoryItems) {
        searchHistory.value = searchHistory.value.slice(0, searchConfig.maxHistoryItems)
      }
    }
  }

  function setSearchResults(results: ForumAPI.Topic[]): void {
    searchResults.value = results
    isSearching.value = false
  }

  function clearSearchResults(): void {
    searchResults.value = []
    isSearching.value = false
  }

  function clearSearchQuery(): void {
    searchQuery.value = ''
    clearSearchResults()
    isSearchActive.value = false
  }

  function setSearchActive(active: boolean): void {
    isSearchActive.value = active

    if (!active) {
      clearSearchQuery()
    }
  }

  function removeFromHistory(query: string): void {
    const index = searchHistory.value.indexOf(query)
    if (index > -1) {
      searchHistory.value.splice(index, 1)
    }
  }

  function clearSearchHistory(): void {
    searchHistory.value = []
  }

  function setSuggestions(newSuggestions: string[]): void {
    suggestions.value = newSuggestions
  }

  function addSuggestion(suggestion: string): void {
    if (!suggestions.value.includes(suggestion)) {
      suggestions.value.push(suggestion)
    }
  }

  function selectSuggestion(suggestion: string): void {
    setSearchQuery(suggestion)
  }

  function selectHistoryItem(query: string): void {
    setSearchQuery(query)
  }

  function getFilteredSuggestions(query: string): string[] {
    if (!query)
      return suggestions.value

    const lowerQuery = query.toLowerCase()
    return suggestions.value.filter(suggestion =>
      suggestion.toLowerCase().includes(lowerQuery),
    )
  }

  // Search utilities
  function highlightSearchTerm(text: string, term: string): string {
    if (!term || !text)
      return text

    const regex = new RegExp(`(${term})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  function isSearchMatch(topic: ForumAPI.Topic, query: string): boolean {
    if (!query)
      return true

    const lowerQuery = query.toLowerCase()

    // Check title
    if (topic.title && topic.title.toLowerCase().includes(lowerQuery)) {
      return true
    }

    // Check content
    if (topic.content?.text && topic.content.text.toLowerCase().includes(lowerQuery)) {
      return true
    }

    // Check tags
    if (topic.tags && topic.tags.some(tag =>
      tag.toLowerCase().includes(lowerQuery),
    )) {
      return true
    }

    // Check author
    if (topic.user?.username && topic.user.username.toLowerCase().includes(lowerQuery)) {
      return true
    }

    return false
  }

  function resetSearch(): void {
    searchQuery.value = ''
    searchResults.value = []
    isSearching.value = false
    isSearchActive.value = false
    suggestions.value = []
  }

  return {
    // State
    searchQuery: readonly(searchQuery),
    isSearching: readonly(isSearching),
    searchResults: readonly(searchResults),
    searchHistory: readonly(searchHistory),
    suggestions: readonly(suggestions),
    isSearchActive: readonly(isSearchActive),

    // Getters
    hasSearchQuery,
    hasSearchResults,
    recentSearches,
    searchState,

    // Actions
    setSearchQuery,
    performSearch,
    setSearchResults,
    clearSearchResults,
    clearSearchQuery,
    setSearchActive,
    removeFromHistory,
    clearSearchHistory,
    setSuggestions,
    addSuggestion,
    selectSuggestion,
    selectHistoryItem,
    getFilteredSuggestions,

    // Utilities
    highlightSearchTerm,
    isSearchMatch,
    resetSearch,
  }
})
