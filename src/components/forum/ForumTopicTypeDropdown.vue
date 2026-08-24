<script setup lang="ts">
import type { ForumFilter } from '~/services/forum/forumRoute'
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
  filter: ForumFilter
  loading?: boolean
}>()
const emit = defineEmits<{ change: [filter: ForumFilter] }>()

const { message } = useLocalized()

const menuItems = computed<{
  id: ForumFilter
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

const filter = computed<ForumFilter>({
  get: () => props.filter,
  set: (value) => {
    if (value !== props.filter)
      emit('change', value)
  },
})

const currentLabel = computed(() => {
  const item = menuItems.value.find(i => i.id === filter.value)
  return item?.label ?? ''
})
</script>

<template>
  <div class="flex gap-4 items-center">
    <Select v-model="filter" :disabled="props.loading">
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
