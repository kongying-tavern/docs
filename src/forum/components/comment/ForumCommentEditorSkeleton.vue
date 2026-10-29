<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Skeleton } from '@/components/ui/skeleton'

defineProps<{ mention: boolean }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div class="comment-editor-skeleton" role="status" aria-live="polite" :aria-label="t('forum.comment.loadingComment')" aria-busy="true">
    <span class="sr-only">{{ t('forum.comment.loadingComment') }}</span>
    <div v-if="mention" class="comment-editor-skeleton-mentions" aria-hidden="true">
      <div v-for="index in 5" :key="index" class="comment-editor-skeleton-person">
        <Skeleton class="rounded-full size-8" />
        <div class="flex h-5 max-w-full items-center">
          <Skeleton class="h-2.5 max-w-full w-12" />
        </div>
      </div>
    </div>
    <div class="pt-3 flex flex-1 flex-col gap-3" aria-hidden="true">
      <Skeleton class="h-4 w-2/3" />
      <Skeleton class="h-4 w-1/2" />
    </div>
    <div class="flex items-center justify-between" aria-hidden="true">
      <div class="flex -ml-1.5">
        <Skeleton v-for="index in 3" :key="index" class="rounded-md size-9" />
      </div>
      <Skeleton class="rounded-full h-9 w-14" />
    </div>
  </div>
</template>

<style scoped>
.comment-editor-skeleton {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 220px;
  gap: 12px;
}
.comment-editor-skeleton-mentions {
  display: flex;
  gap: 4px;
  overflow: hidden;
  padding-block: 4px;
}
.comment-editor-skeleton-person {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 calc((100% - 16px) / 4.5);
  min-width: 0;
  gap: 4px;
  padding-block: 4px;
}
</style>
