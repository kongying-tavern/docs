<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicsQuery } from '~/composables/forum/useForumQueries'
import { useForumRoute } from '~/composables/useForumRoute'
import BaseForumPage from '../base/BaseForumPage.vue'
import ForumTopicsList from '../ForumTopicsList.vue'
import ForumTopicTagsEditorDialog from '../ForumTopicTagsEditorDialog.vue'
import ForumLoadState from '../ui/ForumLoadState.vue'
import ForumUserProfileHeader from './ForumUserProfileHeader.vue'
import ForumUserProfileHeaderSkeleton from './ForumUserProfileHeaderSkeleton.vue'

const activeTab = ref<'feedback' | ''>('feedback')
const { route, list, navigateFilter, navigateSort } = useForumRoute()
const username = computed(() => route.value?.name === 'user' ? route.value.username : '')
const topics = useForumTopicsQuery(computed(() => ({
  filter: list.value?.filter ?? 'all',
  sort: list.value?.sort ?? 'created',
  q: list.value?.q ?? '',
  creator: username.value,
})))
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
    :on-filter-change="navigateFilter"
    :on-sort-change="navigateSort"
  >
    <template #header>
      <Suspense>
        <ForumUserProfileHeader
          v-model:active-tab="activeTab"
          :username="username"
          :topic-count="topics.total.value"
        />

        <template #fallback>
          <ForumUserProfileHeaderSkeleton />
        </template>
      </Suspense>
    </template>

    <template #content-main>
      <div v-show="activeTab === 'feedback'">
        <ForumTopicsList
          :data="topics.rows.value"
          :loading="topics.isLoading.value || topics.loadingMore.value"
          :error="topics.error.value"
          :can-load-more="topics.canLoadMore.value"
          :load-more="topics.loadMore"
          :refresh-data="topics.refetch"
        />

        <ForumLoadState
          v-if="topics.rows.value.length > 0"
          :loading="topics.isLoading.value || topics.loadingMore.value"
          :error="Boolean(topics.error.value)"
          :can-load-more="topics.canLoadMore.value"
          :load-more="topics.loadMore"
          :retry="topics.refetch"
          :text="loadStateMessage"
        />
      </div>
    </template>

    <template #teleport>
      <Teleport to="body">
        <ForumTopicTagsEditorDialog />
      </Teleport>
    </template>
  </BaseForumPage>
</template>
