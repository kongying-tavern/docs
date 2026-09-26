<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'
import {
  isMotionPreference,
  isThemePreference,
  MOTION_OPTION_DEFINITIONS,
  THEME_OPTION_DEFINITIONS,
} from '~/config/settingsOptions'
import {
  MAX_UI_FONT_SIZE,
  MIN_UI_FONT_SIZE,
  normalizeUiFontSize,
} from '~/services/sitePreferences'
import SettingsRow from './SettingsRow.vue'
import SettingsSelect from './SettingsSelect.vue'
import SettingsThemePreview from './SettingsThemePreview.vue'

const { message } = useLocalized()
const { isDark } = useData()
const {
  theme,
  usePointerCursor,
  motionPreference,
  uiFontSize,
  desktopUi,
} = useSitePreferences()

const themeOptions = computed(() => THEME_OPTION_DEFINITIONS.map(option => ({
  ...option,
  label: message.value.settings.appearance[option.labelKey],
})))
const motionOptions = computed(() => MOTION_OPTION_DEFINITIONS.map(option => ({
  ...option,
  label: message.value.settings.appearance[option.labelKey],
})))

function setTheme(value: unknown): void {
  if (!isThemePreference(value))
    return

  isDark.value = value === 'auto'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : value === 'dark'
  theme.value = value
}

function setMotionPreference(value: unknown): void {
  if (isMotionPreference(value))
    motionPreference.value = value
}

function setUiFontSize(value: number | undefined): void {
  if (value !== undefined)
    uiFontSize.value = normalizeUiFontSize(value)
}
</script>

<template>
  <SettingsRow
    :title="message.settings.appearance.theme"
    :description="message.settings.appearance.themeDescription"
    align-start
  >
    <div class="theme-options-wrap">
      <ToggleGroup
        type="single"
        variant="outline"
        :spacing="2"
        class="theme-options"
        :model-value="theme"
        @update:model-value="setTheme"
      >
        <ToggleGroupItem
          v-for="option in themeOptions"
          :key="option.value"
          :value="option.value"
          class="theme-option"
          :aria-label="option.label"
        >
          <SettingsThemePreview :theme="option.value" />
          <span class="theme-option-label">
            <span class="icon-btn size-4" :class="option.icon" aria-hidden="true" />
            {{ option.label }}
          </span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  </SettingsRow>

  <SettingsRow
    v-if="desktopUi"
    :title="message.settings.appearance.pointerCursor"
    :description="message.settings.appearance.pointerCursorDescription"
  >
    <Switch
      v-model="usePointerCursor"
      :aria-label="message.settings.appearance.pointerCursor"
    />
  </SettingsRow>

  <SettingsRow
    :title="message.settings.appearance.motion"
    :description="message.settings.appearance.motionDescription"
  >
    <div class="settings-select">
      <SettingsSelect
        :model-value="motionPreference"
        :options="motionOptions"
        :aria-label="message.settings.appearance.motion"
        @update:model-value="setMotionPreference"
      />
    </div>
  </SettingsRow>

  <SettingsRow
    v-if="desktopUi"
    :title="message.settings.appearance.uiFontSize"
    :description="message.settings.appearance.uiFontSizeDescription"
  >
    <div class="font-size-control">
      <NumberField
        :model-value="uiFontSize"
        :min="MIN_UI_FONT_SIZE"
        :max="MAX_UI_FONT_SIZE"
        :step="1"
        class="font-size-field"
        @update:model-value="setUiFontSize"
      >
        <NumberFieldContent>
          <NumberFieldDecrement :aria-label="message.settings.appearance.decreaseUiFontSize" />
          <NumberFieldInput :aria-label="message.settings.appearance.uiFontSize" />
          <NumberFieldIncrement :aria-label="message.settings.appearance.increaseUiFontSize" />
        </NumberFieldContent>
      </NumberField>
      <span aria-hidden="true">px</span>
    </div>
  </SettingsRow>
</template>

<style scoped>
.theme-options-wrap {
  width: min(456px, 100%);
}

.theme-options {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  box-shadow: none;
}

.theme-options :deep(.theme-option) {
  display: flex;
  width: 100%;
  height: 104px !important;
  min-width: 0;
  align-items: stretch;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--vp-c-divider) !important;
  border-radius: 8px !important;
  padding: 6px;
  background: var(--vp-c-bg);
}

.theme-options :deep(.theme-option[data-state='on']) {
  border-color: var(--vp-c-brand-1) !important;
  box-shadow: 0 0 0 1px var(--vp-c-brand-1);
}

.theme-option-label {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--vp-c-text-1);
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
}

.settings-select {
  width: 180px;
}

.font-size-control {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--vp-c-text-2);
  font-size: calc(13px * var(--site-ui-scale));
}

.font-size-field {
  width: 120px;
}

@media (max-width: 639px) {
  .theme-options-wrap,
  .settings-select {
    width: 100%;
  }
}
</style>
