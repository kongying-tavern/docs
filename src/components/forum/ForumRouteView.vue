<script setup lang="ts">
import { computed } from 'vue'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumHome from './home/ForumHome.vue'
import ForumTopicPage from './topic/ForumTopicPage.vue'
import ForumUserPage from './user/ForumUserPage.vue'

const { route } = useForumRoute()

const view = computed(() => {
  if (route.value?.name === 'topic')
    return ForumTopicPage
  if (route.value?.name === 'user')
    return ForumUserPage
  return route.value?.name === 'home' ? ForumHome : null
})

const viewKey = computed(() => {
  if (route.value?.name === 'topic')
    return `topic:${route.value.topicId}`
  if (route.value?.name === 'user')
    return `user:${route.value.username}`
  return route.value?.name ?? 'forum'
})
</script>

<template>
  <component :is="view" v-if="view" :key="viewKey" />
</template>
