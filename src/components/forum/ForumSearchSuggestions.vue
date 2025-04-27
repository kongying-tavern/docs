<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import ForumTopicTypeBadge from './ForumTopicTypeBadge.vue'

const { searchQuery, topicData, limit = 6 } = defineProps<{
  searchQuery: string
  topicData: ForumAPI.Topic[]
  limit?: number
}>()

const emits = defineEmits([
  'select',
])

function highlightText(text: string, keyword: string, scope: number = 20) {
  if (!keyword)
    return text

  const keywordEscaped = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const regex = new RegExp(`(${keywordEscaped})`, 'gi')
  const match = text.match(regex)

  if (!match)
    return text

  const index = text.toLowerCase().indexOf(match[0].toLowerCase())
  const start = Math.max(0, index - scope)
  const end = Math.min(text.length, index + match[0].length + scope)
  const excerpt = text.substring(start, end)

  return excerpt.replace(regex, `<span class="font-[--vp-font-family-subtitle] c-[#06c]">$1</span>`)
}

const filteredItems = computed(() =>
  topicData
    .filter(item => item.title.includes(searchQuery) || item.content.text.includes(searchQuery))
    .map(item => ({
      ...item,
      highlightedTitle: highlightText(item.title, searchQuery),
      highlightedContent: highlightText(item.content.text, searchQuery),
    })),
)
</script>

<template>
  <div class="w-full pb-8">
    <h2 v-if="filteredItems.length > 0" class="mb-5">
      Suggested Searches
    </h2>
    <ul
      class="grid grid-row-auto grid-flow-col grid-flow-row grid-cols-1 gap-y-4"
    >
      <li v-for="item in filteredItems.slice(0, limit)" :key="item.id" class="search-term w-full flex cursor-pointer items-center gap-4">
        <span class="vp-icon DocSearch-Search-Icon inline-block size-4 important:bg-[--vp-c-text-3]" aria-hidden="true" />
        <VPLink
          :no-icon="true" :href="`./topic/${item.id}`" class="search-term w-full overflow-hidden text-ellipsis break-all"
          @click="emits('select')"
        >
          <div class="flex items-center">
            <h4 class="line-clamp-1 mr-4" v-html="item.type === 'BUG' ? item.highlightedContent : item.highlightedTitle" />
            <ForumTopicTypeBadge :type="item.type" />
          </div>
        </VPLink>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.search-term {
  h4 {
    color: var(--vp-c-text-1)
  }

  p {
    color: var(--vp-c-text-2)
  }

  &:hover {
    h4, p {
      color: var(--vp-c-brand-1)
    }
  }
}
</style>
