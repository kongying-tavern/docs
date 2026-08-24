<script setup lang="ts">
import type { ForumSort } from '~/services/forum/forumRoute'
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select'
import { useLocalized } from '@/hooks/useLocalized'

const props = defineProps<{
  sort: ForumSort
}>()
const emit = defineEmits<{ change: [sort: ForumSort] }>()

const { message } = useLocalized()

const sortLabel = computed(() => [
  ['created', message.value.forum.header.sort.created],
  ['updated', message.value.forum.header.sort.updated],
])

const sort = computed<ForumSort>({
  get: () => props.sort,
  set: (value) => {
    if (value !== props.sort)
      emit('change', value)
  },
})
</script>

<template>
  <Select v-model="sort">
    <SelectTrigger
      class="font-size-3 c-[--vp-c-text-2] mt-2 rounded-full w-fit whitespace-break-spaces shadow-none hover:bg-[--vp-c-bg-soft]"
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
