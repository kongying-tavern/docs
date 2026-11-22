import type { ForumFilter, ForumSort, ForumTopicType } from '@/src/forum/services/forumRoute.ts'
import type { ForumSearchFacet } from '@/src/forum/services/forumSearchQuery.ts'
import type { FORUM } from '@/src/forum/shared/types.d.ts'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForumTopicsQuery } from '@/src/forum/hooks/data/useForumQueries.ts'
import { useForumRoute } from '@/src/forum/hooks/state/useForumRoute.ts'
import { useForumViewMode } from '@/src/forum/hooks/state/useForumViewMode.ts'
import { resolveForumListScope } from '@/src/forum/services/forumListSkeleton.ts'
import { parseForumSearchQuery, toggleForumSearchFacet } from '@/src/forum/services/forumSearchQuery.ts'

export function useSearchPageController() {
  const { route, list, navigate, submitSearch } = useForumRoute()
  const { t } = useI18n({ useScope: 'global' })
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
      return t('forum.loadError')
    return topics.canLoadMore.value ? t('forum.loadMore') : t('forum.noMore')
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
