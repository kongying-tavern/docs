import type { FORUM } from '~/forum/components/types'
import type { ForumFilter, ForumSort, ForumTopicType } from '~/forum/services/forumRoute'
import type { ForumSearchFacet } from '~/forum/services/forumSearchQuery'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicsQuery } from '~/forum/composables/data/useForumQueries'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useForumViewMode } from '~/forum/composables/state/useForumViewMode'
import { resolveForumListScope } from '~/forum/services/forumListSkeleton'
import { parseForumSearchQuery, toggleForumSearchFacet } from '~/forum/services/forumSearchQuery'

export function useSearchPageController() {
  const { route, list, navigate, submitSearch } = useForumRoute()
  const { message } = useLocalized()
  const { setViewMode } = useForumViewMode()
  const queryDraft = ref(list.value?.q ?? '')
  const recentSearches = useLocalStorage<string[]>('forum-recent-searches', [])
  const search = computed(() => parseForumSearchQuery(list.value?.q ?? ''))
  const hasCriteria = computed(() => Boolean(list.value?.q.trim())
    || (list.value?.filter !== undefined && list.value.filter !== 'all')
    || (list.value?.topicType !== undefined && list.value.topicType !== 'all')
    || (list.value?.sort !== undefined && list.value.sort !== 'created'))
  const suggestionMode = computed(() => Boolean(parseForumSearchQuery(queryDraft.value).text.trim()) && queryDraft.value !== (list.value?.q ?? ''))

  watch(() => list.value?.q ?? '', q => queryDraft.value = q)

  async function runSearch(value: string): Promise<void> {
    const query = value.trim()
    queryDraft.value = query
    if (query)
      recentSearches.value = [query, ...recentSearches.value.filter(item => item !== query)].slice(0, 12)
    await submitSearch(query)
  }

  async function applySettings(settings: {
    query: string
    filter: ForumFilter
    topicType: ForumTopicType
    sort: ForumSort
    viewMode: FORUM.TopicViewMode
  }): Promise<void> {
    const current = route.value
    if (current?.name !== 'search')
      return
    const query = settings.query.trim()
    queryDraft.value = query
    if (query) {
      recentSearches.value = [query, ...recentSearches.value.filter(item => item !== query)].slice(0, 12)
    }
    await setViewMode(settings.viewMode)
    await navigate({
      ...current,
      list: { ...current.list, q: query, filter: settings.filter, topicType: settings.topicType, sort: settings.sort },
    })
  }

  function clearRecentSearches(): void {
    recentSearches.value = []
  }

  function toggleFacet(facet: ForumSearchFacet, value: string): void {
    queryDraft.value = toggleForumSearchFacet(queryDraft.value, facet, value)
  }

  function topicParams(query: ReturnType<typeof parseForumSearchQuery>) {
    return {
      filter: list.value?.filter ?? 'all',
      topicType: list.value?.topicType ?? 'all',
      sort: list.value?.sort ?? 'created',
      q: query.text,
      tags: query.tags,
      statuses: query.states,
      creator: query.author ?? (route.value?.name === 'search' ? route.value.username : null),
    }
  }

  const topics = useForumTopicsQuery(computed(() => topicParams(search.value)), hasCriteria, computed(() => resolveForumListScope(route.value)))
  const suggestionTopics = useForumTopicsQuery(
    computed(() => topicParams(parseForumSearchQuery(''))),
    computed(() => !hasCriteria.value || suggestionMode.value),
  )

  const loadStateMessage = computed(() => {
    if (topics.error.value)
      return message.value.forum.loadError
    return topics.canLoadMore.value ? message.value.forum.loadMore : message.value.forum.noMore
  })
  function login(): void {
    location.hash = 'login-alert'
  }

  return {
    searchModel: { queryDraft, list, recentSearches, hasCriteria, suggestionMode },
    results: { topics, suggestionTopics, loadStateMessage },
    actions: { runSearch, applySettings, clearRecentSearches, toggleFacet, login },
  }
}
export type SearchPageController = ReturnType<typeof useSearchPageController>
