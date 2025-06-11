<script setup lang="ts">
import type { FORUM } from '../types'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useData } from 'vitepress'
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { useForumData } from '~/stores/useForumData'
import ForumAside from '../ForumAside.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumLoadState from '../ForumLoadState.vue'
import ForumTopicMenubar from '../ForumTopicMenubar.vue'
import ForumTopicsList from '../ForumTopicsList.vue'
import ForumTopicTagsEditorDialog from '../ForumTopicTagsEditorDialog.vue'
import { FORUM_TOPIC_CAN_LOAD_MORE, FORUM_TOPIC_FILTER_KEY, FORUM_TOPIC_LOADING_KEY, FORUM_TOPIC_SORT_KEY, FORUM_TOPIC_VIEW_MODE_KEY, FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from '../shared'
import { updateLastPathSegment } from '../utils'
import ForumUserProfileHeader from './ForumUserProfileHeader.vue'
import ForumUserProfileHeaderSkeleton from './ForumUserProfileHeaderSkeleton.vue'

const forumData = useForumData()
const userInfo = useUserInfoStore()
const viewMode = useLocalStorage<FORUM.TopicViewMode>(FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY, 'Card')
const activeTab = ref<'feedback' | ''>('feedback')

const { params } = useData()
const { loadMore, loadForumData, resetState } = forumData
const { sort, filter, loading, isSearching, canLoadMore, userSubmittedTopic, topics, creator } = storeToRefs(forumData)

const username = String(params.value?.id) || userInfo.info?.login

creator.value = username!

const renderData = computed(() => {
  return [
    ...(isSearching.value ? [] : userSubmittedTopic.value),
    ...topics.value,
  ]
})

onMounted(() => {
  if (!params.value?.id && userInfo.info?.login) {
    updateLastPathSegment(userInfo.info.login, true)
  }
})

onMounted(loadForumData)
onUnmounted(resetState)

provide(FORUM_TOPIC_VIEW_MODE_KEY, viewMode)
provide(FORUM_TOPIC_SORT_KEY, sort)
provide(FORUM_TOPIC_FILTER_KEY, filter)
provide(FORUM_TOPIC_LOADING_KEY, loading)
provide(FORUM_TOPIC_CAN_LOAD_MORE, canLoadMore)
</script>

<template>
  <ClientOnly>
    <ForumLayout>
      <template #header>
        <Suspense>
          <ForumUserProfileHeader v-model:active-tab="activeTab" :username="username!" :topic-count="renderData.length" />

          <template #fallback>
            <ForumUserProfileHeaderSkeleton />
          </template>
        </Suspense>
      </template>

      <template #content>
        <div v-show="activeTab === 'feedback'">
          <ForumTopicMenubar />
          <div class="mt-2" />
          <ForumTopicsList
            :view-mode="viewMode" :data="renderData" :loading="forumData.loading" :load-more="loadMore"
          />

          <ForumLoadState :loading="forumData.loading" :text="forumData.loadStateMessage" />
        </div>
      </template>

      <template #aside>
        <ForumAside />
      </template>
    </ForumLayout>
    <Teleport to="body">
      <ForumTopicTagsEditorDialog />
    </Teleport>
  </ClientOnly>
</template>
