<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'
import { useFocus } from '@vueuse/core'
import { watch } from 'vue'
import { useSearchInput } from '~/composables/useSearchInput'
import { useForumData } from '~/stores/useForumData'

const { message } = useLocalized()
const { searchInput, searchQuery } = useSearchInput()
const { focused } = useFocus(searchInput)

const forumData = useForumData()

watch(focused, (focused) => {
  if (focused && searchQuery.value.length !== 0)
    return
  forumData.refreshData()
  forumData.isSearching = false
})
</script>

<template>
  <form class="w-full p-r-4">
    <label
      for="default-search"
      class="sr-only mb-2 text-sm text-gray-900 font-medium dark:text-white"
    >{{ message.ui.button.search }}</label>
    <div class="relative">
      <div
        class="pointer-events-none absolute start-0 inset-y-0 mx-2 flex items-center pr-2 ps-3"
      >
        <span class="vp-icon DocSearch-Search-Icon" aria-hidden="true" />
      </div>
      <input
        id="default-search"
        ref="searchInput"
        v-model.trim="searchQuery"
        type="search"
        class="block w-full border border-gray-300 rounded-100 bg-[var(--vp-c-bg-alt)] py-15px pe-[110px] ps-12 text-4 c-[var(--vp-c-text-1)]"
        :placeholder="message.forum.header.search.placeholder"
        maxlength="50"
        required
        @keydown.enter.prevent="forumData.searchTopics(searchQuery)"
        @search="forumData.searchTopics(searchQuery)"
      >
      <button
        type="button"
        class="absolute end-2.5 bottom-2.5 rounded-25 px-4 py-2 text-sm text-white font-medium focus:border-color-[--vp-c-border] vp-button focus:outline-none"
        @click="forumData.searchTopics(searchQuery)"
      >
        {{ message.forum.header.search.placeholder }}
      </button>
    </div>
  </form>
  <div
    v-if="forumData.isSearching && !forumData.loading"
    class="absolute top-16 h-5 flex font-size-3.5 md:top-28"
  >
    <p class="mr-2 color-[var(--vp-c-text-3)]">
      {{ message.forum.header.search.allRelatedContentCount }}
    </p>
    <span>{{ forumData.topics.length }}</span>
  </div>
</template>

<style scoped>
input::-webkit-search-cancel-button {
  @apply i-lucide-x;
  appearance: none;
  cursor: pointer;
  width: 22px;
  height: 22px;
  background-color: var(--vp-c-text-1);
  border-radius: 50%;
  transition: all 0.3s;
}
</style>
