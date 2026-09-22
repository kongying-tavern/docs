<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { ForumFilter, ForumSort, ForumTopicType } from '~/services/forum/forumRoute'
import { ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumSearchInput from '../search/ForumSearchInput.vue'
import ForumTopicCategoryDropdown from './ForumTopicCategoryDropdown.vue'
import ForumTopicTypeDropdown from './ForumTopicTypeDropdown.vue'
import ForumTopicViewDropdown from './ForumTopicViewDropdown.vue'

const props = defineProps<{
  filter: ForumFilter
  topicType: ForumTopicType
  sort: ForumSort
  query?: string
  suggestions?: ForumAPI.Topic[]
}>()

const emit = defineEmits<{
  'filter-change': [filter: ForumFilter]
  'type-change': [topicType: ForumTopicType]
  'sort-change': [sort: ForumSort]
  'search': [query: string]
}>()

const searchQuery = ref(props.query ?? '')
const { message } = useLocalized()
const { openSearch } = useForumRoute()

watch(() => props.query ?? '', query => searchQuery.value = query)
</script>

<template>
  <div class="forum-topic-toolbar flex flex-wrap gap-2 min-h-8 items-center">
    <div class="forum-topic-toolbar-filters flex flex-wrap min-w-0 items-center">
      <ForumTopicTypeDropdown :filter="filter" @change="emit('filter-change', $event)" />
      <ForumTopicCategoryDropdown :topic-type="topicType" @change="emit('type-change', $event)" />
      <ForumTopicViewDropdown :sort="sort" @sort-change="emit('sort-change', $event)" />
    </div>
    <ForumSearchInput
      v-model:query="searchQuery"
      class="ml-auto min-w-0"
      :suggestions="suggestions"
      @submit="emit('search', $event)"
    />
    <button
      type="button"
      class="forum-mobile-search-trigger ml-auto"
      :aria-label="message.forum.header.search.placeholder"
      @click="openSearch"
    >
      <span class="i-lucide-search icon-btn bg-[var(--vp-c-text-2)] size-4" aria-hidden="true" />
      <span class="forum-mobile-search-trigger-text">{{ message.ui.button.search }}</span>
    </button>
  </div>
</template>

<style scoped>
.forum-topic-toolbar:has(.forum-search-box.expanded) {
  flex-wrap: nowrap;
}

.forum-topic-toolbar:has(.forum-search-box.expanded) .forum-topic-toolbar-filters {
  flex-shrink: 0;
}

.forum-topic-toolbar :deep(.forum-search-box.expanded) {
  flex-shrink: 1;
  min-width: 0;
}

.forum-mobile-search-trigger {
  display: none;
}

@media (max-width: 959px) {
  .forum-topic-toolbar :deep(.forum-search-box) {
    display: none;
  }

  .forum-mobile-search-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    border-radius: 9999px;
    padding: 0 10px;
    color: var(--vp-c-text-2);
    font-size: 12px;
  }

  .forum-mobile-search-trigger:hover {
    background: var(--vp-c-default-soft);
  }
}

@media (max-width: 400px) {
  .forum-mobile-search-trigger {
    width: 32px;
    justify-content: center;
    padding: 0;
  }

  .forum-mobile-search-trigger-text {
    display: none;
  }
}
</style>
