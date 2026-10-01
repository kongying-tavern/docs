<script setup lang="ts">
import type { FORUM } from '~/forum/components/types'
import type { ForumFilter, ForumSort, ForumTopicType } from '~/forum/services/forumRoute'
import { computed, ref } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumViewMode } from '~/forum/composables/state/useForumViewMode'
import { useForumListControlOptions } from '~/forum/composables/view/useForumListControlOptions'
import ForumFilterDrawer from '../ui/ForumFilterDrawer.vue'

interface ForumSearchSettings {
  query: string
  filter: ForumFilter
  topicType: ForumTopicType
  sort: ForumSort
  viewMode: FORUM.TopicViewMode
}

const props = defineProps<{
  query: string
  filter: ForumFilter
  topicType: ForumTopicType
  sort: ForumSort
}>()
const emit = defineEmits<{ search: [settings: ForumSearchSettings] }>()
const { message } = useLocalized()
const { viewMode } = useForumViewMode()
const { filters, types, sorts, views } = useForumListControlOptions()
const typeOptions = computed(() => types.value.map(item => ({
  ...item,
  label: item.id === 'bug'
    ? message.value.forum.header.navigation.bugFeedback
    : item.id === 'feat'
      ? message.value.forum.header.navigation.featFeedback
      : item.label,
})))
const draft = ref<ForumSearchSettings>(currentSettings())
const sections = computed(() => [
  { id: 'range', icon: 'i-lucide-list', label: message.value.forum.header.search.feedbackRange, selected: draft.value.filter, options: filters.value },
  { id: 'type', icon: 'i-lucide-shapes', label: message.value.forum.header.search.feedbackType, selected: draft.value.topicType, options: typeOptions.value },
  { id: 'sort', icon: 'i-lucide-arrow-down-wide-narrow', label: message.value.forum.sidebar.listSort, selected: draft.value.sort, options: sorts.value },
  { id: 'view', icon: 'i-lucide-layout-list', label: message.value.forum.header.view.label, selected: draft.value.viewMode, options: views.value },
])

function currentSettings(): ForumSearchSettings {
  return { query: props.query, filter: props.filter, topicType: props.topicType, sort: props.sort, viewMode: viewMode.value }
}

function initializeDraft(isOpen: boolean): void {
  if (isOpen)
    draft.value = currentSettings()
}

function chooseOption(section: string, id: string): void {
  switch (section) {
    case 'range':
      draft.value.filter = id as ForumFilter
      break
    case 'type':
      draft.value.topicType = id as ForumTopicType
      break
    case 'sort':
      draft.value.sort = id as ForumSort
      break
    case 'view':
      draft.value.viewMode = id as FORUM.TopicViewMode
      break
  }
}

function reset(): void {
  draft.value = { query: draft.value.query, filter: 'all', topicType: 'all', sort: 'created', viewMode: 'CARD' }
}
</script>

<template>
  <ForumFilterDrawer
    :title="message.forum.header.search.settings"
    :description="message.forum.topic.searchFacets.choose"
    :back-label="message.forum.topic.searchFacets.back"
    :reset-label="message.forum.header.search.resetFilters"
    :submit-label="message.ui.button.search"
    :sections="sections"
    @update:open="initializeDraft"
    @select="chooseOption"
    @reset="reset"
    @submit="emit('search', { ...draft })"
  />
</template>
