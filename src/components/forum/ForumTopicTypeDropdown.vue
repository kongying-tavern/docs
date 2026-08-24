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
import { useForumRoute } from '~/composables/useForumRoute'
import { FORUM_TOPIC_LOADING_KEY } from './shared'

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

const { list, navigateFilter } = useForumRoute()
const filter = computed<ForumAPI.FilterBy>({
  get: () => list.value?.filter ?? 'all',
  set: value => void navigateFilter(value),
})
const loading = inject(FORUM_TOPIC_LOADING_KEY, computed(() => false))

const currentLabel = computed(() => {
  const item = menuItems.value.find(i => i.id === filter.value)
  return item?.label ?? ''
})
</script>

<template>
  <div class="flex gap-4 items-center">
    <Select v-model="filter" :disabled="loading">
      <SelectTrigger
        variant="ghost"
        class="font-size-3 mt-2 rounded-full w-fit whitespace-break-spaces shadow-none hover:bg-[--vp-c-bg-soft]"
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
