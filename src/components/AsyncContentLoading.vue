<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Skeleton } from '@/components/ui/skeleton'
import AsyncLoadError from './AsyncLoadError.vue'

withDefaults(defineProps<{ error?: Error, padded?: boolean }>(), { padded: true })
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div v-if="error" class="async-content-skeleton" :class="{ 'is-padded': padded }">
    <AsyncLoadError @retry="emit('retry')" />
  </div>
  <div v-else class="async-content-skeleton" :class="{ 'is-padded': padded }" role="status" aria-live="polite" aria-busy="true" data-async-loading>
    <span class="sr-only">{{ t('ui.button.loading') }}</span>
    <div aria-hidden="true">
      <Skeleton class="mb-5 h-7 w-1/3" />
      <div class="skeleton-rows">
        <div v-for="row in 3" :key="row" class="skeleton-row">
          <div class="flex-1 min-w-0 space-y-1">
            <Skeleton class="h-4 w-2/5" />
            <Skeleton class="h-3 w-4/5" />
          </div>
          <Skeleton class="rounded-lg shrink-0 h-8 w-16" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.async-content-skeleton.is-padded {
  padding: 24px;
}

.skeleton-rows {
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 72px;
  padding: 16px;
}

.skeleton-row:not(:last-child) {
  border-block-end: 1px solid var(--vp-c-divider);
}

@media (max-width: 639px) {
  .skeleton-row {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }
}
</style>
