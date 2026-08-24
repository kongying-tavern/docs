<script setup lang="ts">
import { computed } from 'vue'
import { useForumTopicsQuery, usePinnedTopicsQuery } from '~/composables/forum/useForumQueries'
import { useForumRoute } from '~/composables/useForumRoute'
import BaseForumPage from './base/BaseForumPage.vue'
import ForumCarouselBento from './ForumCarouselBento.vue'
import ForumTopicSearchInfo from './ForumTopicSearchInfo.vue'

const { list, navigateFilter, navigateSort } = useForumRoute()
const topics = useForumTopicsQuery(computed(() => ({
  filter: list.value?.filter ?? 'all',
  sort: list.value?.sort ?? 'created',
  q: list.value?.q ?? '',
  creator: null,
})))
const pinned = usePinnedTopicsQuery()

const loadStateMessage = computed(() => {
  if (topics.error.value)
    return 'Failed to load topics. Retry'
  return topics.canLoadMore.value ? 'Load more' : 'No more topics'
})
</script>

<template>
  <BaseForumPage
    :render-data="topics.rows.value"
    :loading="topics.isLoading.value"
    :loading-more="topics.loadingMore.value"
    :can-load-more="topics.canLoadMore.value"
    :load-more="topics.loadMore"
    :refresh-data="topics.refetch"
    :load-state-message="loadStateMessage"
    :filter="list?.filter ?? 'all'"
    :sort="list?.sort ?? 'created'"
    :on-filter-change="navigateFilter"
    :on-sort-change="navigateSort"
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
  </BaseForumPage>
</template>
