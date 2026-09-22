<script setup lang="ts">
import type { FORUM } from '~/components/forum/types'
import type { ForumSort } from '~/services/forum/forumRoute'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumListControlOptions } from '~/composables/forum/useForumListControlOptions'
import { useForumViewMode } from '~/composables/useForumViewMode'
import ForumResponsiveMenu from '../ui/responsive/ForumResponsiveMenu.vue'

const props = defineProps<{ sort: ForumSort }>()
const emit = defineEmits<{ sortChange: [sort: ForumSort] }>()
const { viewMode } = useForumViewMode()
const { views, sorts } = useForumListControlOptions()
const { message } = useLocalized()

const drawerTitle = computed(() => `${message.value.forum.header.view.label}、${message.value.forum.sidebar.listSort}`)

const items = computed<FORUM.TopicDropdownMenu[]>(() => [
  {
    type: 'radio-group',
    id: 'view-mode',
    label: message.value.forum.header.view.label,
    items: views.value.map(mode => ({
      type: 'radio-item',
      id: `view-${mode.id}`,
      value: mode.id,
      label: mode.label,
      icon: mode.icon,
      checked: viewMode.value === mode.id,
      onChange: next => viewMode.value = next as FORUM.TopicViewMode,
    })),
  },
  { type: 'separator', id: 'view-sort-separator' },
  {
    type: 'radio-group',
    id: 'sort',
    label: message.value.forum.sidebar.listSort,
    items: sorts.value.map(sort => ({
      type: 'radio-item',
      id: `sort-${sort.id}`,
      value: sort.id,
      label: sort.label,
      checked: props.sort === sort.id,
      onChange: next => emit('sortChange', next as ForumSort),
    })),
  },
])
</script>

<template>
  <ForumResponsiveMenu
    :items="items"
    :title="drawerTitle"
  >
    <template #trigger>
      <button
        type="button"
        class="rounded-full inline-flex size-8 items-center justify-center focus-visible:outline-2 focus-visible:outline-[--vp-c-brand-1] hover:bg-[--vp-c-bg-soft]"
        :aria-label="`${message.forum.header.view.label}、${message.forum.sidebar.listSort}`"
        aria-haspopup="menu"
      >
        <span class="i-lucide-settings icon-btn bg-[--vp-c-text-2] size-4" aria-hidden="true" />
      </button>
    </template>
  </ForumResponsiveMenu>
</template>
