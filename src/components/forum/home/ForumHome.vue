<script setup lang="ts">
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicsQuery, usePinnedTopicsQuery } from '~/composables/forum/useForumQueries'
import { useForumRoute } from '~/composables/useForumRoute'
import BaseForumPage from '../base/BaseForumPage.vue'
import ForumTopicSearchInfo from '../search/ForumTopicSearchInfo.vue'
import ForumCarouselBento from './ForumCarouselBento.vue'

const { list, navigateFilter, submitSearch } = useForumRoute()
const topics = useForumTopicsQuery(computed(() => ({
  filter: list.value?.filter ?? 'all',
  sort: list.value?.sort ?? 'created',
  q: list.value?.q ?? '',
  creator: null,
})))
const pinned = usePinnedTopicsQuery()
const { message } = useLocalized()

const loadStateMessage = computed(() => {
  if (topics.error.value)
    return message.value.forum.loadError
  return topics.canLoadMore.value ? message.value.forum.loadMore : message.value.forum.noMore
})
</script>

<template>
  <BaseForumPage
    :render-data="topics.rows.value"
    :loading="topics.isLoading.value"
    :loading-more="topics.loadingMore.value"
    :error="topics.error.value"
    :can-load-more="topics.canLoadMore.value"
    :load-more="topics.loadMore"
    :refresh-data="topics.refetch"
    :load-state-message="loadStateMessage"
    :filter="list?.filter ?? 'all'"
    :sort="list?.sort ?? 'created'"
    :query="list?.q ?? ''"
    :on-filter-change="navigateFilter"
    :on-search="submitSearch"
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
