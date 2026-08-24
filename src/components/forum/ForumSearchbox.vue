<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'

const emits = defineEmits(['search'])
const modelValue = defineModel<string>('query')
const { message } = useLocalized()
const { list, submitSearch } = useForumRoute()
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')

async function handleSearch() {
  const query = (modelValue.value || '').trim()
  await submitSearch(query)
  emits('search')
}

onMounted(() => {
  if (!modelValue.value && list.value?.q)
    modelValue.value = list.value.q
})
</script>

<template>
  <form class="p-r-4 w-full">
    <label
      for="default-search"
      class="text-sm text-gray-900 font-medium mb-2 sr-only dark:text-white"
    >
      {{ message.ui.button.search }}
    </label>
    <div class="relative">
      <div
        class="mr-2 pr-2 flex pointer-events-none items-center start-0 inset-y-0 absolute"
      >
        <span class="vp-icon DocSearch-Search-Icon size-5" aria-hidden="true" />
      </div>
      <input
        id="default-search"
        ref="searchInput"
        v-model.trim="modelValue"
        type="search"
        class="text-4 c-[var(--vp-c-text-1)] py-4 pl-8 rounded-full w-full block"
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
