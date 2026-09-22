<script setup lang="ts">
import type { ThemePreference, ToastPosition } from '~/composables/useSitePreferences'
import { useData, withBase } from 'vitepress'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import ForumTranslationSettings from '~/components/forum/topic/ForumTranslationSettings.vue'
import TelemetrySettings from '~/components/telemetry/TelemetrySettings.vue'
import {
  DEFAULT_TOAST_DURATION,
  TOAST_DURATION_VALUES,
  useSitePreferences,
} from '~/composables/useSitePreferences'
import { isBrowserTranslationSupported } from '~/services/forum/browserTranslation'
import { toast } from '~/services/telemetry/toast'
import SettingsRow from './SettingsRow.vue'
import SettingsSection from './SettingsSection.vue'

const { isDark, localeIndex } = useData()
const { message } = useLocalized()
const { theme, toastPosition, toastDuration, toastPositions } = useSitePreferences()
const translationSupported = ref(false)

onMounted(() => {
  translationSupported.value = isBrowserTranslationSupported()
})

const themeOptions = computed(() => [
  { value: 'light' as const, label: message.value.settings.appearance.light, icon: 'i-lucide-sun' },
  { value: 'dark' as const, label: message.value.settings.appearance.dark, icon: 'i-lucide-moon' },
  { value: 'auto' as const, label: message.value.settings.appearance.auto, icon: 'i-lucide-monitor' },
])
const positionLabels = computed<Record<ToastPosition, string>>(() => ({
  'top-left': message.value.settings.notifications.positions.topLeft,
  'top-center': message.value.settings.notifications.positions.topCenter,
  'top-right': message.value.settings.notifications.positions.topRight,
  'bottom-left': message.value.settings.notifications.positions.bottomLeft,
  'bottom-center': message.value.settings.notifications.positions.bottomCenter,
  'bottom-right': message.value.settings.notifications.positions.bottomRight,
}))
const positionIcons: Record<ToastPosition, string> = {
  'top-left': 'i-lucide-move-up-left',
  'top-center': 'i-lucide-arrow-up-to-line',
  'top-right': 'i-lucide-move-up-right',
  'bottom-left': 'i-lucide-move-down-left',
  'bottom-center': 'i-lucide-arrow-down-to-line',
  'bottom-right': 'i-lucide-move-down-right',
}
const durationLabels = computed(() => [
  message.value.settings.notifications.fast,
  message.value.settings.notifications.default,
  message.value.settings.notifications.slow,
  message.value.settings.notifications.persistent,
])
const durationOptions = computed(() =>
  TOAST_DURATION_VALUES.map((value, index) => ({ value, label: durationLabels.value[index] })),
)
const durationStep = computed({
  get: () => {
    if (!Number.isFinite(toastDuration.value))
      return TOAST_DURATION_VALUES.length - 1
    const index = TOAST_DURATION_VALUES.findIndex(value => toastDuration.value <= value)
    return index === -1 ? TOAST_DURATION_VALUES.length - 2 : index
  },
  set: (step: string | number) => toastDuration.value = durationOptions.value[Number(step)]?.value ?? DEFAULT_TOAST_DURATION,
})
const privacyHref = computed(() => withBase(`${getLangPath(localeIndex.value)}privacy`))
let previewToastId: string | number | undefined
let previewToastTimer: ReturnType<typeof setTimeout> | undefined

function setTheme(value: unknown): void {
  if (value !== 'light' && value !== 'dark' && value !== 'auto')
    return
  const next = value as ThemePreference
  isDark.value = next === 'auto'
    ? matchMedia('(prefers-color-scheme: dark)').matches
    : next === 'dark'
  theme.value = next
}

