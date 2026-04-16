<script setup lang="ts">
import type { ForumAPI } from '@/apis/forum/api'
import { computed, inject } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select'
import { useLocalized } from '@/hooks/useLocalized'
import { FORUM_STORE_KEY, FORUM_TOPIC_FILTER_KEY, FORUM_TOPIC_LOADING_KEY } from './shared'

const { message } = useLocalized()

const menuItems = computed<{
  id: ForumAPI.FilterBy
  label: string
}[]>(() => [
  {
    id: 'all',
    label: message.value.forum.header.navigation.allFeedback,
  },
  {
    id: 'bug',
    label: message.value.forum.header.navigation.bugFeedback,
  },
  {
    id: 'feat',
    label: message.value.forum.header.navigation.featFeedback,
  },
  {
    id: 'closed',
    label: message.value.forum.header.navigation.closedFeedback,
  },
])

const filter = inject(FORUM_TOPIC_FILTER_KEY)!
const loading = inject(FORUM_TOPIC_LOADING_KEY)!
const forumStore = inject(FORUM_STORE_KEY)!

const currentLabel = computed(() => {
  const item = menuItems.value.find(i => i.id === filter.value)
  return item?.label ?? ''
})

// Hover预加载功能
function handleHoverPreload() {
  if (forumStore?.triggerPreload) {
    forumStore.triggerPreload()
  }
}
</script>

<template>
  <div class="flex gap-4 items-center">
    <Select v-model="filter" :disabled="loading">
      <SelectTrigger
        variant="ghost"
        class="font-size-3 mt-2 rounded-full w-fit whitespace-break-spaces shadow-none hover:bg-[--vp-c-bg-soft]"
        @mouseenter="handleHoverPreload"
      >
        {{ currentLabel }}
      </SelectTrigger>
      <SelectContent class="min-w-full">
        <SelectLabel />
        <SelectItem v-for="item in menuItems" :key="item.id" :value="item.id">
          {{ item.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
