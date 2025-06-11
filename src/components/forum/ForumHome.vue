<script setup lang="ts">
import type { FORUM } from './types'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, provide } from 'vue'
import { useForumData } from '~/stores/useForumData'
import BlogPosts from '../../_data/posts.json'
import ForumAside from './ForumAside.vue'
import ForumCarouselBento from './ForumCarouselBento.vue'
import ForumLayout from './ForumLayout.vue'
import ForumLoadState from './ForumLoadState.vue'
import ForumTopicMenubar from './ForumTopicMenubar.vue'
import ForumTopicSearchInfo from './ForumTopicSearchInfo.vue'
import ForumTopicsList from './ForumTopicsList.vue'
import { FORUM_TOPIC_CAN_LOAD_MORE, FORUM_TOPIC_FILTER_KEY, FORUM_TOPIC_LOADING_KEY, FORUM_TOPIC_SORT_KEY, FORUM_TOPIC_VIEW_MODE_KEY, FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from './shared'

const forumData = useForumData()

const viewMode = useLocalStorage<FORUM.TopicViewMode>(FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY, 'Card')

const { loadMore, loadForumData, resetState } = forumData
const { sort, filter, pinnedTopicData, loading, isSearching, canLoadMore, userSubmittedTopic, topics } = storeToRefs(forumData)

const renderData = computed(() => {
  // if (import.meta.env.SSR)
  //   return []

  const shouldShowBlogPosts = !filter.value || filter.value === 'all'
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

  const recentBlogPosts = shouldShowBlogPosts
    ? BlogPosts.filter(post => new Date(post.updatedAt).getTime() > oneDayAgo)
        .map(post => ({
          ...post,
          state: 'open' as const,
          type: 'POST' as const,
        }))
    : []

  const userTopics = isSearching.value
    ? []
    : (userSubmittedTopic.value || [])
        .filter(topic => topic && topic.id)

  const allTopics = (topics.value || [])
    .filter(topic => topic && topic.id)

  return [
    ...userTopics,
    ...recentBlogPosts,
    ...allTopics,
  ]
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
        <ForumCarouselBento class="forum-header" :list="pinnedTopicData || []" />
      </template>

      <template #content>
        <ForumTopicSearchInfo />
        <ForumTopicMenubar />
        <div class="mt-2 vp-divider" />
        <ForumTopicsList
          :view-mode="viewMode"
          :data="renderData"
          :loading="loading"
          :load-more="loadMore"
        />

        <ForumLoadState :loading="forumData.loading" :text="forumData.loadStateMessage" />
      </template>

      <template #aside>
        <ForumAside />
      </template>
    </ForumLayout>
  </ClientOnly>
</template>
