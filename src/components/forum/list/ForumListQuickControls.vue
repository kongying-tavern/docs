<script setup lang="ts">
import type { ForumSort, ForumTopicType } from '~/services/forum/forumRoute'
import { ChevronDown } from '@lucide/vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { getViewModeIconClass, useForumViewMode } from '~/composables/useForumViewMode'
import ForumResponsiveSelect from '../ui/responsive/ForumResponsiveSelect.vue'

defineProps<{
  sort: ForumSort
  topicType: ForumTopicType
}>()

const emit = defineEmits<{
  'sort-change': [sort: ForumSort]
  'type-change': [type: ForumTopicType]
}>()

const { message } = useLocalized()
const { viewMode } = useForumViewMode()
const types = computed(() => [
  { id: 'all' as const, label: message.value.forum.header.navigation.allTypes },
  { id: 'bug' as const, label: message.value.forum.header.navigation.bugFeedback },
  { id: 'feat' as const, label: message.value.forum.header.navigation.featFeedback },
])
const sortOptions = computed(() => [
  { id: 'created' as const, label: message.value.forum.header.sort.created },
  { id: 'updated' as const, label: message.value.forum.header.sort.updated },
])
function sortLabel(sort: ForumSort): string {
  return sort === 'updated'
    ? message.value.forum.header.sort.updated
    : message.value.forum.header.sort.created
}
const nextViewMode = computed(() => viewMode.value === 'CARD' ? 'COMPACT' : 'CARD')
const nextViewLabel = computed(() => nextViewMode.value === 'CARD'
  ? message.value.forum.header.view.card
  : message.value.forum.header.view.compact)
const viewToggleLabel = computed(() => `${message.value.forum.header.view.label}：${nextViewLabel.value}`)

function changeSort(value: string): void {
  if (value === 'created' || value === 'updated')
    emit('sort-change', value)
}
</script>

<template>
  <div class="pb-3 flex gap-2 items-start justify-between">
    <div class="flex flex-wrap gap-2 min-w-0 items-center">
      <ForumResponsiveSelect
        :model-value="sort"
        :options="sortOptions"
        :label="message.forum.sidebar.listSort"
        @update:model-value="changeSort"
      >
        <template #trigger>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            :aria-label="`${message.forum.sidebar.listSort}：${sortLabel(sort)}`"
          >
            {{ sortLabel(sort) }}
            <ChevronDown class="opacity-50 size-4" aria-hidden="true" />
          </Button>
        </template>
      </ForumResponsiveSelect>
      <Button
        v-for="type in types"
        :key="type.id"
        variant="ghost"
        size="sm"
        :class="type.id === topicType
          ? 'bg-[var(--vp-c-brand-soft)] text-[var(--vp-c-brand-1)]'
          : 'text-[var(--vp-c-text-2)]'"
        :aria-pressed="type.id === topicType"
        @click="emit('type-change', type.id)"
      >
        {{ type.label }}
      </Button>
    </div>
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      class="text-[var(--vp-c-text-2)] shrink-0"
      :aria-label="viewToggleLabel"
      :title="viewToggleLabel"
      @click="viewMode = nextViewMode"
    >
      <span :class="getViewModeIconClass(nextViewMode)" class="size-4" aria-hidden="true" />
    </Button>
  </div>
</template>
