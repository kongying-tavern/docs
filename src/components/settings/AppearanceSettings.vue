<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useThemeTransition } from '@/hooks/useThemeTransition'
import { useSitePreferences } from '~/composables/useSitePreferences'
import {
  isMotionPreference,
  isThemePreference,
  MOTION_OPTION_DEFINITIONS,
  THEME_OPTION_DEFINITIONS,
} from '~/config/settingsOptions'
import {
  DEFAULT_UI_FONT_SIZE,
  MAX_UI_FONT_SIZE,
  MIN_UI_FONT_SIZE,
  normalizeUiFontSize,
} from '~/services/sitePreferences'
import SettingsRow from './SettingsRow.vue'
import SettingsSelect from './SettingsSelect.vue'
import SettingsThemePreview from './SettingsThemePreview.vue'

const { t } = useI18n({ useScope: 'global' })
const { setTheme: transitionTheme } = useThemeTransition()
const {
  theme,
  usePointerCursor,
  motionPreference,
  uiFontSize,
  desktopUi,
} = useSitePreferences()

const themeOptions = computed(() => THEME_OPTION_DEFINITIONS.map(option => ({
  ...option,
  label: t(`settings.appearance.${option.labelKey}`),
})))
const motionOptions = computed(() => MOTION_OPTION_DEFINITIONS.map(option => ({
  ...option,
  label: t(`settings.appearance.${option.labelKey}`),
})))
const fontSizeOptions = [
  { value: MIN_UI_FONT_SIZE, iconSize: 14, labelKey: 'fontSizeSmall' },
  { value: DEFAULT_UI_FONT_SIZE, iconSize: 17, labelKey: 'fontSizeStandard' },
  { value: MAX_UI_FONT_SIZE, iconSize: 20, labelKey: 'fontSizeLarge' },
] as const satisfies ReadonlyArray<{
  value: number
  iconSize: number
  labelKey: 'fontSizeSmall' | 'fontSizeStandard' | 'fontSizeLarge'
}>

function setTheme(value: unknown): void {
  if (!isThemePreference(value))
    return

  void transitionTheme(value)
}

function setMotionPreference(value: unknown): void {
  if (isMotionPreference(value))
    motionPreference.value = value
}

function setUiFontSize(value: unknown): void {
  // ToggleGroup 取消选中会 emit 空串，忽略而不是归一化成最小档
  if (typeof value !== 'string' || value === '')
    return
  const size = Number(value)
  if (Number.isFinite(size))
    uiFontSize.value = normalizeUiFontSize(size)
}
</script>

<template>
  <SettingsRow
    :title="t('settings.appearance.theme')"
    :description="t('settings.appearance.themeDescription')"
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
          class="theme-option p-1.5 rounded-lg bg-card flex-col gap-2 h-26"
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
    :title="t('settings.appearance.pointerCursor')"
    :description="t('settings.appearance.pointerCursorDescription')"
  >
    <Switch
      v-model="usePointerCursor"
      :aria-label="t('settings.appearance.pointerCursor')"
    />
  </SettingsRow>

  <SettingsRow
    :title="t('settings.appearance.motion')"
    :description="t('settings.appearance.motionDescription')"
  >
    <div class="settings-select">
      <SettingsSelect
        :model-value="motionPreference"
        :options="motionOptions"
        v-bind="{ ariaLabel: t('settings.appearance.motion') }"
        @update:model-value="setMotionPreference"
      />
    </div>
  </SettingsRow>

  <SettingsRow
    v-if="desktopUi"
    :title="t('settings.appearance.uiFontSize')"
    :description="t('settings.appearance.uiFontSizeDescription')"
  >
    <ToggleGroup
      type="single"
      variant="outline"
      :spacing="2"
      :model-value="String(uiFontSize)"
      @update:model-value="setUiFontSize"
    >
      <ToggleGroupItem
        v-for="option in fontSizeOptions"
        :key="option.value"
        :value="String(option.value)"
        :aria-label="t(`settings.appearance.${option.labelKey}`)"
        :title="t(`settings.appearance.${option.labelKey}`)"
      >
        <span
          class="i-lucide-case-sensitive"
          :style="{ width: `${option.iconSize}px`, height: `${option.iconSize}px` }"
          aria-hidden="true"
        />
      </ToggleGroupItem>
    </ToggleGroup>
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
  min-width: 0;
  align-items: stretch;
}

.theme-options :deep(.theme-option[data-state='on']) {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 1px var(--vp-c-brand-1);
}

.theme-option-label {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--vp-c-text-1);
  @apply text-caption;
}

.settings-select {
  width: 180px;
}

@media (max-width: 639px) {
  .theme-options-wrap,
  .settings-select {
    width: 100%;
  }
}
</style>
