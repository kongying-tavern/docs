# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the documentation website for "空荧酒馆" (Kongying Tavern), an open-source Genshin Impact map application. The site is built with VitePress and supports multiple languages (Chinese, English, Japanese).

## Development Commands

Essential commands for development:

```bash
# Setup (requires Node.js v18.0.0+)
corepack enable
pnpm i

# Development
pnpm run dev              # Start dev server
pnpm run build            # Build for production
pnpm run serve            # Preview production build

# Data and Content
pnpm run build-data       # Refresh all data (blog + member lists)
pnpm run build-blog       # Refresh blog data only
pnpm run build-member     # Refresh member list data only
pnpm run build-emoji      # Build emoji data

# Code Quality
pnpm run lint             # Run ESLint + Chinese text linting
pnpm run lint:eslint-fix  # Auto-fix ESLint issues
pnpm run lint:zh-fix      # Auto-fix Chinese text issues

# Specialized builds
pnpm run build-mpa        # Build as Multi-Page Application
```

## Architecture

### Core Structure
- **`.vitepress/`** - VitePress configuration and theme customization
  - `config.ts` - Main VitePress configuration
  - `theme/` - Custom theme components and styles
  - `locales/` - Internationalization configurations
- **`src/`** - Content source files
  - `zh/`, `en/`, `ja/` - Localized content directories
  - `components/` - Vue components (forum, team, release pages)
  - `public/` - Static assets (images, fonts, emojis)
  - `_data/` - JSON data files

### Key Features
- **Multi-language support** with locale-specific routing
- **Forum system** with Vue components for community interaction
- **Custom emoji system** with categorized emoji collections
- **Team and staff pages** with member data management
- **VitePress-based documentation** with custom markdown extensions

### Development Notes
- Uses **pnpm** as package manager with workspace configuration
- **UnoCSS** for utility-first styling
- **TypeScript** throughout the codebase
- **Vue 3** for interactive components
- Custom markdown plugins for enhanced content formatting
- Font optimization with Fontaine
- Chinese text linting with `zhlint`

### Content Management
- Blog posts and member data are refreshed via build scripts
- Emoji data is processed from `/src/public/emojis/` directory structure
- Static assets organized by language in `/src/public/imgs/`
- Translation management with Lunaria integration

## Authentication & Authorization Architecture

The project implements a comprehensive authentication system with the following components:

### Core Authentication Files
- **`.vitepress/theme/stores/useUserAuth.ts`** - Main Pinia store for authentication state management
- **`.vitepress/theme/hooks/useLogin.ts`** - Login flow management and OAuth integration
- **`.vitepress/theme/utils/auth-helpers.ts`** - Unified authentication utility functions
- **`.vitepress/theme/utils/auth-logger.ts`** - Centralized logging system for auth operations
- **`.vitepress/theme/utils/auth-errors.ts`** - Standardized error handling for auth operations

### Authentication Flow
1. **OAuth Integration**: Gitee OAuth for primary authentication
2. **SSO Support**: Inter-knot.site single sign-on integration
3. **Token Management**: Automatic token refresh with background timers
4. **State Persistence**: LocalStorage-based authentication state persistence

### Key Features
- **Automatic Token Refresh**: Background refresh 1 second before expiration
- **SSO Token Management**: Separate handling for multiple SSO platforms
- **Error Recovery**: Intelligent retry logic with exponential backoff
- **Debug Logging**: Comprehensive logging system with color-coded groups
- **Vue Reactivity**: Proper integration with Vue 3 reactive system

### Authentication Patterns
- Use `authGuards.requireLogin()` for login-protected operations
- Use `withAuth.execute()` for authenticated API calls
- Use `useAuthHelper()` for accessing authentication utilities
- Use `log.info(LogGroup.*, message)` for consistent logging


## Forum Event System Architecture

The forum implements a comprehensive event-driven architecture for real-time state synchronization across pages and browser tabs.

### Core Event System Files
- **`src/components/forum/events/ForumEventBus.ts`** - Central event bus using mitt library with typed event definitions
- **`src/composables/useGlobalForumEvents.ts`** - Global cross-page synchronization using localStorage and storage events
- **`src/composables/useForumEvents.ts`** - Local event listener setup and management
- **`src/stores/forum/useForumHomeStore.ts`** - Main forum store with event-driven state updates

### Event Flow Architecture

#### 1. **Local Operations**
```
User Action → API Call → Success → Event Emission → Local Store Update → UI Update
```

#### 2. **Cross-Page Synchronization** 
```
Page A: Event Emission → localStorage Write → Storage Event
Page B: Storage Event → Event Re-emission → Store Update → UI Update
```

#### 3. **Cross-Tab Synchronization**
```
Tab 1: Topic Operation → localStorage Update
Tab 2: Storage Event Listener → Synthetic Event → Store Update
```

### Event Types and Operations

#### Topic Events
- **`topic:created`** - New topic submission
- **`topic:deleted`** - Topic deletion
- **`topic:pinned`** - Pin/unpin operations  
- **`topic:hidden`** - Hide/unhide operations (state: 'progressing'/'open')
- **`topic:closed`** - Close/reopen operations (state: 'closed'/'open')
- **`topic:type-changed`** - Topic type modifications
- **`topic:tags-updated`** - Tag modifications
- **`topic:comment-toggled`** - Comment area enable/disable
- **`topic:updated`** - General topic updates

