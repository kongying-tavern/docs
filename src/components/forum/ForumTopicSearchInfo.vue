<script setup lang="ts">
import { useUrlSearchParams } from '@vueuse/core'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumHomeStore } from '~/stores/forum/useForumHomeStore'

const forumData = useForumHomeStore()
const params = computed(() => useUrlSearchParams('history', {
  removeFalsyValues: true,
  removeNullishValues: true,
}))

// 直接访问store属性
const isSearching = computed(() => forumData.isSearching)
const topics = computed(() => forumData.data)

const { message } = useLocalized()

// 获取当前搜索关键词，优先从URL参数获取
const currentSearchQuery = computed(() => {
  return params.value.q || ''
})

async function handleUndo() {
  // 清除搜索状态并重新获取数据
  await forumData.searchTopics('')

  // 清除URL参数
  const newUrl = new URL(window.location.href)
  newUrl.searchParams.delete('q')
  window.history.replaceState({}, '', newUrl)
}
</script>

<template>
  <div v-if="isSearching && !forumData.loading && currentSearchQuery" class="w-fit flex items-center rounded-full pl-4 font-size-3.5 hover:bg-[--vp-c-bg-soft]">
    <p class="mr-2 color-[var(--vp-c-text-3)]">
      {{ message.forum.header.search.placeholder }}
      ⌈{{ currentSearchQuery }}⌋ -
      {{ message.forum.header.search.allRelatedContentCount }}
    </p>
    <span>{{ topics.length }}</span>

    <Button class="ml-1 rounded-full color-[var(--vp-c-text-3)] hover:bg-transparent" variant="ghost" @click="handleUndo">
      <span class="i-lucide-x icon-btn size-4.5" />
    </Button>
  </div>
</template>
