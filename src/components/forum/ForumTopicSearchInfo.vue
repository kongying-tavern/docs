<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'

const props = defineProps<{ loading: boolean, total: number }>()
const { list, clearSearch } = useForumRoute()
const isSearching = computed(() => Boolean(list.value?.q))

const { message } = useLocalized()

// 获取当前搜索关键词，优先从URL参数获取
const currentSearchQuery = computed(() => {
  return list.value?.q || ''
})

async function handleUndo() {
  await clearSearch()
}
</script>

<template>
  <div v-if="isSearching && !props.loading && currentSearchQuery" class="font-size-3.5 pl-4 rounded-full flex w-fit items-center hover:bg-[--vp-c-bg-soft]">
    <p class="color-[var(--vp-c-text-3)] mr-2">
      {{ message.forum.header.search.placeholder }}
      ⌈{{ currentSearchQuery }}⌋ -
      {{ message.forum.header.search.allRelatedContentCount }}
    </p>
    <span>{{ props.total }}</span>

    <Button class="color-[var(--vp-c-text-3)] ml-1 rounded-full hover:bg-transparent" variant="ghost" @click="handleUndo">
      <span class="i-lucide-x icon-btn size-4.5" />
    </Button>
  </div>
</template>
