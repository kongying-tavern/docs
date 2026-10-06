<script setup lang="ts">
import { computed } from 'vue'
import { data as allBlogPosts } from '~/_data/forumBlogPosts.data'
import { useRecentBlogUpdates } from '~/forum/composables/data/useRecentBlogUpdates'
import ForumAsideRecentUpdates from './ForumAsideRecentUpdates.vue'
import ForumAsideRecommendedDocs from './ForumAsideRecommendedDocs.vue'
import ForumAsideTagFilter from './ForumAsideTagFilter.vue'
import ForumAsideTeamBlog from './ForumAsideTeamBlog.vue'

const props = withDefaults(defineProps<{
  /** 首页在卡片顶部加一栏「最近更新」，并与团队博客互斥 */
  recentUpdates?: boolean
  /** 首页在「最近更新」与「文档推荐」之间插一栏「标签筛选」 */
  tagFilter?: boolean
}>(), {
  recentUpdates: false,
  tagFilter: false,
})

const items = useRecentBlogUpdates(allBlogPosts)
const showRecentUpdates = computed(() => props.recentUpdates && items.value.length > 0)
</script>

<template>
  <div class="px-4 pb-4 rounded-[12px] bg-[--vp-c-bg-soft] flex flex-col">
    <ForumAsideRecentUpdates v-if="showRecentUpdates" :items="items" />
    <ForumAsideTagFilter v-if="tagFilter" />
    <ForumAsideRecommendedDocs />
    <ForumAsideTeamBlog v-if="!showRecentUpdates" />
  </div>
</template>
