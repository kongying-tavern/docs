<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useData } from 'vitepress'
import { computed } from 'vue'
import { getLangPath } from '@/utils'
import ForumTopicTypeBadge from './ui/ForumTopicTypeBadge.vue'

const { searchQuery, topicData, limit = 6 } = defineProps<{
  searchQuery: string
  topicData: ForumAPI.Topic[]
  limit?: number
}>()

const emits = defineEmits([
  'select',
])

// Get locale information for proper link generation
const { localeIndex } = useData()

// Generate correct topic link with locale and base
function getTopicLink(topicId: string | number): string {
  return `.${`${getLangPath(localeIndex.value)}feedback/topic/${topicId}`}`
}

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

const filteredItems = computed(() => {
  if (!topicData || !Array.isArray(topicData)) {
    return []
  }

  if (searchQuery.length < 1) {
    return []
  }

  const filtered = topicData
    .filter((item) => {
      if (!item || !item.title)
        return false
      const titleMatch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const contentMatch = item.content?.text && item.content.text.toLowerCase().includes(searchQuery.toLowerCase())
      return titleMatch || contentMatch
    })
    .slice(0, limit) // Apply limit directly here
    .map(item => ({
      ...item,
      highlightedTitle: highlightText(item.title || '', searchQuery),
      highlightedContent: highlightText(item.content?.text || '', searchQuery),
    }))

  return filtered
})
</script>

<template>
  <div class="pb-8 w-full">
    <h2 v-if="filteredItems.length > 0" class="mb-5">
      Suggested Searches
    </h2>
    <ul
      class="gap-y-4 grid grid-row-auto grid-flow-col grid-flow-row grid-cols-1"
    >
      <li v-for="item in filteredItems" :key="item.id" class="search-term flex gap-4 w-full cursor-pointer items-center">
        <span class="vp-icon DocSearch-Search-Icon size-4 inline-block important:bg-[--vp-c-text-3]" aria-hidden="true" />
        <VPLink
          :no-icon="true" :href="getTopicLink(item.id)" class="search-term w-full break-all text-ellipsis overflow-hidden"
          @click="emits('select')"
        >
          <div class="flex items-center">
            <h4 class="mr-4 line-clamp-1" v-html="item.type === 'BUG' ? item.highlightedContent : item.highlightedTitle" />
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
