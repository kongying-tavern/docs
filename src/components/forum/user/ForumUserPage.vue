<script setup lang="ts">
import { computed, ref } from 'vue'
import { useForumTopicsQuery } from '~/composables/forum/useForumQueries'
import { useForumRoute } from '~/composables/useForumRoute'
import BaseForumPage from '../base/BaseForumPage.vue'
import ForumTopicsList from '../ForumTopicsList.vue'
import ForumTopicTagsEditorDialog from '../ForumTopicTagsEditorDialog.vue'
import ForumLoadState from '../ui/ForumLoadState.vue'
import ForumUserProfileHeader from './ForumUserProfileHeader.vue'
import ForumUserProfileHeaderSkeleton from './ForumUserProfileHeaderSkeleton.vue'

const activeTab = ref<'feedback' | ''>('feedback')
const { route, list } = useForumRoute()
const username = computed(() => route.value?.name === 'user' ? route.value.username : '')
const topics = useForumTopicsQuery(computed(() => ({
  filter: list.value?.filter ?? 'all',
  sort: list.value?.sort ?? 'created',
  q: list.value?.q ?? '',
  creator: username.value,
})))
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
          :can-load-more="topics.canLoadMore.value"
          :load-more="topics.loadMore"
          :refresh-data="topics.refetch"
        />

        <ForumLoadState
          :loading="topics.isLoading.value || topics.loadingMore.value"
          :can-load-more="topics.canLoadMore.value"
          :load-more="topics.loadMore"
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
