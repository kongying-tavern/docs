<script setup lang="ts">
import type { FORUM } from './types'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onUnmounted, provide } from 'vue'
import { useForumData } from '~/stores/useForumData'
import BlogPosts from '../../_data/posts.json'
import ForumAside from './ForumAside.vue'
import ForumCarouselBento from './ForumCarouselBento.vue'
import ForumLayout from './ForumLayout.vue'
import ForumLoadState from './ForumLoadState.vue'
import ForumTopicListSkeletons from './ForumTopicListSkeletons.vue'
import ForumTopicMenubar from './ForumTopicMenubar.vue'
import ForumTopicSearchInfo from './ForumTopicSearchInfo.vue'
import ForumTopicsList from './ForumTopicsList.vue'
import ForumTopicTagsEditorDialog from './ForumTopicTagsEditorDialog.vue'
import { FORUM_TOPIC_FILTER_KEY, FORUM_TOPIC_LOADING_KEY, FORUM_TOPIC_SORT_KEY, FORUM_TOPIC_VIEW_MODE_KEY, FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from './shared'

const forumData = useForumData()
const viewMode = useLocalStorage<FORUM.TopicViewMode>(FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY, 'Card')

const { loadMore, loadForumData, resetState } = forumData
const { creator, sort, filter, pinnedTopicData, loading, isSearching, canLoadMore, userSubmittedTopic, topics } = storeToRefs(forumData)

const renderData = computed(() => {
  const shouldShowBlogPosts = !filter.value || filter.value === 'ALL'
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
        {{ creator }}
        <ForumCarouselBento class="forum-header" :list="pinnedTopicData || []" />
      </template>

      <template #content>
        <ForumTopicSearchInfo />
        <ForumTopicMenubar />
        <div class="mt-2 vp-divider" />
        <Suspense>
          <ForumTopicsList
            :view-mode="viewMode"
            :data="renderData"
            :data-loader="loadForumData"
            :load-more="loadMore"
            :can-load-more="canLoadMore"
          />

          <template #fallback>
            <ForumTopicListSkeletons :view-mode="viewMode" />
          </template>
        </Suspense>

        <ForumLoadState :loading="forumData.loading" :text="forumData.loadStateMessage" />
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
