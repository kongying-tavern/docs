<script setup lang="ts">
import type { SettingsSectionId } from '~/composables/useSettingsNavigation'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsNavigation } from '~/composables/useSettingsNavigation'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { SETTINGS_SECTION_DEFINITIONS } from '~/config/settingsOptions'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumTranslationPreferences } from '~/forum/composables/data/useForumTranslationPreferences'
import { useForumShortcutPreferences } from '~/forum/composables/state/useForumShortcutPreferences'
import { isBrowserTranslationSupported } from '~/forum/services/browserTranslation'
import { reportingEnabled } from '~/services/telemetry'
import SettingsMenu from './SettingsMenu.vue'
import SettingsMobileView from './SettingsMobileView.vue'
import SettingsPanel from './SettingsPanel.vue'

const props = withDefaults(defineProps<{
  dialogOnly?: boolean
  embeddedMobile?: boolean
}>(), {
  dialogOnly: false,
  embeddedMobile: false,
})

const emit = defineEmits<{
  close: []
  leave: []
  title: [title: string]
}>()

const { t } = useI18n({ useScope: 'global' })
const { hasAnyPermissions } = useRuleChecks()
const {
  theme,
  usePointerCursor,
  motionPreference,
  uiFontSize,
  desktopUi,
  toastPosition,
  toastDuration,
} = useSitePreferences()
const canManageLabels = hasAnyPermissions('manage_feedback')
const labelManagementEnabled = computed(() => canManageLabels.value)
const { autoTranslateEnabled, excludedSourceLanguages } = useForumTranslationPreferences()
const { preferences: shortcutPreferences } = useForumShortcutPreferences()
const translationSupported = ref(typeof window !== 'undefined' && isBrowserTranslationSupported())
const saveStatusVisible = ref(false)
let saveStatusTimer: ReturnType<typeof setTimeout> | undefined

const {
  sections,
  activeSection,
  activeItem,
  sectionSelected,
  selectSection,
  showSectionList,
  closeSettings,
} = useSettingsNavigation(translationSupported, {
  hashPrefix: props.dialogOnly && !props.embeddedMobile ? 'settings' : undefined,
  labelManagementEnabled,
  updateHash: !props.embeddedMobile,
})
const websiteSections = computed(() => sections.value.filter(section => section.group === 'website'))
const websiteSectionIds = computed(() => websiteSections.value.map(section => section.id))
const applicationSections = computed(() => sections.value.filter(section => section.group === 'application'))
const standalonePanel = computed(() => SETTINGS_SECTION_DEFINITIONS.find(section => section.id === activeSection.value)?.standalone ?? false)
const settingsNav = useTemplateRef<InstanceType<typeof SettingsMenu> | null>('settingsNav')
const dialogTitle = computed(() => activeSection.value === 'labels'
  ? t('settings.groups.application')
  : activeSection.value === 'profile'
    ? t('settings.profile.title')
    : activeSection.value === 'shortcuts' || activeSection.value === 'experiments' ? activeItem.value.label : t('settings.title'))
const drawerTitle = computed(() => {
  if (!sectionSelected.value)
    return t('settings.title')
  return activeSection.value === 'labels'
    ? t('settings.groups.application')
    : activeItem.value.label
})

function showSaveStatus(): void {
  saveStatusVisible.value = true
  clearTimeout(saveStatusTimer)
  saveStatusTimer = setTimeout(() => {
    saveStatusVisible.value = false
  }, 1800)
}

watch([
  theme,
  usePointerCursor,
  motionPreference,
  uiFontSize,
  toastPosition,
  toastDuration,
  autoTranslateEnabled,
  () => excludedSourceLanguages.value.join(','),
  reportingEnabled,
  shortcutPreferences,
], showSaveStatus, { flush: 'post' })

watch(desktopUi, (desktop) => {
  if (!desktop && activeSection.value === 'shortcuts')
    selectSection('appearance')
})

function changeSection(section: SettingsSectionId): void {
  selectSection(section)
  void nextTick().then(() => settingsNav.value?.scrollTo(section))
}

/** 独立面板不参与内容滚动联动。 */
function handleScrollActive(section: string): void {
  const selected = sections.value.find(item => item.id === section)
  if (selected && section !== activeSection.value && !standalonePanel.value)
    selectSection(selected.id)
}

watch(() => desktopUi.value ? dialogTitle.value : drawerTitle.value, title => emit('title', title), { immediate: true })

onMounted(async () => {
  await nextTick()
  settingsNav.value?.scrollTo(activeSection.value, 'auto')
  const dialog = document.querySelector<HTMLElement>(desktopUi.value ? '.settings-dialog' : '.settings-drawer')
  if (dialog && !dialog.contains(document.activeElement))
    dialog.querySelector<HTMLElement>('.settings-navigation-item.active, button')?.focus()
})

onBeforeUnmount(() => {
  clearTimeout(saveStatusTimer)
})
</script>

<template>
  <SettingsMobileView
    v-if="embeddedMobile || !desktopUi"
    :website-sections="websiteSections"
    :application-sections="applicationSections"
    :active-section="activeSection"
    :active-item="activeItem"
    :section-selected="sectionSelected"
    :title="drawerTitle"
    :save-status-visible="saveStatusVisible"
    :label-management-enabled="labelManagementEnabled"
    :translation-supported="translationSupported"
    within-shell
    :show-root-back="embeddedMobile"
    :hash-prefix="dialogOnly && !embeddedMobile ? 'settings' : undefined"
    @select="changeSection"
    @show-section-list="showSectionList"
    @leave="emit('leave')"
    @close="embeddedMobile ? emit('close') : closeSettings()"
  />

  <aside v-else class="settings-dialog-sidebar">
    <SettingsMenu
      ref="settingsNav"
      class="settings-dialog-menu"
      :website-sections="websiteSections"
      :application-sections="applicationSections"
      :active-section="activeSection"
      :hash-prefix="dialogOnly ? 'settings' : undefined"
      :section-ids="websiteSectionIds"
      scroller=".settings-dialog-content"
      @select="changeSection"
      @update:active="handleScrollActive"
    >
      <Transition name="settings-save">
        <p v-if="saveStatusVisible" class="settings-save-note" role="status">
          <span class="i-lucide-cloud-check icon-btn" aria-hidden="true" />
          {{ t('settings.autoSave') }}
        </p>
      </Transition>
    </SettingsMenu>
  </aside>

  <section v-if="!embeddedMobile && desktopUi" class="settings-dialog-main">
    <header class="settings-dialog-panel-header">
      <div class="settings-dialog-panel-title">
        <div>
          <h2 class="settings-dialog-title">
            {{ dialogTitle }}
          </h2>
        </div>
      </div>
    </header>

    <div class="settings-dialog-content">
      <SettingsPanel
        :active-section="activeSection"
        :show-language="translationSupported"
        :show-label-admin="labelManagementEnabled"
        :show-all="!standalonePanel"
      />
    </div>
  </section>
</template>
