<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

defineProps<{ followState: boolean | null, following: boolean, disabled: boolean, textClass?: HTMLAttributes['class'] }>()
const emit = defineEmits<{ toggle: [] }>()
const { t } = useI18n({ useScope: 'global' })
const isHovered = ref(false)
</script>

<template>
  <Button
    v-if="!disabled"
    :loading="following"
    :disabled="following"
    :variant="followState ? 'ghost' : 'default'"
    class="flex gap-1 transition items-center"
    :class="{ 'hover:c-[var(--vp-c-danger-1)] hover:border-[var(--vp-c-danger-1)]': followState }"
    @click="emit('toggle')"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <span
      class="text-base" :class="[
        followState ? '' : 'i-lucide:user-plus',
      ]"
    />
    <span :class="textClass">
      {{ followState ? (isHovered ? t('forum.labels.unfollow') : t('forum.labels.following')) : t('forum.labels.follow') }}
    </span>
  </Button>
</template>
