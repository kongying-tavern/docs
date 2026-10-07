<script setup lang="ts">
import { inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { AsyncForumRouteView } from './AsyncForumRouteView'
import ForumLoading from './ForumLoading.vue'
import { forumStartupKey } from './forumStartup'

const initialDocument = inject(forumStartupKey)
const fullscreen = initialDocument?.value ?? false
const loading = ref(fullscreen)
const preparing = ref(true)
const mounted = ref(false)
let shownAt = 0
let releaseTimer: ReturnType<typeof setTimeout> | undefined
let showTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  shownAt = performance.now()
  mounted.value = true
  if (!fullscreen) {
    showTimer = setTimeout(() => {
      shownAt = performance.now()
      loading.value = true
    }, 150)
  }
})

async function onReady() {
  clearTimeout(showTimer)
  if (!loading.value) {
    preparing.value = false
    return
  }
  if (releaseTimer !== undefined)
    return
  await nextTick()
  const remaining = Math.max(0, 300 - (performance.now() - shownAt))
  releaseTimer = setTimeout(() => {
    loading.value = false
  }, remaining)
}

onBeforeUnmount(() => {
  clearTimeout(releaseTimer)
  clearTimeout(showTimer)
})
</script>

<template>
  <div class="forum-entry">
    <div :class="{ 'forum-entry-preparing': preparing, 'forum-entry-hidden': loading }" :inert="loading">
      <AsyncForumRouteView v-if="mounted" class="slide-enter" @ready="onReady" />
    </div>
    <Transition name="forum-startup" @after-leave="preparing = false">
      <ForumLoading v-if="loading" :fullscreen="fullscreen" />
    </Transition>
  </div>
</template>

<style scoped>
.forum-entry {
  position: relative;
  flex: 1;
}

.forum-entry-preparing {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.forum-entry-hidden {
  visibility: hidden;
}

.forum-startup-leave-active {
  transition: opacity 160ms ease-out;
}

.forum-startup-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .forum-startup-leave-active {
    transition: none;
  }
}
</style>
