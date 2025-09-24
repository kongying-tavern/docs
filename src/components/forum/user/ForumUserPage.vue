<script setup lang="ts">
import type { FORUM } from '../types'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useData } from 'vitepress'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useForumUserStore } from '~/stores/forum/useForumUserStore'
import BaseForumPage from '../base/BaseForumPage.vue'
import ForumTopicsList from '../ForumTopicsList.vue'
import ForumTopicTagsEditorDialog from '../ForumTopicTagsEditorDialog.vue'
import { FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from '../shared'
import ForumLoadState from '../ui/ForumLoadState.vue'
import { updateLastPathSegment } from '../utils'
import ForumUserProfileHeader from './ForumUserProfileHeader.vue'
import ForumUserProfileHeaderSkeleton from './ForumUserProfileHeaderSkeleton.vue'

// 组件元数据配置
defineOptions({
  meta: {
    routeOptions: {
      type: ['feat', 'closed', 'bug'],
    },
    i18n: true,
  },
})

const forumUserStore = useForumUserStore()
const userInfo = useUserInfoStore()
const activeTab = ref<'feedback' | ''>('feedback')
const viewMode = useLocalStorage<FORUM.TopicViewMode>(FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY, 'Card')

const { params } = useData()

// Use storeToRefs to access reactive properties (now that UserStore uses toRef)
const {
  isSearching,
  userSubmittedTopics,
  data: topics,
  loading,
  loadStateMessage,
} = storeToRefs(forumUserStore)

// Actions can be destructured normally
const {
  loadUserData,
  resetState,
  setupEventListeners,
  cleanup,
  loadMoreTopics,
} = forumUserStore

const username = String(params.value?.id) || userInfo.info?.login

const renderData = computed(() => {
  // When searching, show only search results
  if (isSearching.value) {
    return topics.value || []
  }

  // When not searching, show user submitted topics and regular topics
  return [
    ...(userSubmittedTopics.value || []),
    ...(topics.value || []),
  ]
})

onMounted(() => {
  if (!params.value?.id && userInfo.info?.login) {
    updateLastPathSegment(userInfo.info.login, true)
  }

  // Setup event listeners and load user data
  setupEventListeners()
  if (username) {
    loadUserData(username)
  }
})

onUnmounted(() => {
  cleanup()
  resetState()
})
</script>

<template>
  <BaseForumPage :store="forumUserStore" :render-data="renderData">
    <template #header>
      <Suspense>
        <ForumUserProfileHeader v-model:active-tab="activeTab" :username="username!" :topic-count="renderData.length" />

        <template #fallback>
          <ForumUserProfileHeaderSkeleton />
        </template>
      </Suspense>
    </template>

    <template #content-main>
      <div v-show="activeTab === 'feedback'">
        <!-- Use the default content from BaseForumPage -->
        <ForumTopicsList
          :view-mode="viewMode"
          :data="renderData"
          :loading="loading"
          :load-more="loadMoreTopics"
        />

        <ForumLoadState :loading="loading" :text="loadStateMessage" />
      </div>
    </template>

    <template #teleport>
      <Teleport to="body">
        <ForumTopicTagsEditorDialog />
      </Teleport>
    </template>
  </BaseForumPage>
</template>
