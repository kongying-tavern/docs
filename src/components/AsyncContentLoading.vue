<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import { useLocalized } from '@/hooks/useLocalized'
import AsyncLoadError from './AsyncLoadError.vue'

defineProps<{ error?: Error }>()
const emit = defineEmits<{ retry: [] }>()
const { message } = useLocalized()
</script>

<template>
  <div v-if="error" class="async-content-skeleton">
    <AsyncLoadError @retry="emit('retry')" />
  </div>
  <div v-else class="async-content-skeleton" role="status" aria-live="polite" aria-busy="true" data-async-loading>
    <span class="sr-only">{{ message.ui.button.loading }}</span>
    <div aria-hidden="true">
      <Skeleton class="mb-6 h-6 w-1/3" />
      <div v-for="row in 3" :key="row" class="skeleton-row">
        <div class="flex-1 space-y-3">
          <Skeleton class="h-4 w-2/5" />
          <Skeleton class="h-3 w-4/5" />
        </div>
        <Skeleton class="rounded-lg h-8 w-16" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.async-content-skeleton {
  padding: 24px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-block: 20px;
  border-block-end: 1px solid var(--vp-c-divider);
}
</style>
