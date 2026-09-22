<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumHome from './home/ForumHome.vue'
import ForumUserPage from './user/ForumUserPage.vue'

const ForumTopicPage = defineAsyncComponent(() => import('./topic/ForumTopicPage.vue'))
const ForumSearchPage = defineAsyncComponent(() => import('./search/ForumSearchPage.vue'))

const { route } = useForumRoute()

const view = computed(() => {
  if (route.value?.name === 'topic')
    return ForumTopicPage
  if (route.value?.name === 'user')
    return ForumUserPage
  if (route.value?.name === 'search')
    return ForumSearchPage
  return route.value?.name === 'home' ? ForumHome : null
})

const viewKey = computed(() => {
  if (route.value?.name === 'topic')
    return `topic:${route.value.topicId}`
  if (route.value?.name === 'user')
    return `user:${route.value.username}`
  if (route.value?.name === 'search')
    return `search:${route.value.username ?? 'home'}`
  return route.value?.name ?? 'forum'
})
</script>

<template>
  <div
    v-if="view"
    class="forum-route-view"
    :data-forum-route-topic="route?.name === 'topic' ? route.topicId : undefined"
  >
    <component :is="view" :key="viewKey" />
  </div>
</template>
