<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'
import { useForumHomeStore } from '~/stores/forum/useForumHomeStore'

const forumData = useForumHomeStore()
const { list, clearSearch } = useForumRoute()

// 直接访问store属性
const isSearching = computed(() => forumData.isSearching)
const topics = computed(() => forumData.data)

const { message } = useLocalized()

// 获取当前搜索关键词，优先从URL参数获取
const currentSearchQuery = computed(() => {
  return list.value?.q || ''
})

async function handleUndo() {
  // 清除搜索状态并重新获取数据
  await forumData.searchTopics('')

  await clearSearch()
}
</script>

<template>
  <div v-if="isSearching && !forumData.loading && currentSearchQuery" class="font-size-3.5 pl-4 rounded-full flex w-fit items-center hover:bg-[--vp-c-bg-soft]">
    <p class="color-[var(--vp-c-text-3)] mr-2">
      {{ message.forum.header.search.placeholder }}
      ⌈{{ currentSearchQuery }}⌋ -
      {{ message.forum.header.search.allRelatedContentCount }}
    </p>
    <span>{{ topics.length }}</span>

    <Button class="color-[var(--vp-c-text-3)] ml-1 rounded-full hover:bg-transparent" variant="ghost" @click="handleUndo">
      <span class="i-lucide-x icon-btn size-4.5" />
    </Button>
  </div>
</template>
