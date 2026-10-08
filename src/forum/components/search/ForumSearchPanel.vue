<script setup lang="ts">
import type { SearchPageController } from './useSearchPageController'
import type { ForumSearchFacet } from '~/forum/services/forumSearchQuery'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { EmptyMorphFrame, EmptySwap } from '@/components/ui/empty-motion'
import { SearchFieldTransition } from '@/components/ui/search-field'
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
const { toggleFacet, login } = props.actions
const { message } = useLocalized()
const { formatSearchQuery } = useForumSearchToken()
const activeFacet = ref<ForumSearchFacet | null>(null)
const filterStage = useTemplateRef<HTMLElement>('filterStage')
watch(activeFacet, async (facet, previous) => {
  await nextTick()
  const panel = filterStage.value?.querySelector<HTMLElement>('.forum-filter-picker:not([inert])')
  const target = facet === 'author'
    ? panel?.querySelector<HTMLInputElement>('input')
    : facet
      ? panel?.querySelector<HTMLButtonElement>('button')
      : panel?.querySelector<HTMLButtonElement>(`[data-facet="${previous}"]`)
  target?.focus({ preventScroll: true })
})
const historyExpanded = ref(false)
const historyCleared = ref(false)
const visibleSearches = computed(() => historyExpanded.value ? recentSearches.value : recentSearches.value.slice(0, 6))
const sectionTitle = computed(() => {
  if (activeFacet.value === 'state')
    return message.value.forum.topic.searchFacets.stateTab
  if (activeFacet.value === 'tags')
    return message.value.forum.topic.searchFacets.tagsTab
  if (activeFacet.value === 'author')
    return message.value.forum.topic.searchFacets.authorTab
  return message.value.forum.header.search.searchContent
})
function hideLeavingFilter(element: Element): void {
  element.setAttribute('inert', '')
  element.setAttribute('aria-hidden', 'true')
}
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
    </header>

    <template v-if="!hasCriteria && !suggestionMode">
      <section class="forum-search-section" :aria-label="sectionTitle">
        <h2 class="forum-search-section-title">
          <EmptySwap :swap-key="sectionTitle">
            {{ sectionTitle }}
          </EmptySwap>
        </h2>
        <EmptyMorphFrame :morph-key="activeFacet ?? 'root'">
          <div ref="filterStage" class="forum-search-filter-stage">
            <SearchFieldTransition @before-leave="hideLeavingFilter">
              <ForumSearchFilterPicker
                :key="activeFacet ?? 'root'"
                :query="parseForumSearchQuery(queryDraft)"
                :facet="activeFacet"
                :users="suggestionTopics.rows.value.map(topic => topic.user)"
                inline
                @back="activeFacet = null"
                @choose-facet="activeFacet = $event"
                @toggle="toggleFacet"
              />
            </SearchFieldTransition>
          </div>
        </EmptyMorphFrame>
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

.forum-search-filter-stage {
  position: relative;
  width: 100%;
}

.forum-search-filter-stage :deep(.search-panel-leave-active) {
  position: absolute;
  inset: 0 0 auto;
}

.forum-search-section-title {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  @apply text-ui-14;
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
  @apply text-ui-14;
  text-align: center;
}

@media (max-width: 767px) {
  .forum-search-page-header {
    gap: 4px;
    padding: 12px 0 8px;
  }

  .forum-search-page-header :deep(.search-field-control) {
    min-height: 40px;
    gap: 6px;
    border-color: transparent;
    border-radius: 10px;
    padding-inline: 10px;
    background: var(--vp-c-default-soft);
  }

  .forum-search-page-header :deep(.search-field-control:focus-within) {
    border-color: var(--vp-c-divider);
  }

  .forum-search-page-header :deep(.search-field-input) {
    height: 38px;
    padding-inline: 0;
    font-size: 16px;
  }

  .forum-search-page-header :deep(.search-field-icon) {
    width: 16px;
    height: 16px;
    color: var(--vp-c-text-3);
  }

  .forum-search-page-header :deep(.forum-filter-drawer-trigger) {
    width: 40px;
    height: 40px;
    color: var(--vp-c-text-2);
  }

  .forum-search-page-header :deep(.forum-filter-drawer-trigger > span) {
    width: 18px;
    height: 18px;
  }

  .forum-search-section {
    padding: 16px 0;
  }

  .forum-search-section-title {
    margin-bottom: 12px;
    padding-bottom: 10px;
    @apply text-ui-13;
  }

  .forum-search-section :deep(.forum-filter-picker-category) {
    min-height: 80px;
    gap: 8px;
    font-weight: 400;
  }

  .forum-search-section :deep(.forum-filter-picker-category-icon) {
    width: 20px;
    height: 20px;
  }

  .forum-search-history-grid {
    column-gap: 8px;
  }

  .forum-search-history-item {
    padding-inline: 8px;
  }
}
</style>
