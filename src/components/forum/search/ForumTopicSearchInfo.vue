<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'

const props = defineProps<{ loading: boolean, total: number }>()
const { list, clearSearch } = useForumRoute()
const isSearching = computed(() => Boolean(list.value?.q))

const { message } = useLocalized()

const currentSearchQuery = computed(() => {
  return list.value?.q || ''
})
const summary = computed(() => message.value.forum.header.search.resultSummary
  .replace('{query}', currentSearchQuery.value)
  .replace('{count}', String(props.total)))

async function handleUndo() {
  await clearSearch()
}
</script>

<template>
  <blockquote
    v-if="isSearching && !props.loading && props.total > 0"
    class="text-sm color-[var(--vp-c-text-2)] my-3 px-2 py-1 border-l-2 border-[var(--vp-c-divider)] rounded-r-md flex min-h-8 w-full items-center hover:bg-[var(--vp-c-bg-soft)]"
  >
    <span
      class="i-lucide-chevron-right mr-1.5 icon-btn bg-[var(--vp-c-text-3)] shrink-0 size-4"
      aria-hidden="true"
    />
    <p class="flex-1 min-w-0 truncate">
      {{ summary }}
    </p>
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      class="color-[var(--vp-c-text-3)] rounded-full"
      :aria-label="message.ui.button.close"
      @click="handleUndo"
    >
      <span class="i-lucide-x icon-btn size-4" aria-hidden="true" />
    </Button>
  </blockquote>
</template>
