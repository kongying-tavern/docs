<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicsQuery, usePinnedTopicsQuery } from '~/forum/composables/data/useForumQueries'
import { forumTopicTransitioning, useForumRoute } from '~/forum/composables/state/useForumRoute'
import { resolveForumListScope } from '~/forum/services/forumListSkeleton'
import { parseForumSearchQuery } from '~/forum/services/forumSearchQuery'
import ForumAside from '../aside/ForumAside.vue'
import ForumListPage from '../layout/ForumListPage.vue'
import ForumTopicSearchInfo from '../search/ForumTopicSearchInfo.vue'
import ForumCarouselBento from './ForumCarouselBento.vue'

const { route, navigateFilter, navigateType, navigateSort, submitSearch } = useForumRoute()
// Retain the cached home's own filters while a detail/user route is active.
const homeRoute = shallowRef(route.value?.name === 'home' ? route.value : null)
watch(route, (value) => {
  if (value?.name === 'home')
    homeRoute.value = value
})
const list = computed(() => homeRoute.value?.list ?? null)
const active = computed(() => route.value?.name === 'home')
const search = computed(() => parseForumSearchQuery(list.value?.q ?? ''))
const topics = useForumTopicsQuery(computed(() => ({
  filter: list.value?.filter ?? 'all',
  topicType: list.value?.topicType ?? 'all',
  sort: list.value?.sort ?? 'created',
  q: search.value.text,
  tags: search.value.tags,
  statuses: search.value.states,
  creator: search.value.author,
})), active, computed(() => resolveForumListScope(homeRoute.value)))
const pinned = usePinnedTopicsQuery()
// Server/cache changes are immediate. Keep the displayed list intact while it
// is offscreen, then let TransitionGroup remove changed rows after returning.
const displayedRows = shallowRef(topics.rows.value)
watch([topics.rows, active, forumTopicTransitioning], ([rows, isActive, transitioning]) => {
  if (isActive && !transitioning)
    displayedRows.value = rows
})
const { message } = useLocalized()

const loadStateMessage = computed(() => {
  if (topics.error.value)
    return message.value.forum.loadError
  return topics.canLoadMore.value ? message.value.forum.loadMore : message.value.forum.noMore
})
function login(): void {
  location.hash = 'login-alert'
}
</script>

<template>
  <ForumListPage
    :render-data="displayedRows"
    :loading="topics.isLoading.value"
    :loading-more="topics.loadingMore.value"
    :error="topics.error.value"
    :can-load-more="topics.canLoadMore.value"
    :load-more="topics.loadMore"
    :refresh-data="topics.refetch"
    :load-state-message="loadStateMessage"
    :filter="list?.filter ?? 'all'"
    :topic-type="list?.topicType ?? 'all'"
    :sort="list?.sort ?? 'created'"
    :query="list?.q ?? ''"
    :on-filter-change="navigateFilter"
    :on-type-change="navigateType"
    :on-sort-change="navigateSort"
    :on-search="submitSearch"
    @login="login"
  >
    <template #header>
      <ForumCarouselBento class="forum-header" :list="pinned.data.value || []" />
    </template>

    <template #content-before>
      <ForumTopicSearchInfo
        :loading="topics.isLoading.value"
        :total="topics.total.value"
      />
    </template>

    <template #aside>
      <ForumAside recent-updates tag-filter />
    </template>
  </ForumListPage>
</template>
