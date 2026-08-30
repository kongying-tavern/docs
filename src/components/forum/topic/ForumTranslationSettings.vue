<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTranslationPreferences } from '~/composables/forum/useForumTranslationPreferences'

const { message } = useLocalized()
const {
  autoTranslateEnabled,
} = useForumTranslationPreferences()
</script>

<template>
  <div class="space-y-1">
    <label class="translation-setting-row">
      <span class="flex-1 min-w-0">
        <span class="text-sm font-medium block">{{ message.forum.translate.autoTranslate }}</span>
        <span class="text-xs c-[var(--vp-c-text-3)] block">{{ message.forum.translate.autoTranslateDescription }}</span>
      </span>
      <input v-model="autoTranslateEnabled" type="checkbox" role="switch" class="accent-[var(--vp-c-brand-1)] shrink-0 size-4">
    </label>
  </div>
</template>

<style scoped>
.translation-setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
}

.translation-setting-row:hover {
  background: var(--vp-c-default-soft);
}
</style>
