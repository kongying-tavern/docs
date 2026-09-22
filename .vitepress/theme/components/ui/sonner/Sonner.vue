<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from '@lucide/vue'
import { Toaster as Sonner } from 'vue-sonner'
import { cn } from '@/lib/utils'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    :class="cn('toaster group', props.class)"
    :style="{
      '--normal-bg': 'oklch(var(--popover))',
      '--normal-text': 'oklch(var(--popover-foreground))',
      '--normal-border': 'oklch(var(--border))',
      '--border-radius': 'var(--radius)',
    }"
    v-bind="props"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>

<style>
.toaster [data-sonner-toast][data-styled='true']:has([data-close-button]) {
  padding-inline-end: 44px;
}

.toaster [data-sonner-toast][data-styled='true'] [data-close-button] {
  inset: 8px 8px auto auto;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 6px;
  color: var(--vp-c-text-2);
  background: transparent;
  box-shadow: none;
  opacity: 0.72;
  transform: none;
}

.toaster [data-sonner-toast][data-styled='true'] [data-close-button]:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-default-soft);
  opacity: 1;
}

.toaster[data-sonner-theme='dark'] [data-sonner-toast][data-styled='true'] [data-close-button] {
  color: var(--vp-c-text-2);
  background: transparent;
}

.toaster[data-sonner-theme='dark'] [data-sonner-toast][data-styled='true'] [data-close-button]:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-default-soft);
}

.toaster [data-sonner-toast][data-styled='true'] [data-close-button]:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 1px;
  box-shadow: none;
}
</style>
