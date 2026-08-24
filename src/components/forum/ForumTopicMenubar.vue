<script setup lang="ts">
import type { ForumFilter, ForumSort } from '~/services/forum/forumRoute'
import ForumTopicSortDropdown from './ForumTopicSortDropdown.vue'
import ForumTopicTypeDropdown from './ForumTopicTypeDropdown.vue'
import ForumTopicViewDropdown from './ForumTopicViewDropdown.vue'

defineProps<{
  filter: ForumFilter
  sort: ForumSort
  loading?: boolean
}>()

const emit = defineEmits<{
  'filter-change': [filter: ForumFilter]
  'sort-change': [sort: ForumSort]
}>()
</script>

<template>
  <div class="flex h-32px">
    <div class="flex items-center">
      <ForumTopicTypeDropdown :filter="filter" :loading="loading" @change="emit('filter-change', $event)" />
      <ForumTopicSortDropdown :sort="sort" :loading="loading" @change="emit('sort-change', $event)" />
      <ForumTopicViewDropdown />
    </div>
  </div>
</template>
