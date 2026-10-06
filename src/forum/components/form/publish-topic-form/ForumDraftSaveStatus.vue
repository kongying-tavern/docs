<script setup lang="ts">
import { CheckIcon, CircleAlertIcon, LoaderCircleIcon } from '@lucide/vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'

const props = defineProps<{ status: 'saved' | 'saving' | 'error', savedAt: number, idle: boolean }>()
const { message } = useLocalized()
const { reducedMotion } = useSitePreferences()
const copy = computed(() => message.value.forum.publish.feedbackForm)
const showSaved = ref(false)
let lastShown = 0
let hideTimer: ReturnType<typeof setTimeout> | undefined
watch(() => [props.status, props.savedAt, props.idle] as const, () => {
  if (props.status !== 'saved' || !props.idle) {
    clearTimeout(hideTimer)
    showSaved.value = false
    return
  }
  if (props.savedAt <= lastShown)
    return
  lastShown = props.savedAt
  showSaved.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => showSaved.value = false, 1600)
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(hideTimer))
</script>

<template>
  <Transition name="draft-save-status" :css="!reducedMotion">
    <span v-if="status !== 'saved' || showSaved" class="text-xs text-muted-foreground inline-flex shrink-0 gap-1.5 items-center" role="status" aria-live="polite" aria-atomic="true">
      <LoaderCircleIcon v-if="status === 'saving'" class="size-3.5 animate-spin" aria-hidden="true" />
      <CircleAlertIcon v-else-if="status === 'error'" class="size-3.5" aria-hidden="true" />
      <CheckIcon v-else class="size-3.5" aria-hidden="true" />
      {{ status === 'saving' ? copy.savingDraft : status === 'error' ? copy.autoSaveFailed : copy.draftSavedShort }}
    </span>
  </Transition>
</template>

<style scoped>
.draft-save-status-enter-active,
.draft-save-status-leave-active {
  transition: opacity 180ms ease-out;
}
.draft-save-status-enter-from,
.draft-save-status-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .draft-save-status-enter-active,
  .draft-save-status-leave-active {
    transition: none;
  }
}
</style>
