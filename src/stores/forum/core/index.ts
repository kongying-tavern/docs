/**
 * Forum Core Stores - Modular Architecture
 *
 * This directory contains specialized stores following Single Responsibility Principle:
 *
 * - useForumSearchState: Search query state and results
 * - useForumSearchHistory: Search history and suggestions with persistence
 * - useForumViewState: UI view modes, layout preferences and display options
 * - useForumRouteState: Route-based navigation and URL synchronization
 * - useForumCoreStore: Composition root that combines specialized stores
 *
 * Benefits:
 * - Clear separation of concerns
 * - Better testability
 * - Easier maintenance
 * - Composition over inheritance
 */

// Re-export types for convenience
export type {
  ForumRouteState,
  ForumSearchHistory,
  ForumSearchState,
  ForumViewState,
} from './types'
// Composition root
export { useForumCoreStore } from './useForumCoreStore'
export { useForumRouteState } from './useForumRouteState'
export { useForumSearchHistory } from './useForumSearchHistory'

// Specialized stores
export { useForumSearchState } from './useForumSearchState'

export { useForumViewState } from './useForumViewState'
