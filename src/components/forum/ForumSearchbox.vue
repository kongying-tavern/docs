<template>
  <form class="w-full p-r-4">
    <label
      for="default-search"
      class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
      >Search</label
    >
    <div class="relative">
      <div
        class="absolute inset-y-0 start-0 ml-2 flex items-center ps-3 pointer-events-none"
      >
        <span class="vp-icon DocSearch-Search-Icon" aria-hidden="true"></span>
      </div>
      <input
        v-model.trim="searchParm"
        @keydown.enter.prevent="search(searchParm)"
        type="search"
        id="default-search"
        class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-100 bg-[var(--vp-c-bg-alt)] c-[var(--vp-c-text-1)]"
        :placeholder="theme.forum.header.search.placeholders"
        maxlength="50"
        required
      />
      <button
        @click="search(searchParm)"
        type="button"
        class="text-white absolute end-2.5 bottom-2.5 focus:border-color-[--vp-c-border] focus:outline-none font-medium rounded-25 text-sm px-4 py-2 vp-button"
      >
        Search
      </button>
    </div>
  </form>
  <div
    class="h-5 font-size-3.5 flex absolute top-28"
    v-if="isSearching && !loading"
  >
    <p class="color-[var(--vp-c-text-3)] mr-2">
      {{ theme.forum.header.search.allRelatedContentCount }}
    </p>
    <span>{{ topics.length }}</span>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import { useData } from 'vitepress'

const { theme } = useData()
const searchParm = ref<string>('')
const isSearching = ref<boolean>(false)

const search = (q: string) => {
  searchTopics(encodeURIComponent(q))
  isSearching.value = true
  if (!q) isSearching.value = false
}

onMounted(() => {
  const { q } = useUrlSearchParams('history')

  if (typeof q !== 'string') return

  searchParm.value = q

  search(searchParm.value)
})

const searchTopics = inject<(q: string) => Promise<void>>('searchTopics')!
const topics = inject<GITEE.IssueList>('topics')!
const loading = inject<boolean>('loading')!
</script>
