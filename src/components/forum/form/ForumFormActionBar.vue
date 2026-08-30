<script setup lang="ts">
import type { TabsConfig } from './publish-topic-form/types'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'

defineProps<{
  nextTab?: TabsConfig
  inTransition?: boolean
}>()

const emit = defineEmits<{
  close: []
  switchTab: []
}>()

const { message } = useLocalized()
</script>

<template>
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
      @click="emit('switchTab')"
    >
      <span>{{ nextTab.label }}</span>
      <span class="i-lucide-refresh-cw icon-btn" :class="{ 'animate-spin': inTransition }" aria-hidden="true" />
    </Button>
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

@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }

  .form-action-btn {
    transition: none;
  }
}
</style>
