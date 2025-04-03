<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { storeToRefs } from 'pinia'
import { useForumData } from '~/stores/useForumData'

const forumData = useForumData()
const { isSearching, topics } = storeToRefs(forumData)

const { message } = useLocalized()
function handleUndo() {
  forumData.refreshData()
  isSearching.value = false
}
</script>

<template>
  <div v-if="isSearching && !forumData.loading" class="w-fit flex items-center rounded-full pl-4 font-size-3.5 hover:bg-[--vp-c-bg-soft]">
    <p class="mr-2 color-[var(--vp-c-text-3)]">
      {{ message.forum.header.search.allRelatedContentCount }}
    </p>
    <span>{{ topics.length }}</span>

    <Button class="ml-1 rounded-full color-[var(--vp-c-text-3)] hover:bg-transparent" variant="ghost" @click="handleUndo">
      <span class="i-lucide-x icon-btn size-4.5" />
    </Button>
  </div>
</template>
