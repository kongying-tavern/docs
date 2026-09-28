<script setup lang="ts">
import type { FORUM } from '~/components/forum/types'
import type { ForumFilter, ForumSort, ForumTopicType } from '~/forum/services/forumRoute'
import type { ForumSearchFacet } from '~/forum/services/forumSearchQuery'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicsQuery } from '~/composables/forum/useForumQueries'
import { useForumRoute } from '~/composables/useForumRoute'
import { useForumSearchToken } from '~/composables/useForumSearchToken'
import { useForumViewMode } from '~/composables/useForumViewMode'
import { resolveForumListScope } from '~/forum/services/forumListSkeleton'
import { parseForumSearchQuery, toggleForumSearchFacet } from '~/forum/services/forumSearchQuery'
import ForumTopicList from '../list/ForumTopicList.vue'
import ForumLoadState from '../ui/ForumLoadState.vue'
import ForumSearchFilterPicker from './ForumSearchFilterPicker.vue'
import ForumSearchInput from './ForumSearchInput.vue'
import ForumSearchSettingsDrawer from './ForumSearchSettingsDrawer.vue'
import ForumTopicSearchInfo from './ForumTopicSearchInfo.vue'

const { route, list, leaveSearch, navigate, submitSearch } = useForumRoute()
const { message } = useLocalized()
const { formatSearchQuery } = useForumSearchToken()
const { setViewMode } = useForumViewMode()
const queryDraft = ref(list.value?.q ?? '')
const activeFacet = ref<ForumSearchFacet | null>(null)
const recentSearches = useLocalStorage<string[]>('forum-recent-searches', [])
const historyExpanded = ref(false)
const historyCleared = ref(false)
const visibleSearches = computed(() => historyExpanded.value ? recentSearches.value : recentSearches.value.slice(0, 6))
const sectionTitle = computed(() => {
  if (activeFacet.value === 'state')
    return message.value.forum.header.search.stateFilter
  if (activeFacet.value === 'tags')
    return message.value.forum.topic.searchFacets.tags
  if (activeFacet.value === 'author')
    return message.value.forum.header.search.userFilter
  return message.value.forum.header.search.searchContent
})
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
  activeFacet.value = null
  if (query)
    recentSearches.value = [query, ...recentSearches.value.filter(item => item !== query)].slice(0, 12)
  if (query)
    historyCleared.value = false
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
  activeFacet.value = null
  if (query) {
    recentSearches.value = [query, ...recentSearches.value.filter(item => item !== query)].slice(0, 12)
    historyCleared.value = false
  }
  await setViewMode(settings.viewMode)
  await navigate({
    ...current,
    list: { ...current.list, q: query, filter: settings.filter, topicType: settings.topicType, sort: settings.sort },
  })
}

