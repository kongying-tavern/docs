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
        ref="searchInput"
        v-model.trim="searchQuery"
        @keydown.enter.prevent="forumData.searchTopics(searchQuery)"
        type="search"
        id="default-search"
        class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-100 bg-[var(--vp-c-bg-alt)] c-[var(--vp-c-text-1)]"
        :placeholder="message.forum.header.search.placeholder"
        maxlength="50"
        required
      />
      <button
        @click="forumData.searchTopics(searchQuery)"
        type="button"
        class="text-white absolute end-2.5 bottom-2.5 focus:border-color-[--vp-c-border] focus:outline-none font-medium rounded-25 text-sm px-4 py-2 vp-button"
      >
        Search
      </button>
    </div>
  </form>
  <div
    class="h-5 font-size-3.5 flex absolute top-28"
    v-if="forumData.isSearching && !forumData.loading"
  >
    <p class="color-[var(--vp-c-text-3)] mr-2">
      {{ message.forum.header.search.allRelatedContentCount }}
    </p>
    <span>{{ forumData.topics.length }}</span>
  </div>
</template>

<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'
import { useForumData } from '~/stores/useForumData'
import { useSearchInput } from '~/composables/useSearchInput'

const { message } = useLocalized()
const { searchInput, searchQuery } = useSearchInput()

const forumData = useForumData()
</script>
