<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicsQuery } from '~/composables/forum/useForumQueries'
import { useForumRoute } from '~/composables/useForumRoute'
import BaseForumPage from '../base/BaseForumPage.vue'
import ForumTopicList from '../list/ForumTopicList.vue'
import ForumTopicSearchInfo from '../search/ForumTopicSearchInfo.vue'
import ForumTopicTagsEditorDialog from '../topic/ForumTopicTagsEditorDialog.vue'
import ForumLoadState from '../ui/ForumLoadState.vue'
import ForumUserProfileHeader from './ForumUserProfileHeader.vue'
import ForumUserProfileHeaderSkeleton from './ForumUserProfileHeaderSkeleton.vue'

const activeTab = ref<'feedback' | ''>('feedback')
const { route, list, navigateFilter, submitSearch } = useForumRoute()
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

// 进入用户页时「全部反馈」为空则自动切到「已结反馈」（仅一次，切换用户后重置）
const autoSwitchedToClosed = ref(false)
watch(() => username.value, () => {
  autoSwitchedToClosed.value = false
})
watchEffect(() => {
  if (autoSwitchedToClosed.value)
    return
  if (topics.isLoading.value || topics.error.value)
    return
  if ((list.value?.filter ?? 'all') !== 'all')
    return
  if (list.value?.q)
    return
  if (topics.total.value > 0)
    return
  autoSwitchedToClosed.value = true
  navigateFilter('closed')
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

    <template #content-before>
      <ForumTopicSearchInfo
        :loading="topics.isLoading.value"
        :total="topics.total.value"
      />
    </template>

    <template #content-main>
      <div v-show="activeTab === 'feedback'">
        <ForumTopicList
          :data="topics.rows.value"
          :loading="topics.isLoading.value || topics.loadingMore.value"
          :error="topics.error.value"
          :can-load-more="topics.canLoadMore.value"
          :sort="list?.sort ?? 'created'"
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
