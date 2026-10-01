<script setup lang="ts">
import type { SearchPageController } from './useSearchPageController'
import type { ForumSearchFacet } from '~/forum/services/forumSearchQuery'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumSearchToken } from '~/forum/composables/view/useForumSearchToken'
import { parseForumSearchQuery } from '~/forum/services/forumSearchQuery'
import ForumTopicResults from '../list/ForumTopicResults.vue'
import ForumSearchFilterPicker from './ForumSearchFilterPicker.vue'
import ForumSearchInput from './ForumSearchInput.vue'
import ForumSearchSettingsDrawer from './ForumSearchSettingsDrawer.vue'
import ForumTopicSearchInfo from './ForumTopicSearchInfo.vue'

const props = defineProps<{
  searchModel: SearchPageController['searchModel']
  results: SearchPageController['results']
  actions: SearchPageController['actions']
}>()
const { queryDraft, list, recentSearches, hasCriteria, suggestionMode } = props.searchModel
const { topics, suggestionTopics, loadStateMessage } = props.results
const { toggleFacet, leaveSearch, login } = props.actions
const { message } = useLocalized()
const { formatSearchQuery } = useForumSearchToken()
const activeFacet = ref<ForumSearchFacet | null>(null)
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
function runSearch(value: string): void {
  activeFacet.value = null
  if (value.trim())
    historyCleared.value = false
  void props.actions.runSearch(value)
}
function applySettings(settings: Parameters<SearchPageController['actions']['applySettings']>[0]): void {
  activeFacet.value = null
  if (settings.query.trim())
    historyCleared.value = false
  void props.actions.applySettings(settings)
}
function clearRecentSearches(): void {
  props.actions.clearRecentSearches()
  historyCleared.value = true
  historyExpanded.value = false
}
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
      <ForumTopicResults
        :data="topics.rows.value" :loading="topics.isLoading.value" :loading-more="topics.loadingMore.value"
        :error="topics.error.value" :can-load-more="topics.canLoadMore.value"
        :sort="list?.sort ?? 'created'" :query="list?.q ?? ''"
        :load-more="topics.loadMore" :refresh-data="topics.refetch" :text="loadStateMessage"
        @login="login"
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