#### Comment Events
- **`comment:created`** - New comment submission
- **`comment:deleted`** - Comment deletion
- **`comment:updated`** - Comment modifications

### State Management Strategy

#### Multi-Store Architecture
Each page maintains independent stores to prevent state pollution:
- **Home Page**: `useForumHomeStore` with `useForumData`
- **User Page**: `useForumUserStore` with `useForumData` 
- **Topic Page**: Topic-specific state management

#### Data Synchronization Points
All stores maintain three data arrays that must stay synchronized:
- **`data`** - Main topic list from API
- **`userSubmittedTopic`** - User's recently submitted topics
- **`pinnedTopicsData`** - Pinned topics list

### Event Deduplication System

#### Global Events (1000ms window)
```typescript
const recentEvents = new Set<string>()
function isRecentEvent(key: string): boolean {
  if (recentEvents.has(key)) return true
  recentEvents.add(key)
  setTimeout(() => recentEvents.delete(key), 1000)
  return false
}
```

#### Store Events (500ms window)
```typescript
const recentStoreEvents = new Set<string>()
function isRecentStoreEvent(eventType: string, topicId: string | number): boolean {
  const key = `${eventType}-${topicId}`
  if (recentStoreEvents.has(key)) return true
  recentStoreEvents.add(key)
  setTimeout(() => recentStoreEvents.delete(key), 500)
  return false
}
```

### Cross-Page Communication

#### localStorage Event Keys
- `forum:topic:deleted` - Topic deletion events
- `forum:topic:closed` - Topic close/open events  
- `forum:topic:hidden` - Topic hide/unhide events
- `forum:topic:pinned` - Pin state changes
- `forum:topic:tags-updated` - Tag modifications
- `forum:topic:type-changed` - Type changes
- `forum:topic:comment-toggled` - Comment area toggles
- `forum:topic:updated` - General updates

#### Pending Events Processing
On page mount, checks localStorage for pending cross-page events:
```typescript
function checkPendingEvents() {
  eventKeys.forEach(key => {
    const storedValue = localStorage.getItem(key)
    if (storedValue) {
      handleStorageChanges({ key, newValue: storedValue, storageArea: localStorage })
      localStorage.removeItem(key)
    }
  })
}
```

### Topic State Management

#### Hidden vs Closed Logic
- **Hidden Topics**: 
  - Removed from active lists (userSubmittedTopic)
  - Kept in main data with state='progressing' 
  - Available in "已结反馈" filter
  - pinnedTopicsData state updated but not removed

- **Closed Topics**: 
  - Completely removed from all lists
  - Not available in any filter
  - Removed from pinnedTopicsData

#### Pin State Management
- **Pin**: Add to pinnedTopicsData.unshift() 
- **Unpin**: Remove from pinnedTopicsData
- All other operations sync pinnedTopicsData state

### Event System Patterns

#### Event Emission Pattern
```typescript
// In composables (e.g., useTopicManger.ts)
if (result) {
  targetTopic.state = newState
  forumEvents.topicClosed(targetTopic.id, isClosed)
}
```

#### Event Listening Pattern  
```typescript
// In stores (e.g., useForumHomeStore.ts)
onTopicClosed: ({ topicId, closed }) => {
  if (isRecentStoreEvent('closed', topicId)) return
  if (closed) {
    removeTopic(topicId) // Removes from all lists including pinnedTopicsData
  } else {
    updateTopicVisibility(topicId, { closed })
  }
}
```

#### Global Event Registration Pattern
```typescript
// In useGlobalForumEvents.ts (singleton pattern)
let globalEventListenersSetup = false
export function useGlobalForumEvents() {
  if (globalEventListenersSetup) {
    return { setupGlobalListeners: () => {}, cleanup: cleanupFunction }
  }
  // ... setup global listeners
}
```

### Usage Guidelines

#### For New Topic Operations
1. Add event type to `ForumEventMap` interface
2. Add helper function to `forumEvents` object
3. Emit event after successful API call in operation composable
4. Add global listener in `useGlobalForumEvents.ts` for localStorage sync
5. Add store listener in relevant stores for local state update
6. Add to `pendingEvents` check list for cross-page sync

#### For Store Updates
Always update all three data sources:
```typescript
function updateTopicState(id: string, updates: any) {
  // Update main data
  const topic = data.value?.find(t => t.id === id)
  if (topic) Object.assign(topic, updates)
  
  // Update user submitted topics  
  const userTopic = userSubmittedTopic.value.find(t => t.id === id)
  if (userTopic) Object.assign(userTopic, updates)
  
  // Update pinned topics data
  const pinnedTopic = pinnedTopicsData.value?.find(t => t.id === id)
  if (pinnedTopic) Object.assign(pinnedTopic, updates)
}
```

## Lint and Build Requirements

Always run `pnpm run lint` before committing changes to ensure code quality and proper Chinese text formatting.