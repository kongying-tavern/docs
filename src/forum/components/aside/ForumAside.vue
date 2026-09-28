<script setup lang="ts">
import type ForumAPI from '~/forum/api/forum'
import { useUserAuthStore } from '@/stores/useUserAuth'
import ForumAsideContact from './ForumAsideContact.vue'
import ForumAsideHomeResources from './ForumAsideHomeResources.vue'
import ForumAsideLoginPrompt from './ForumAsideLoginPrompt.vue'
import ForumAsideMeta from './ForumAsideMeta.vue'
import ForumAsideRelatedTopics from './ForumAsideRelatedTopics.vue'
import ForumAsideTopicTimeline from './ForumAsideTopicTimeline.vue'
import ForumAsideUserProfile from './ForumAsideUserProfile.vue'

withDefaults(defineProps<{
  topic?: ForumAPI.Topic | null
  recentUpdates?: boolean
  tagFilter?: boolean
  username?: string | null
}>(), {
  recentUpdates: false,
  tagFilter: false,
  username: null,
})

const auth = useUserAuthStore()
</script>

<template>
  <div class="forum-context-aside">
    <ForumAsideLoginPrompt v-if="!auth.isTokenValid" />
    <ForumAsideTopicTimeline v-if="topic && topic.type !== 'ANN'" :topic="topic" />
    <ForumAsideRelatedTopics v-if="topic" :topic="topic" />
    <ForumAsideContact v-if="topic" />
    <ForumAsideHomeResources
      v-if="!topic && !username"
      :recent-updates="recentUpdates"
      :tag-filter="tagFilter"
    />
    <ForumAsideUserProfile v-if="username" :username="username" />
    <ForumAsideMeta />
  </div>
</template>

<style scoped>
.forum-context-aside {
  display: grid;
  gap: 28px;
  padding: 4px 0 16px;
  color: var(--vp-c-text-1);
}

.forum-context-aside :deep(h2) {
  margin: 0;
  font-family: var(--vp-font-family-subtitle);
  font-size: calc(18px * var(--site-ui-scale));
  line-height: calc(26px * var(--site-ui-scale));
}

.forum-context-aside :deep(.aside-section-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 0 4px 10px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.forum-context-aside :deep(.aside-section-card) {
  padding: 18px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.forum-context-aside :deep(:is(a, button):focus-visible) {
  outline: 2px solid var(--vp-c-brand-2);
  outline-offset: 3px;
}
</style>
