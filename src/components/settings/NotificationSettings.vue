<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount } from 'vue'
import { Slider } from '@/components/ui/slider'
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
const durationSliderValue = computed({
  get: () => [durationStep.value],
  set: (value: number[]) => durationStep.value = value[0] ?? 1,
})

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
        :aria-label="message.settings.notifications.position"
        @update:model-value="setToastPosition"
      />
    </div>
  </SettingsRow>

  <SettingsRow
    :title="message.settings.notifications.duration"
    :description="message.settings.notifications.durationDescription"
  >
    <div class="duration-control">
      <Slider
        v-model="durationSliderValue"
        :min="0"
        :max="durationOptions.length - 1"
        :step="1"
        :aria-label="message.settings.notifications.duration"
        :aria-valuetext="durationOptions[durationStep]?.label"
        @value-commit="previewDuration"
      />
      <div class="duration-labels">
        <button
          v-for="(option, index) in durationOptions"
          :key="option.value"
          type="button"
          :class="{ active: durationStep === index }"
          @click="setDurationStep(index)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </SettingsRow>
</template>

<style scoped>
.settings-select {
  width: 180px;
}

.duration-control {
  width: 280px;
}

.duration-labels {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-block-start: 6px;
}

.duration-labels button {
  padding-block: 2px;
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
  text-align: center;
}

.duration-labels button:first-child {
  text-align: start;
}

.duration-labels button:last-child {
  text-align: end;
}

.duration-labels button.active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

@media (max-width: 639px) {
  .settings-select,
  .duration-control {
    width: 100%;
  }
}
</style>
