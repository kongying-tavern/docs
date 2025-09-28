<script setup lang="ts">
import type { ForumAPI } from '@/apis/forum/api'
import { computed, inject, watch } from 'vue'
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

// Watch filter changes and update URL path
watch(() => filter?.value, (newFilter, oldFilter) => {
  if (oldFilter === undefined)
    return // Skip initial setup

  // Update URL path when filter changes
  const currentPath = window.location.pathname
  const pathSegments = currentPath.split('/').filter(Boolean)

  if (newFilter === 'all') {
    // Remove filter from path - go to base forum path
    if (pathSegments.length > 1 && ['bug', 'feat', 'closed'].includes(pathSegments[pathSegments.length - 1])) {
      pathSegments.pop()
    }
  }
  else {
    // Add or replace filter in path
    if (pathSegments.length > 1 && ['bug', 'feat', 'closed'].includes(pathSegments[pathSegments.length - 1])) {
      pathSegments[pathSegments.length - 1] = newFilter
    }
    else {
      pathSegments.push(newFilter)
    }
  }

  const newPath = `/${pathSegments.join('/')}`
  if (newPath !== currentPath) {
    window.history.pushState({}, '', newPath)
  }
})
</script>

<template>
  <div class="flex items-center gap-4">
    <Select v-model="filter" :disabled="loading?.value">
      <SelectTrigger
        variant="ghost"
        class="mt-2 w-fit whitespace-break-spaces rounded-full font-size-3 shadow-none hover:bg-[--vp-c-bg-soft]"
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

<style scoped></style>
