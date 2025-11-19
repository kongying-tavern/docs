<script setup lang="ts">
import { inject, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useSearchInput } from '~/composables/useSearchInput'

const emits = defineEmits(['search'])
const modelValue = defineModel<string>('query')
const { message } = useLocalized()

// Get search function from the parent component context
const searchTopics = inject<(query: string) => void | Promise<void>>('searchTopics', async () => {
  console.warn('ForumSearchbox: searchTopics not provided, using default')
  // no-op fallback
})

const { searchInput, searchQuery } = useSearchInput({
  autoSearch: searchTopics,
})

async function handleSearch() {
  emits('search')
  if (searchQuery.value.trim()) {
    searchTopics(searchQuery.value)
  }
  else {
    // Clear search when query is empty
    searchTopics('')
  }
}

// Two-way sync between internal searchQuery and external modelValue
watch(searchQuery, (newVal) => {
  modelValue.value = newVal
}, {
  immediate: true,
})

watch(modelValue, (newVal) => {
  if (newVal !== searchQuery.value) {
    searchQuery.value = newVal || ''
  }
}, {
  immediate: true,
})
</script>

<template>
  <form class="w-full p-r-4">
    <label
      for="default-search"
      class="sr-only mb-2 text-sm text-gray-900 font-medium dark:text-white"
    >
      {{ message.ui.button.search }}
    </label>
    <div class="relative">
      <div
        class="pointer-events-none absolute start-0 inset-y-0 mr-2 flex items-center pr-2"
      >
        <span class="vp-icon DocSearch-Search-Icon size-5" aria-hidden="true" />
      </div>
      <input
        id="default-search"
        ref="searchInput"
        v-model.trim="searchQuery"
        type="search"
        class="block w-full rounded-full py-4 pl-8 text-4 c-[var(--vp-c-text-1)]"
        :placeholder="message.forum.header.search.placeholder"
        maxlength="50"
        required
        @keydown.enter.prevent="handleSearch"
        @search="handleSearch"
      >
    </div>
  </form>
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

input:focus {
  outline: none;
  box-shadow: none;
}

input:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: transparent;
}
</style>
