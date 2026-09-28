<script setup lang="ts">
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicsQuery, usePinnedTopicsQuery } from '~/forum/composables/useForumQueries'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import { resolveForumListScope } from '~/forum/services/forumListSkeleton'
import { parseForumSearchQuery } from '~/forum/services/forumSearchQuery'
import ForumAside from '../aside/ForumAside.vue'
import ForumListPage from '../layout/ForumListPage.vue'
import ForumTopicSearchInfo from '../search/ForumTopicSearchInfo.vue'
import ForumCarouselBento from './ForumCarouselBento.vue'

const { route, list, navigateFilter, navigateType, navigateSort, submitSearch } = useForumRoute()
const search = computed(() => parseForumSearchQuery(list.value?.q ?? ''))
const topics = useForumTopicsQuery(computed(() => ({
  filter: list.value?.filter ?? 'all',
  topicType: list.value?.topicType ?? 'all',
  sort: list.value?.sort ?? 'created',
  q: search.value.text,
  tags: search.value.tags,
  statuses: search.value.states,
  creator: search.value.author,
})), true, computed(() => resolveForumListScope(route.value)))
const pinned = usePinnedTopicsQuery()
const { message } = useLocalized()

const loadStateMessage = computed(() => {
  if (topics.error.value)
    return message.value.forum.loadError
  return topics.canLoadMore.value ? message.value.forum.loadMore : message.value.forum.noMore
})
</script>

<template>
  <ForumListPage
    :render-data="topics.rows.value"
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
