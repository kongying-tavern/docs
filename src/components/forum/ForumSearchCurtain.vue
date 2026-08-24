<script setup lang="ts">
import { useScrollLock, useWindowScroll } from '@vueuse/core'
import { useData } from 'vitepress'
import { computed, onUnmounted, ref, watch, watchPostEffect } from 'vue'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumSearchbox from './ForumSearchbox.vue'
import { flattenWithTags } from './utils'

const emits = defineEmits(['close'])
const { list, submitSearch } = useForumRoute()
const isLocked = useScrollLock(import.meta.env.SSR ? null : document.body, true)
const { y } = useWindowScroll()
const { theme } = useData()
const isTop = computed(() => y.value === 0)
const searchQuery = ref(list.value?.q ?? '')
const quickLinkList = flattenWithTags(theme.value.sidebar[Object.keys(theme.value.sidebar)[0]].slice(1))

onUnmounted(() => {
  isLocked.value = false
})

const classes = ref<Record<string, boolean>>({})

watch(() => list.value?.q ?? '', q => searchQuery.value = q)

async function handleSearch(query: string) {
  if (query === (list.value?.q ?? '') || await submitSearch(query))
    emits('close')
}

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
  <div class="w-full bottom-0 left-0 fixed z-2 overflow-x-hidden" :class="classes">
    <div
      class="bg-transparent"
      @click="emits('close')"
    />
    <div class="wrapper bg-[var(--vp-c-bg)] h-fit min-h-100% transition-height relative md:min-h-30%">
      <div class="curtain-content pt-8 container h-auto w-full">
        <ForumSearchbox v-model:query="searchQuery" @submit="handleSearch" />
        <div
          v-motion-slide-visible-top
          class="pb-64px pt-40px flex flex-col h-auto w-full"
        >
          <h2 class="mb-5">
            Quick Links
          </h2>
          <ul class="gap-x-6 gap-y-4 grid grid-row-auto grid-flow-col grid-flow-row grid-cols-1 md:grid-cols-4 md:grid-rows-5">
            <li v-for="item in quickLinkList" :key="item.text">
              <VPLink
                :href="item.link"
                class="font-size-3.5 color-[--vp-c-text-1] vp-link break-all text-ellipsis overflow-hidden line-clamp-2"
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
