import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from '~/components/forum/types'

// Forum Search State Types
export interface ForumSearchState {
  searchQuery: string
  isSearching: boolean
  searchResults: ForumAPI.Topic[]
  isSearchActive: boolean
  hasSearchQuery: boolean
  hasSearchResults: boolean
}

// Forum Search History Types
export interface ForumSearchHistory {
  searchHistory: string[]
  searchSuggestions: string[]
  recentSearches: string[]
  topSuggestions: string[]
  hasHistory: boolean
}

// Forum View State Types
export interface ForumViewState {
  viewMode: FORUM.TopicViewMode
  showSidebar: boolean
  compactMode: boolean
  showTopicPreviews: boolean
  showAuthorAvatars: boolean
  itemsPerPage: number
  autoRefresh: boolean
  autoRefreshInterval: number
}

// Forum Route State Types
export interface ForumRouteState {
  currentPage: number
  currentCreator: string | null
  currentSort: ForumAPI.SortMethod
  routeFilter: ForumAPI.FilterBy
  pageType: 'home' | 'user' | 'topic'
  routeCreator: string | null
}

export interface RouteInfo {
  path: string
  params: Record<string, string>
  isHomePage: boolean
  isUserPage: boolean
  isTopicPage: boolean
  currentFilter: ForumAPI.FilterBy
}

export interface LayoutConfig {
  viewMode: FORUM.TopicViewMode
  showSidebar: boolean
  compactMode: boolean
  showPreviews: boolean
  showAvatars: boolean
  itemsPerPage: number
}

// Forum Core Store Composition
export interface ForumCoreStore {
  route: ForumRouteState
  search: ForumSearchState
  history: ForumSearchHistory
  view: ForumViewState
  globalState: {
    currentRoute: RouteInfo
    pageType: 'home' | 'user' | 'topic'
    currentFilter: ForumAPI.FilterBy
    searchActive: boolean
    hasSearchQuery: boolean
    searchQuery: string
    viewMode: FORUM.TopicViewMode
    layoutConfig: LayoutConfig
    hasSearchHistory: boolean
    recentSearches: string[]
  }
}

// Configuration Types
export interface SearchConfig {
  minQueryLength: number
  debounceMs: number
}

export interface HistoryConfig {
  maxHistoryItems: number
  maxSuggestions: number
}

export interface ViewConfig {
  defaultViewMode: FORUM.TopicViewMode
  defaultItemsPerPage: number
  autoRefreshInterval: number
}

// Event Types for Store Communication
export interface StoreEvent {
  type: string
  payload?: Record<string, unknown>
  timestamp: number
}

export interface SearchEvent extends StoreEvent {
  type: 'search:query-changed' | 'search:results-updated' | 'search:history-added'
  payload: {
    query?: string
    results?: ForumAPI.Topic[]
    historyItem?: string
  }
}

export interface ViewEvent extends StoreEvent {
  type: 'view:mode-changed' | 'view:layout-updated' | 'view:settings-reset'
  payload: {
    viewMode?: FORUM.TopicViewMode
    layoutConfig?: LayoutConfig
  }
}

export interface RouteEvent extends StoreEvent {
  type: 'route:filter-changed' | 'route:page-changed' | 'route:navigation'
  payload: {
    filter?: ForumAPI.FilterBy
    page?: number
    path?: string
  }
}
