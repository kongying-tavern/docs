<script setup lang="ts">
import { useScrollLock, useWindowScroll } from '@vueuse/core'
import { useData } from 'vitepress'
import { computed, onUnmounted, ref, watchPostEffect } from 'vue'
import { useForumData } from '~/stores/useForumData'
import ForumSearchbox from './ForumSearchbox.vue'
import ForumSearchSuggestions from './ForumSearchSuggestions.vue'
import { flattenWithTags } from './utils'

const emits = defineEmits(['close'])
const forumData = useForumData()
const isLocked = useScrollLock(import.meta.env.SSR ? null : document.body, true)
const { y } = useWindowScroll()
const { theme } = useData()
const isTop = computed(() => y.value === 0)
const searchQuery = ref('')
const quickLinkList = flattenWithTags(theme.value.sidebar[Object.keys(theme.value.sidebar)[0]].slice(1))

onUnmounted(() => {
  isLocked.value = false
})

const classes = ref<Record<string, boolean>>({})

watchPostEffect(() => {
  classes.value = {
    'top-[calc(var(--vp-nav-height)+52px)]': isTop.value,
    'h-[calc(100vh-var(--vp-nav-height)-52px)]': isTop.value,
    'top-52px': !isTop.value,
    'h-[calc(100vh-52px)]': !isTop.value,
  }
})
</script>

<template>
  <div class="fixed bottom-0 left-0 z-2 w-full overflow-x-hidden" :class="classes">
    <div
      class="bg-transparent"
      @click="emits('close')"
    />
    <div class="wrapper relative h-fit min-h-100% bg-[var(--vp-c-bg)] transition-height md:min-h-30%">
      <div class="curtain-content h-auto w-full pt-8 container">
        <ForumSearchbox v-model:query="searchQuery" @search="emits('close')" />
        <ForumSearchSuggestions v-if="searchQuery.length !== 0" v-motion-slide-visible-top class="pb-64px pt-40px" :search-query="searchQuery" :topic-data="forumData.topics" @select="emits('close')" />

        <div
          v-else
          v-motion-slide-visible-top
          class="h-auto w-full flex flex-col pb-64px pt-40px"
        >
          <h2 class="mb-5">
            Quick Links
          </h2>
          <ul class="grid grid-row-auto grid-flow-col grid-flow-row grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-4 md:grid-rows-5">
            <li v-for="item in quickLinkList" :key="item.text">
              <VPLink
                :href="item.link"
                class="line-clamp-2 overflow-hidden text-ellipsis break-all font-size-3.5 color-[--vp-c-text-1] vp-link"
              >
                {{ item.text?.replace(/【|】|\[|\]/g, ' ').trim() }}
              </VPLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  padding: 0 8px 0 24px;
}

@media (min-width: 768px) {
  .wrapper {
    padding: 0 32px;
  }
}

.container {
  margin: 0 auto;
  max-width: calc(var(--vp-layout-max-width) - 64px);
}
</style>
