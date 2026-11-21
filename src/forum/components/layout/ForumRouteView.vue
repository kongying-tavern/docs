<script setup lang="ts">
import { computed } from 'vue'
import AsyncContentLoading from '@/src/components/async/AsyncContentLoading.vue'
import { defineRecoverableAsyncComponent } from '@/src/components/async/defineRecoverableAsyncComponent.ts'
import { useForumRoute } from '@/src/forum/composables/state/useForumRoute.ts'
import ForumHome from '../home/ForumHome.vue'
import ForumTopicLoading from '../topic/ForumTopicLoading.vue'
import ForumUserLoading from '../user/ForumUserLoading.vue'

const emit = defineEmits<{ ready: [] }>()

const ForumTopicPage = defineRecoverableAsyncComponent(() => import('../topic/ForumTopicPage.vue'), ForumTopicLoading)
const ForumSearchPage = defineRecoverableAsyncComponent(() => import('../search/ForumSearchPage.vue'), AsyncContentLoading)
const ForumUserPage = defineRecoverableAsyncComponent(() => import('../user/ForumUserPage.vue'), ForumUserLoading)

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
    <KeepAlive include="ForumHome" :max="1">
      <component :is="view" :key="viewKey" @vue:mounted="emit('ready')" />
    </KeepAlive>
  </div>
</template>
