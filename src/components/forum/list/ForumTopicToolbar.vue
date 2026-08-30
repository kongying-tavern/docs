<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { ForumFilter } from '~/services/forum/forumRoute'
import { ref, watch } from 'vue'
import ForumSearchInput from '../search/ForumSearchInput.vue'
import ForumTopicTypeDropdown from './ForumTopicTypeDropdown.vue'
import ForumTopicViewDropdown from './ForumTopicViewDropdown.vue'

const props = defineProps<{
  filter: ForumFilter
  query?: string
  suggestions?: ForumAPI.Topic[]
}>()

const emit = defineEmits<{
  'filter-change': [filter: ForumFilter]
  'search': [query: string]
}>()

const searchQuery = ref(props.query ?? '')

watch(() => props.query ?? '', query => searchQuery.value = query)
</script>

<template>
  <div class="flex gap-2 h-32px items-center">
    <div class="flex min-w-0 items-center">
      <ForumTopicTypeDropdown :filter="filter" @change="emit('filter-change', $event)" />
      <ForumTopicViewDropdown />
    </div>
    <ForumSearchInput
      v-model:query="searchQuery"
      class="ml-auto shrink-0"
      :suggestions="suggestions"
      @submit="emit('search', $event)"
    />
  </div>
</template>
