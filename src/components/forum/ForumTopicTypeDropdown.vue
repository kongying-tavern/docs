<script setup lang="ts">
import type { ForumAPI } from '@/apis/forum/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select'
import { useLocalized } from '@/hooks/useLocalized'
import { computed, inject } from 'vue'
import { FORUM_TOPIC_FILTER_KEY, FORUM_TOPIC_LOADING_KEY } from './shared'

const { message } = useLocalized()

const menuItems: {
  id: ForumAPI.FilterBy
  hash: ForumAPI.FilterBy
  label: string
}[] = [
  {
    id: 'ALL',
    hash: 'ALL',
    label: message.value.forum.header.navigation.allFeedback,
  },
  {
    id: 'BUG',
    hash: 'BUG',
    label: message.value.forum.header.navigation.bugFeedback,
  },
  {
    id: 'FEAT',
    hash: 'FEAT',
    label: message.value.forum.header.navigation.featFeedback,
  },
  {
    id: 'CLOSED',
    hash: 'CLOSED',
    label: message.value.forum.header.navigation.closedFeedback,
  },
]

const filter = inject(FORUM_TOPIC_FILTER_KEY)!
const loading = inject(FORUM_TOPIC_LOADING_KEY)!

const currentLabel = computed(() => {
  const item = menuItems.find(i => i.id === filter.value)
  return item?.label ?? ''
})
</script>

<template>
  <div class="flex items-center gap-4">
    <Select v-model="filter" :disabled="loading">
      <SelectTrigger variant="ghost" class="mt-2 w-fit whitespace-break-spaces rounded-full font-size-3 shadow-none hover:bg-[--vp-c-bg-soft]">
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

<style scoped></style>
