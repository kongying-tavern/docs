<script setup lang="ts">
import type { FORUM } from '../types'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useLocalStorage, useUrlSearchParams } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { useForumData } from '~/stores/useForumData'
import ForumAside from '../ForumAside.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumLoadState from '../ForumLoadState.vue'
import ForumTopicListSkeletons from '../ForumTopicListSkeletons.vue'
import ForumTopicMenubar from '../ForumTopicMenubar.vue'
import ForumTopicsList from '../ForumTopicsList.vue'
import ForumTopicTagsEditorDialog from '../ForumTopicTagsEditorDialog.vue'
import { FORUM_TOPIC_FILTER_KEY, FORUM_TOPIC_LOADING_KEY, FORUM_TOPIC_SORT_KEY, FORUM_TOPIC_VIEW_MODE_KEY, FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from '../shared'
import { getTargeUsername } from '../utils'
import ForumUserProfileHeader from './ForumUserProfileHeader.vue'
import ForumUserProfileHeaderSkeleton from './ForumUserProfileHeaderSkeleton.vue'

const forumData = useForumData()
const userInfo = useUserInfoStore()
const params = useUrlSearchParams()
const viewMode = useLocalStorage<FORUM.TopicViewMode>(FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY, 'Card')
const activeTab = ref<'feedback' | ''>('feedback')

const { loadMore, loadForumData, resetState } = forumData
const { sort, filter, loading, isSearching, canLoadMore, userSubmittedTopic, topics, creator } = storeToRefs(forumData)

const username = getTargeUsername() || userInfo.info?.login

creator.value = username!

if (!username)
  location.href = './404.html'

const renderData = computed(() => {
  return [
    ...(isSearching.value ? [] : userSubmittedTopic.value),
    ...topics.value,
  ]
})

onMounted(() => {
  if (!params.name && userInfo.info?.login) {
    params.name = userInfo.info.login
  }
})

onUnmounted(resetState)

provide(FORUM_TOPIC_VIEW_MODE_KEY, viewMode)
provide(FORUM_TOPIC_SORT_KEY, sort)
provide(FORUM_TOPIC_FILTER_KEY, filter)
provide(FORUM_TOPIC_LOADING_KEY, loading)
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
          <Suspense>
            <ForumTopicsList
              :view-mode="viewMode" :data="renderData" :data-loader="loadForumData" :load-more="loadMore"
              :can-load-more="canLoadMore"
            />

            <template #fallback>
              <ForumTopicListSkeletons :view-mode="viewMode" />
            </template>
          </Suspense>

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
