<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from '@lucide/vue'
import { computed } from 'vue'
import { Toaster as Sonner } from 'vue-sonner'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSitePreferences } from '~/composables/useSitePreferences'

const props = defineProps<ToasterProps>()
const { desktopUi } = useSitePreferences()

// Sonner owns the action elements; reuse Button's variants rather than its native palette.
const displayedToastOptions = computed(() => {
  const options = props.toastOptions
  if (desktopUi.value)
    return options
  return {
    ...options,
    classes: {
      ...options?.classes,
      actionButton: cn(buttonVariants({ variant: 'default', size: 'sm' }), options?.classes?.actionButton),
      cancelButton: cn(buttonVariants({ variant: 'secondary', size: 'sm' }), options?.classes?.cancelButton),
    },
    actionButtonStyle: {
      background: 'oklch(var(--primary))',
      color: 'oklch(var(--primary-foreground))',
      ...options?.actionButtonStyle,
    },
    cancelButtonStyle: {
      background: 'oklch(var(--secondary))',
      color: 'oklch(var(--secondary-foreground))',
      ...options?.cancelButtonStyle,
    },
  }
})
</script>

<template>
  <Sonner
    :class="cn('toaster group', props.class)"
    :style="{
      'fontFamily': 'var(--vp-font-family-base)',
      '--normal-bg': 'oklch(var(--popover))',
      '--normal-text': 'oklch(var(--popover-foreground))',
      '--normal-border': 'oklch(var(--border))',
      '--border-radius': 'var(--radius)',
    }"
    v-bind="props"
    :toast-options="displayedToastOptions"
    :swipe-directions="desktopUi ? props.swipeDirections : ['left', 'right']"
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
.toaster[data-sonner-toaster]:empty {
  pointer-events: none;
}

.toaster [data-sonner-toast][data-styled='true'] {
  font-size: calc(13px * var(--site-ui-scale));
}

.toaster [data-sonner-toast][data-styled='true'] [data-content] {
  min-width: 0;
  flex: 1 1 auto;
  overflow-wrap: anywhere;
}

.toaster [data-sonner-toast][data-styled='true'] [data-button] {
  font-size: calc(12px * var(--site-ui-scale));
  min-height: 24px;
  height: auto;
  padding-block: 4px;
}

.toaster [data-sonner-toast][data-styled='true'] [data-button]:focus-visible {
  outline: 2px solid oklch(var(--ring));
  outline-offset: 2px;
  box-shadow: none;
}

@media (min-width: 960px) {
  .toaster [data-sonner-toast][data-styled='true']:has([data-close-button]) {
    padding-inline-end: 44px;
  }
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
  outline: 2px solid oklch(var(--ring));
  outline-offset: 1px;
  box-shadow: none;
}