function clearRecentSearches(): void {
  recentSearches.value = []
  historyCleared.value = true
  historyExpanded.value = false
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
</script>

<template>
  <div class="forum-search-page">
    <header class="forum-search-page-header">
      <ForumSearchInput
        v-model:query="queryDraft"
        class="flex-1 min-w-0"
        :suggestions="suggestionTopics.rows.value"
        :suggestion-mode="suggestionMode"
        :suggestion-loading="suggestionTopics.isLoading.value"
        :suggestion-error="Boolean(suggestionTopics.error.value)"
        autofocus
        page
        @submit="runSearch"
      />
      <ForumSearchSettingsDrawer
        :query="queryDraft"
        :filter="list?.filter ?? 'all'"
        :topic-type="list?.topicType ?? 'all'"
        :sort="list?.sort ?? 'created'"
        @search="applySettings"
      />
      <Button type="button" variant="ghost" class="px-4 shrink-0 h-12" @click="leaveSearch">
        {{ message.ui.button.cancel }}
      </Button>
    </header>

    <template v-if="!hasCriteria && !suggestionMode">
      <section class="forum-search-section" :aria-label="sectionTitle">
        <h2 class="forum-search-section-title">
          {{ sectionTitle }}
        </h2>
        <ForumSearchFilterPicker
          :query="parseForumSearchQuery(queryDraft)"
          :facet="activeFacet"
          :users="suggestionTopics.rows.value.map(topic => topic.user)"
          inline
          @back="activeFacet = null"
          @choose-facet="activeFacet = $event"
          @toggle="toggleFacet"
        />
      </section>

      <section v-if="!activeFacet && (recentSearches.length || historyCleared)" class="forum-search-section" :aria-label="message.forum.header.search.recentSearches">
        <div class="forum-search-history-heading">
          <h2 class="forum-search-section-title">
            {{ message.forum.header.search.recentSearches }}
          </h2>
          <div class="flex gap-1 items-center">
            <Button
              v-if="recentSearches.length"
              type="button"
              variant="ghost"
              size="icon-sm"
              :aria-label="message.forum.header.search.clearRecentSearches"
              @click="clearRecentSearches"
            >
              <span class="i-lucide-trash-2 size-4" aria-hidden="true" />
            </Button>
            <Button
              v-if="recentSearches.length > 6"
              type="button"
              variant="ghost"
              size="sm"
              :aria-expanded="historyExpanded"
              @click="historyExpanded = !historyExpanded"
            >
              {{ historyExpanded ? message.forum.header.search.collapseRecentSearches : message.forum.header.search.expandRecentSearches }}
              <span class="i-lucide-chevron-down size-4" :class="{ 'rotate-180': historyExpanded }" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div v-if="recentSearches.length" class="forum-search-history-grid">
          <Button
            v-for="item in visibleSearches"
            :key="item"
            type="button"
            variant="ghost"
            class="forum-search-history-item"
            :title="formatSearchQuery(item)"
            @click="runSearch(item)"
          >
            <span class="i-lucide-history shrink-0 size-4" aria-hidden="true" />
            <span class="truncate">{{ formatSearchQuery(item) }}</span>
          </Button>
        </div>
        <p v-else class="forum-search-history-empty" role="status">
          {{ message.forum.header.search.noRecentSearches }}
        </p>
      </section>
    </template>

    <template v-if="hasCriteria && !suggestionMode">
      <ForumTopicSearchInfo :loading="topics.isLoading.value" :total="topics.total.value" />
      <ForumTopicList
        :data="topics.rows.value"
        :loading="topics.isLoading.value || topics.loadingMore.value"
        :error="topics.error.value"
        :can-load-more="topics.canLoadMore.value"
        :sort="list?.sort ?? 'created'"
        :query="list?.q ?? ''"
        :load-more="topics.loadMore"
        :refresh-data="topics.refetch"
      />
      <ForumLoadState
        v-if="topics.rows.value.length > 0"
        :loading="topics.loadingMore.value"
        :error="Boolean(topics.error.value)"
        :can-load-more="topics.canLoadMore.value"
        :load-more="topics.loadMore"
        :retry="topics.refetch"
        :text="loadStateMessage"
      />
    </template>
  </div>
</template>

<style scoped>
.forum-search-page {
  --forum-search-content-width: min(688px, calc(100vw - 32px));

  width: min(720px, 100%);
  min-height: calc(100vh - var(--vp-nav-height) - 96px);
  margin: 0 auto;
  padding: 0 16px;
}

.forum-search-page-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 0 12px;
  background: var(--vp-c-bg);
}

.forum-search-section {
  padding: 16px 0 20px;
}

.forum-search-section-title {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 600;
}

.forum-search-history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 8px;
}

.forum-search-history-heading .forum-search-section-title {
  margin: 0;
  border: 0;
  padding: 0;
}

.forum-search-history-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 12px;
}

.forum-search-history-item {
  justify-content: flex-start;
  min-width: 0;
  color: var(--vp-c-text-2);
  font-weight: 400;
}

.forum-search-history-empty {
  margin: 24px 0;
  color: var(--vp-c-text-2);
  font-size: calc(14px * var(--site-ui-scale));
  text-align: center;
}

@media (max-width: 480px) {
  .forum-search-page-header {
    gap: 4px;
  }

  .forum-search-page-header > :last-child {
    padding: 0 12px;
  }
}
</style>
