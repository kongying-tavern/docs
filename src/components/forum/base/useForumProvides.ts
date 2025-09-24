import type ForumAPI from '@/apis/forum/api'
import type { Ref } from 'vue'
import type { FORUM } from '../types'
import { useLocalStorage } from '@vueuse/core'
import { provide } from 'vue'
import { FORUM_TOPIC_CAN_LOAD_MORE, FORUM_TOPIC_FILTER_KEY, FORUM_TOPIC_LOADING_KEY, FORUM_TOPIC_SORT_KEY, FORUM_TOPIC_VIEW_MODE_KEY, FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from '../shared'

export interface ForumStoreInstance {
  sort: Ref<ForumAPI.SortMethod>
  filter: Ref<ForumAPI.FilterBy>
  loading: Ref<boolean>
  canLoadMore: Ref<boolean>
  searchTopics: (query: string | string[]) => Promise<void>
}

export function useForumProvides(store: ForumStoreInstance) {
  // View mode with localStorage persistence
  const viewMode = useLocalStorage<FORUM.TopicViewMode>(FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY, 'Card')

  // Provide context for child components
  provide(FORUM_TOPIC_VIEW_MODE_KEY, viewMode)
  provide(FORUM_TOPIC_SORT_KEY, store.sort)
  provide(FORUM_TOPIC_FILTER_KEY, store.filter)
  provide(FORUM_TOPIC_LOADING_KEY, store.loading)
  provide(FORUM_TOPIC_CAN_LOAD_MORE, store.canLoadMore)
  provide('searchTopics', store.searchTopics)

  return {
    viewMode,
  }
}