@media (max-width: 959px) {
  .toaster[data-sonner-toaster][data-x-position] {
    left: 50vw;
    right: auto;
    bottom: auto;
    /* Keep the primary navigation reachable even for persistent errors. */
    top: calc(var(--vp-nav-height, 64px) + 8px + env(safe-area-inset-top, 0px));
    width: min(356px, calc(100vw - 32px));
    transform: translateX(-50%);
  }

  .toaster[data-sonner-toaster] [data-sonner-toast] {
    inset-inline: 0 auto;
    top: 0;
    bottom: auto;
    --lift: 1;
    width: 100%;
  }

  .toaster [data-sonner-toast][data-styled='true'] {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    align-items: start;
    column-gap: 10px;
    row-gap: 8px;
    padding: 12px 16px;
    font-size: calc(14px * var(--site-ui-scale));
    line-height: 1.5;
    max-height: calc(100dvh - var(--vp-nav-height, 64px) - 24px - env(safe-area-inset-top, 0px));
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
  }

  .toaster [data-sonner-toast][data-styled='true']:not(:has([data-icon])) {
    grid-template-columns: minmax(0, 1fr);
  }

  .toaster [data-sonner-toast][data-styled='true'] [data-content] {
    grid-column: -2 / -1;
    gap: 4px;
  }

  .toaster [data-sonner-toast][data-styled='true'] [data-description] {
    line-height: 1.5;
  }

  .toaster [data-sonner-toast][data-styled='true'] [data-icon] {
    width: 20px;
    height: 20px;
    margin: 1px 0 0;
  }

  .toaster [data-sonner-toast][data-styled='true'] [data-icon] svg {
    width: 20px;
    height: 20px;
    margin: 0;
  }

  .toaster [data-sonner-toast][data-styled='true'] [data-button] {
    grid-column: -2 / -1;
    justify-self: end;
    min-width: 44px;
    position: relative;
    min-height: 36px;
    max-width: 100%;
    margin: 4px 0;
    padding: 6px 12px;
    border-radius: var(--radius-md, 6px);
    font-size: calc(13px * var(--site-ui-scale));
    line-height: 1.5;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .toaster [data-sonner-toast][data-styled='true'] [data-button]::after {
    content: '';
    position: absolute;
    inset: -4px 0;
    border-radius: inherit;
  }

  /* Lift the diagnostic control into the same grid footer as Sonner's native actions. */
  .toaster [data-sonner-toast][data-styled='true']:has(.telemetry-details-button) {
    grid-template-columns: 20px minmax(0, 1fr) max-content;
  }

  .toaster [data-sonner-toast]:has(.telemetry-details-button) [data-content],
  .toaster [data-sonner-toast]:has(.telemetry-details-button) [data-description],
  .toaster [data-sonner-toast]:has(.telemetry-details-button) .telemetry-description {
    display: contents;
  }

  .toaster [data-sonner-toast]:has(.telemetry-details-button) [data-title] {
    grid-column: 2 / -1;
    grid-row: 1;
  }

  .toaster [data-sonner-toast]:has(.telemetry-details-button) .telemetry-body {
    display: block;
    grid-column: 2 / -1;
    grid-row: 2;
    min-width: 0;
  }

  .toaster [data-sonner-toast]:has(.telemetry-details-button) .telemetry-details-button {
    grid-column: 2;
    grid-row: 3;
    justify-self: start;
    align-self: center;
    margin-inline-start: -8px;
    white-space: normal;
  }

  .toaster [data-sonner-toast]:has(.telemetry-details-button) [data-button] {
    grid-column: 3;
    grid-row: 3;
    align-self: center;
    max-width: min(160px, 45vw);
  }

  .toaster [data-sonner-toast]:has(.telemetry-details-button) [data-cancel]:has(~ [data-action]) {
    grid-row: 4;
  }

  .toaster [data-sonner-toast]:has(.telemetry-details-button):not(:has(.telemetry-body)) .telemetry-details-button,
  .toaster [data-sonner-toast]:has(.telemetry-details-button):not(:has(.telemetry-body)) [data-button] {
    grid-row: 2;
  }

  .toaster
    [data-sonner-toast]:has(.telemetry-details-button):not(:has(.telemetry-body))
    [data-cancel]:has(~ [data-action]) {
    grid-row: 3;
  }

  .toaster [data-sonner-toast]:has(.telemetry-details-button):not(:has([data-button])) .telemetry-details-button {
    grid-column: 2 / -1;
    justify-self: end;
    margin-inline-start: 0;
    margin-inline-end: -8px;
  }

  /* Sonner's expanded/exit hit regions must not enlarge the scrollable card. */
  .toaster [data-sonner-toast]::before,
  .toaster [data-sonner-toast]::after {
    display: none;
  }

  .toaster [data-sonner-toast][data-removed='true'],
  .toaster [data-sonner-toast][data-swipe-out='true'] {
    overflow: hidden;
  }

  .toaster [data-sonner-toast][data-styled='true'] [data-close-button] {
    display: none;
  }

  .toaster [data-sonner-toast][data-visible='false'] {
    visibility: hidden;
  }

  @supports ((backdrop-filter: blur(16px)) or (-webkit-backdrop-filter: blur(16px))) {
    .toaster [data-sonner-toast][data-styled='true'] {
      background: oklch(var(--popover) / 0.88);
      -webkit-backdrop-filter: blur(16px);
      backdrop-filter: blur(16px);
    }
  }
}

@media (max-width: 959px) and (prefers-reduced-transparency: reduce) {
  .toaster [data-sonner-toast][data-styled='true'] {
    background: oklch(var(--popover));
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@media (max-width: 959px) and (prefers-reduced-motion: reduce) {
  .toaster [data-sonner-toast] {
    transition-duration: 0ms;
    animation: none;
  }
}
</style>
