<script setup lang="ts">
import { Button } from '@/components/ui/button'

interface Props {
  currentPage: number
  totalPages: number
  totalEntries: number
  pageSize: number
}

interface Emits {
  (e: 'page-change', page: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handlePrevPage() {
  if (props.currentPage > 1) {
    emit('page-change', props.currentPage - 1)
  }
}

function handleNextPage() {
  if (props.currentPage < props.totalPages) {
    emit('page-change', props.currentPage + 1)
  }
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="text-sm text-muted-foreground">
      显示 {{ Math.min((currentPage - 1) * pageSize + 1, totalEntries) }} -
      {{ Math.min(currentPage * pageSize, totalEntries) }} 条，
      共 {{ totalEntries }} 条
    </div>
    <div class="flex items-center space-x-2">
      <Button
        :disabled="currentPage <= 1"
        variant="outline"
        size="sm"
        @click="handlePrevPage"
      >
        <i class="i-lucide-chevron-left h-4 w-4" />
      </Button>
      <span class="px-2 text-sm">
        {{ currentPage }} / {{ totalPages }}
      </span>
      <Button
        :disabled="currentPage >= totalPages"
        variant="outline"
        size="sm"
        @click="handleNextPage"
      >
        <i class="i-lucide-chevron-right h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
