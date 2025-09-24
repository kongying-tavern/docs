<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed, onMounted, onUnmounted } from 'vue'
import { useForumHomeStore } from '~/stores/forum/useForumHomeStore'
import BlogPosts from '../../_data/posts.json'
import BaseForumPage from './base/BaseForumPage.vue'
import ForumCarouselBento from './ForumCarouselBento.vue'
import ForumTopicSearchInfo from './ForumTopicSearchInfo.vue'

const forumHomeStore = useForumHomeStore()

const {
  loadForumData,
  resetState,
  setupEventListeners,
  cleanup,
} = forumHomeStore

const renderData = computed(() => {
  const shouldShowBlogPosts = !forumHomeStore.filter.value || forumHomeStore.filter.value === 'all'
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

  const recentBlogPosts = shouldShowBlogPosts && !forumHomeStore.isSearching.value
    ? BlogPosts.filter(post => new Date(post.updatedAt).getTime() > oneDayAgo)
        .map(post => ({
          ...post,
          state: 'open' as const,
          type: 'POST' as const,
        }))
    : []

  const userTopics = forumHomeStore.isSearching.value
    ? []
    : (forumHomeStore.userSubmittedTopics.value || [])
        .filter((topic: ForumAPI.Topic) => topic && topic.id)

  const allTopics = (forumHomeStore.data || [])
    .filter((topic: ForumAPI.Topic) => topic && topic.id)

  if (forumHomeStore.isSearching.value) {
    return allTopics
  }

  return [
    ...userTopics,
    ...recentBlogPosts,
    ...allTopics,
  ]
})

onMounted(async () => {
  setupEventListeners()
  await loadForumData()

  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.has('q')) {
    const query = searchParams.get('q')
    if (query) {
      console.log(`🔍 [ForumHome] Auto-triggering search from URL: "${query}"`)
      await forumHomeStore.searchTopics(query)
    }
  }
})

onUnmounted(() => {
  cleanup()
  resetState()
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