function setToastPosition(value: unknown): void {
  if (toastPositions.includes(value as ToastPosition)) {
    toastPosition.value = value as ToastPosition
    void nextTick(previewToast)
  }
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
  <main class="settings-page">
    <header class="settings-page-header">
      <h1>{{ message.settings.title }}</h1>
      <p>{{ message.settings.description }}</p>
    </header>

    <div class="settings-content">
      <SettingsSection
        id="appearance"
        :title="message.settings.appearance.title"
        :description="message.settings.appearance.description"
      >
        <SettingsRow
          :title="message.settings.appearance.theme"
          :description="message.settings.appearance.themeDescription"
          align-start
        >
          <div class="theme-options-wrap">
            <ToggleGroup
              type="single"
              variant="outline"
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
                <span class="theme-preview" :class="`theme-preview-${option.value}`" aria-hidden="true">
                  <template v-if="option.value === 'auto'">
                    <span class="theme-preview-half theme-preview-half-light">
                      <span class="theme-preview-sidebar" />
                      <span class="theme-preview-content"><span /><span /></span>
                    </span>
                    <span class="theme-preview-half theme-preview-half-dark">
                      <span class="theme-preview-sidebar" />
                      <span class="theme-preview-content"><span /><span /></span>
                    </span>
                  </template>
                  <template v-else>
                    <span class="theme-preview-sidebar" />
                    <span class="theme-preview-content">
                      <span />
                      <span />
                    </span>
                  </template>
                </span>
                <span class="theme-option-label">
                  <span class="icon-btn size-4" :class="option.icon" aria-hidden="true" />
                  {{ option.label }}
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        id="notifications"
        :title="message.settings.notifications.title"
        :description="message.settings.notifications.description"
      >
        <SettingsRow
          :title="message.settings.notifications.position"
          :description="message.settings.notifications.positionDescription"
        >
          <div class="settings-select">
            <Select :model-value="toastPosition" @update:model-value="setToastPosition">
              <SelectTrigger class="w-full">
                <span class="position-option-icon" :class="positionIcons[toastPosition]" aria-hidden="true" />
                <SelectValue>{{ positionLabels[toastPosition] }}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="position in toastPositions" :key="position" :value="position">
                  <template #prefix>
                    <span class="position-option-icon" :class="positionIcons[position]" aria-hidden="true" />
                  </template>
                  {{ positionLabels[position] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SettingsRow>

        <SettingsRow
          :title="message.settings.notifications.duration"
          :description="message.settings.notifications.durationDescription"
        >
          <div class="duration-control">
            <input
              v-model="durationStep"
              type="range"
              min="0"
              :max="TOAST_DURATION_VALUES.length - 1"
              step="1"
              class="duration-slider"
              :aria-label="message.settings.notifications.duration"
              :aria-valuetext="durationOptions[durationStep]?.label"
              @change="previewDuration"
            >
            <div class="duration-labels">
              <button
                v-for="(option, index) in durationOptions"
                :key="option.label"
                type="button"
                :class="{ active: durationStep === index }"
                @click="durationStep = index; previewDuration()"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        v-if="translationSupported"
        id="language"
        :title="message.settings.language.title"
        :description="message.settings.language.description"
      >
        <ForumTranslationSettings />
      </SettingsSection>

      <SettingsSection
        id="privacy"
        :title="message.settings.privacy.title"
        :description="message.settings.privacy.description"
      >
        <TelemetrySettings :privacy-href="privacyHref" />
      </SettingsSection>
    </div>
  </main>
</template>

<style scoped>
.settings-page {
  width: min(920px, 100%);
  margin-inline: auto;
  padding: 48px 32px 96px;
}

.settings-page-header {
  padding-block-end: 28px;
  border-block-end: 1px solid var(--vp-c-divider);
}

.settings-page-header h1 {
  color: var(--vp-c-text-1);
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
  letter-spacing: -0.02em;
}

.settings-page-header p {
  max-width: 640px;
  margin-block-start: 8px;
  color: var(--vp-c-text-2);
  font-size: 15px;
  line-height: 24px;
}

.settings-content {
  display: grid;
  gap: 56px;
  padding-block-start: 36px;
}

.theme-options-wrap {
  width: min(456px, 100%);
}

.theme-options-wrap :deep(.theme-options) {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  box-shadow: none;
}

.theme-options-wrap :deep(.theme-option) {
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

.theme-options-wrap :deep(.theme-option[data-state='on']) {
  border-color: var(--vp-c-brand-1) !important;
  box-shadow: 0 0 0 1px var(--vp-c-brand-1);
}

.theme-preview {
  display: grid;
  height: 58px;
  grid-template-columns: 28% 1fr;
  border: 1px solid var(--vp-c-divider);
  border-radius: 5px;
  overflow: hidden;
}

.theme-preview-light {
  background: #fff;
}

.theme-preview-light .theme-preview-sidebar {
  background: #f3f4f6;
}

.theme-preview-dark {
  border-color: #3f3f46;
  background: #18181b;
}

.theme-preview-dark .theme-preview-sidebar {
  background: #27272a;
}

.theme-preview-auto {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  background: transparent;
}

.theme-preview-half {
  display: grid;
  min-width: 0;
  grid-template-columns: 28% 1fr;
}

.theme-preview-half-dark {
  border-inline-start: 1px solid #3f3f46;
  background: #18181b;
}

.theme-preview-half-light {
  background: #fff;
}

.theme-preview-half-light .theme-preview-sidebar {
  background: #f3f4f6;
}

.theme-preview-half-dark .theme-preview-sidebar {
  background: #27272a;
}

.theme-preview-half .theme-preview-content {
  gap: 5px;
  padding: 5px;
}

.theme-preview-half .theme-preview-content span {
  height: 4px;
}

.theme-preview-half-dark .theme-preview-content span {
  background: #71717a;
}

.theme-preview-content {
  display: grid;
  align-content: center;
  gap: 7px;
  padding: 9px;
}

.theme-preview-content span {
  display: block;
  height: 5px;
  border-radius: 3px;
  background: #a1a1aa;
}

.theme-preview-content span:last-child {
  width: 68%;
}

.theme-option-label {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--vp-c-text-1);
  font-size: 12px;
  line-height: 18px;
}

.settings-select {
  width: 180px;
}

.position-option-icon {
  color: var(--vp-c-text-2);
  font-size: 16px;
}

.duration-control {
  width: 280px;
}

.duration-slider {
  width: 100%;
  height: 20px;
  accent-color: var(--vp-c-brand-1);
  cursor: pointer;
}

.duration-labels {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-block-start: 3px;
}

.duration-labels button {
  padding-block: 2px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 18px;
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
  .settings-page {
    padding: 32px 16px 72px;
  }

  .settings-page-header h1 {
    font-size: 28px;
    line-height: 36px;
  }

  .settings-content {
    gap: 44px;
    padding-block-start: 28px;
  }

  .theme-options-wrap,
  .settings-select {
    width: 100%;
  }

  .duration-control {
    width: 100%;
  }
}
</style>
