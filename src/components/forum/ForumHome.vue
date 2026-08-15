<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed, onMounted, onUnmounted } from 'vue'
import { useBfcacheOptimization } from '~/composables/useBfcacheOptimization'
import { useForumHomeStore } from '~/stores/forum/useForumHomeStore'

import BaseForumPage from './base/BaseForumPage.vue'
import ForumCarouselBento from './ForumCarouselBento.vue'
import ForumTopicSearchInfo from './ForumTopicSearchInfo.vue'

// 组件元数据配置
defineOptions({
  meta: {
    locales: {
      root: {
        title: '社区反馈',
      },
      ja: {
        title: 'フィードバック',
      },
      en: {
        title: 'Feedback',
      },
    },
    routeOptions: {
      type: ['feat', 'closed', 'bug'],
    },
    data: {
      frontmatter: {
        layout: 'Forum',
      },
    },
    i18n: true,
  },
})

const forumHomeStore = useForumHomeStore()

const {
  loadForumData,
  resetState,
  setupEventListeners,
  cleanup,
} = forumHomeStore

// Setup bfcache optimization
const bfcacheOptimization = useBfcacheOptimization()

// 辅助函数：安全地过滤有效的 Topic
function filterValidTopics(topics: (ForumAPI.Topic | null | undefined)[]): ForumAPI.Topic[] {
  return topics.filter((topic): topic is ForumAPI.Topic => {
    return Boolean(topic?.id)
  })
}

const renderData = computed<ForumAPI.Topic[]>(() => {
  // store.data 就是 displayTopics，已包含搜索、合并、过滤、排序逻辑
  return filterValidTopics(forumHomeStore.data || [])
})

onMounted(async () => {
  // Check if we should skip initialization (restored from bfcache)
  if (bfcacheOptimization.shouldSkipInitialization()) {
    return
  }

  setupEventListeners()
  await loadForumData()

  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.has('q')) {
    const query = searchParams.get('q')
    if (query) {
      await forumHomeStore.searchTopics(query)
    }
  }
})

onUnmounted(() => {
  if (bfcacheOptimization.shouldPerformCleanup()) {
    cleanup()
    resetState()
  }
  else {
    cleanup()
    resetState({ preserveForBfcache: true })
  }
})
</script>

<template>
  <BaseForumPage :store="forumHomeStore" :render-data="renderData">
    <template #header>
      <ForumCarouselBento class="forum-header" :list="forumHomeStore.pinnedTopicsData || []" />
    </template>

    <template #content-before>
      <ForumTopicSearchInfo />
    </template>
  </BaseForumPage>
</template>
