<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select'
import { useLocalized } from '@/hooks/useLocalized'
import { computed, inject } from 'vue'
import { FORUM_TOPIC_SORT_KEY } from './shared'

const { message } = useLocalized()

const sortLabel = computed(() => [
  ['created', message.value.forum.header.sort.created],
  ['updated', message.value.forum.header.sort.updated],
  ['notes_count', message.value.forum.header.sort.notesCount],
])

const sort = inject(FORUM_TOPIC_SORT_KEY)!
</script>

<template>
  <Select v-model="sort">
    <SelectTrigger
      class="mt-2 w-fit whitespace-break-spaces rounded-full font-size-3 c-[--vp-c-text-2] shadow-none hover:bg-[--vp-c-bg-soft]"
    >
      {{ sortLabel.find(([key]) => key === sort)?.[1] || '' }}
    </SelectTrigger>
    <SelectContent>
      <SelectLabel>Sort By</SelectLabel>
      <SelectItem value="created">
        {{ message.forum.header.sort.created }}
      </SelectItem>
      <SelectItem value="updated">
        {{ message.forum.header.sort.updated }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
