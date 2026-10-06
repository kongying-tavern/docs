<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount } from 'vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'
import {
  DEFAULT_TOAST_DURATION,
  isToastPosition,
  TOAST_DURATION_DEFINITIONS,
  TOAST_POSITION_DEFINITIONS,
} from '~/config/settingsOptions'
import { toast } from '~/services/telemetry/toast'
import SettingsRow from './SettingsRow.vue'
import SettingsSelect from './SettingsSelect.vue'

const { message } = useLocalized()
const { toastPosition, toastDuration } = useSitePreferences()

const positionOptions = computed(() => TOAST_POSITION_DEFINITIONS.map(option => ({
  ...option,
  label: message.value.settings.notifications.positions[option.labelKey],
})))
const durationOptions = computed(() => TOAST_DURATION_DEFINITIONS.map(option => ({
  ...option,
  label: message.value.settings.notifications[option.labelKey],
})))
const durationStep = computed({
  get: () => {
    if (!Number.isFinite(toastDuration.value))
      return durationOptions.value.length - 1
    const index = durationOptions.value.findIndex(option => toastDuration.value <= option.value)
    return index === -1 ? durationOptions.value.length - 2 : index
  },
  set: (step: number) => toastDuration.value = durationOptions.value[step]?.value ?? DEFAULT_TOAST_DURATION,
})

function setDurationStepFromTabs(value: unknown): void {
  const step = Number(value)
  if (Number.isInteger(step) && step >= 0 && step < durationOptions.value.length)
    setDurationStep(step)
}

let previewToastId: string | number | undefined
let previewToastTimer: ReturnType<typeof setTimeout> | undefined

function setToastPosition(value: unknown): void {
  if (isToastPosition(value)) {
    toastPosition.value = value
    void nextTick(previewToast)
  }
}

function setDurationStep(step: number): void {
  durationStep.value = step
  previewDuration()
}

function previewToast(): void {
  if (previewToastId !== undefined)
    toast.dismiss(previewToastId)

  clearTimeout(previewToastTimer)
  previewToastTimer = setTimeout(() => {
    previewToastId = toast.info(message.value.settings.notifications.previewMessage, {
      duration: toastDuration.value,
      position: toastPosition.value,
      closeButton: !Number.isFinite(toastDuration.value),
      report: false,
    })
  }, 210)
}

function previewDuration(): void {
  void nextTick(previewToast)
}

onBeforeUnmount(() => {
  clearTimeout(previewToastTimer)
  if (previewToastId !== undefined)
    toast.dismiss(previewToastId)
})
</script>

<template>
  <SettingsRow
    :title="message.settings.notifications.position"
    :description="message.settings.notifications.positionDescription"
  >
    <div class="settings-select">
      <SettingsSelect
        :model-value="toastPosition"
        :options="positionOptions"
        v-bind="{ ariaLabel: message.settings.notifications.position }"
        @update:model-value="setToastPosition"
      />
    </div>
  </SettingsRow>

  <SettingsRow
    :title="message.settings.notifications.duration"
    :description="message.settings.notifications.durationDescription"
  >
    <Tabs
      :model-value="String(durationStep)"
      class="duration-tabs"
      @update:model-value="setDurationStepFromTabs"
    >
      <TabsList
        class="duration-tabs-list"
        :aria-label="message.settings.notifications.duration"
      >
        <span
          class="duration-tabs-indicator"
          :style="{ '--duration-index': durationStep }"
          aria-hidden="true"
        />
        <TabsTrigger
          v-for="(option, index) in durationOptions"
          :key="option.value"
          :value="String(index)"
          class="duration-tab"
        >
          {{ option.label }}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </SettingsRow>
</template>

<style scoped>
.settings-select {
  width: 180px;
}

.duration-tabs-list {
  position: relative;
  width: 280px;
}

.duration-tabs-list :deep(.duration-tab) {
  position: relative;
  z-index: 1;
  min-width: 0;
  color: var(--vp-c-text-2);
  font-size: calc(12px * var(--site-ui-scale));
}

.duration-tabs-list :deep(.duration-tab[data-state='active']) {
  background: transparent;
  box-shadow: none;
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.duration-tabs-indicator {
  position: absolute;
  inset-block: 3px;
  inset-inline-start: 3px;
  z-index: 0;
  width: calc((100% - 6px) / 4);
  border-radius: 6px;
  background: var(--vp-c-bg);
  box-shadow:
    0 1px 2px rgb(0 0 0 / 12%),
    0 0 0 1px var(--vp-c-divider);
  transform: translateX(calc(var(--duration-index) * 100%));
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

html[data-reduced-motion='true'] .duration-tabs-indicator {
  transition: none;
}

@media (max-width: 639px) {
  .settings-select,
  .duration-tabs-list {
    width: 100%;
  }
}
</style>
