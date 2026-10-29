<script setup lang="ts">
import type { ForumSort, ForumTopicType } from '~/forum/services/forumRoute'
import { ChevronDown } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { getViewModeIconClass, useForumViewMode } from '~/forum/composables/state/useForumViewMode'
import ForumResponsiveSelect from '../ui/responsive/ForumResponsiveSelect.vue'

defineProps<{
  sort: ForumSort
  topicType: ForumTopicType
}>()

const emit = defineEmits<{
  'sort-change': [sort: ForumSort]
  'type-change': [type: ForumTopicType]
}>()

const { t } = useI18n({ useScope: 'global' })
const { viewMode, setViewMode } = useForumViewMode()
const types = computed(() => [
  { id: 'all' as const, label: t('forum.header.navigation.allTypes') },
  { id: 'bug' as const, label: t('forum.header.navigation.bugFeedback') },
  { id: 'feat' as const, label: t('forum.header.navigation.featFeedback') },
])
const sortOptions = computed(() => [
  { id: 'created' as const, label: t('forum.header.sort.created') },
  { id: 'updated' as const, label: t('forum.header.sort.updated') },
])
function sortLabel(sort: ForumSort): string {
  return sort === 'updated'
    ? t('forum.header.sort.updated')
    : t('forum.header.sort.created')
}
const nextViewMode = computed(() => viewMode.value === 'CARD' ? 'COMPACT' : 'CARD')
const nextViewLabel = computed(() => nextViewMode.value === 'CARD'
  ? t('forum.header.view.card')
  : t('forum.header.view.compact'))
const viewToggleLabel = computed(() => `${t('forum.header.view.label')}：${nextViewLabel.value}`)

function changeSort(value: string): void {
  if (value === 'created' || value === 'updated')
    emit('sort-change', value)
}
</script>

<template>
  <div class="pb-3 flex gap-2 min-w-0 items-center justify-between">
    <div class="py-1 flex gap-2 min-w-0 items-center overflow-x-auto scrollbar-none scroll-fade-x scroll-fade-4">
      <ForumResponsiveSelect
        :model-value="sort"
        :options="sortOptions"
        :label="t('forum.sidebar.listSort')"
        @update:model-value="changeSort"
      >
        <template #trigger>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            :aria-label="`${t('forum.sidebar.listSort')}${t('ui.labelSeparator')}${sortLabel(sort)}`"
          >
            {{ sortLabel(sort) }}
            <ChevronDown class="opacity-50 size-4" aria-hidden="true" />
          </Button>
        </template>
      </ForumResponsiveSelect>
      <Button
        v-for="type in types"
        :key="type.id"
        :variant="type.id === topicType ? 'ghost' : 'secondary'"
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
      @click="setViewMode(nextViewMode)"
    >
      <span :class="getViewModeIconClass(nextViewMode)" class="size-4" aria-hidden="true" />
    </Button>
  </div>
</template>
