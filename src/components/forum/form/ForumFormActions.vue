<script setup lang="ts">
import type { TabsConfig } from './publish-topic-form/types'
import { ReloadIcon } from '@radix-icons/vue'
import { useMediaQuery } from '@vueuse/core'
import { Button, InteractiveHoverButton } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { DrawerFooter } from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'

interface Props {
  loading: boolean
  disabled: boolean
  errorCount?: number
  nextTab?: TabsConfig
  inTransition?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'review-errors'): void
  (e: 'switch-tab'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
const { message } = useLocalized()
const isDesktop = useMediaQuery('(min-width: 768px)')
</script>

<template>
  <template v-if="isDesktop">
    <div class="action-bar flex flex-col items-start absolute">
      <Button class="form-action-btn" type="button" variant="secondary" @click="emit('close')">
        <span>{{ message.ui.button.close }}</span>
        <span class="i-lucide-x icon-btn" aria-hidden="true" />
      </Button>

      <Button
        v-if="nextTab"
        class="form-action-btn"
        type="button"
        variant="secondary"
        @click="emit('switch-tab')"
      >
        <span>{{ nextTab.label }}</span>
        <span class="i-lucide-refresh-cw icon-btn" :class="{ 'animate-spin': inTransition }" aria-hidden="true" />
      </Button>
    </div>

    <DialogFooter
      class="form-footer-container py-4 flex flex-wrap w-full bottom-0 sticky z-10"
      :class="{ 'animate-switching': inTransition }"
    >
      <button
        v-if="errorCount"
        type="button"
        class="validation-summary text-xs text-[var(--vp-c-danger-1)] flex gap-2 items-center"
        @click="emit('review-errors')"
      >
        <span class="i-lucide-circle-alert size-4" aria-hidden="true" />
        {{ message.forum.publish.feedbackForm.fieldsNeedAttention.replace('{count}', String(errorCount)) }}
      </button>
      <InteractiveHoverButton
        class="text-base ml--1.5 mr-8 mt--2 px-8 py-3 border-2 border-[var(--vp-c-divider)] rounded-md border-dashed bg-transparent hover:border-solid"
        :disabled="disabled || loading"
        :loading="loading"
        :text="loading ? message.forum.publish.publishLoading : message.forum.publish.feedbackForm.submit"
      />
    </DialogFooter>
  </template>

  <div v-else class="form-footer-container bottom-0 sticky z-10">
    <button
      v-if="errorCount"
      type="button"
      class="validation-summary text-xs text-[var(--vp-c-danger-1)] px-5 pt-3 flex gap-2 items-center"
      @click="emit('review-errors')"
    >
      <span class="i-lucide-circle-alert size-4" aria-hidden="true" />
      {{ message.forum.publish.feedbackForm.fieldsNeedAttention.replace('{count}', String(errorCount)) }}
    </button>
    <DrawerFooter class="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <Button type="submit" :disabled="disabled || loading">
        <ReloadIcon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        <span v-else class="i-lucide-send size-4" aria-hidden="true" />
        {{ loading ? message.forum.publish.publishLoading : message.forum.publish.feedbackForm.submit }}
      </Button>
      <Button type="button" variant="outline" @click="emit('close')">
        {{ message.ui.button.cancel }}
      </Button>
    </DrawerFooter>
  </div>
</template>

<style scoped>
.action-bar {
  top: -12px;
  left: calc((min(800px, calc(100vw - 32px)) - 100vw) / 2);
}

.action-bar > :not(:first-child) {
  margin-top: 0.75rem;
}

.form-action-btn {
  width: fit-content;
  margin-left: -0.375rem;
  border-radius: 0 9999px 9999px 0;
  transition: transform 180ms ease, background-color 180ms ease;
}

.form-action-btn > :first-child {
  display: inline-block;
  max-width: 0;
  margin-left: 0;
  overflow: hidden;
  white-space: nowrap;
}

.form-action-btn:hover {
  transform: translateX(4px);
}

.form-action-btn:hover > :first-child,
.form-action-btn:focus-visible > :first-child {
  max-width: 7rem;
  margin-left: 0.375rem;
}

.form-footer-container {
  position: relative;
}

.validation-summary:hover {
  text-decoration: underline;
}

.submit-letter-action {
  width: fit-content;
  min-width: fit-content;
  background: var(--vp-c-brand-1) !important;
  border: 1px solid var(--vp-c-brand-1) !important;
  border-radius: 0.5rem;
  box-shadow: none;
  color: var(--vp-c-white) !important;
  padding-inline: 1.25rem;
  transform: none;
}

.submit-letter-action:hover {
  background: var(--vp-c-brand-2) !important;
  border-color: var(--vp-c-brand-2) !important;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }

  .form-action-btn {
    transition: none;
  }
}
</style>
