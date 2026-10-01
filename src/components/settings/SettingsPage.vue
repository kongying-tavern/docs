<script setup lang="ts">
import type { SettingsSectionId } from '~/composables/useSettingsNavigation'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'
import { useSettingsNavigation } from '~/composables/useSettingsNavigation'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumTranslationPreferences } from '~/forum/composables/data/useForumTranslationPreferences'
import { useForumShortcutPreferences } from '~/forum/composables/state/useForumShortcutPreferences'
import { isBrowserTranslationSupported } from '~/forum/services/browserTranslation'
import { consumeSettingsReturnUrl } from '~/services/settingsNavigation'
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
}>()

const { message } = useLocalized()
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
const settingsNav = useTemplateRef<InstanceType<typeof SettingsMenu> | null>('settingsNav')
const dialogTitle = computed(() => activeSection.value === 'labels'
  ? message.value.settings.groups.application
  : activeSection.value === 'shortcuts' ? message.value.settings.shortcuts.title : message.value.settings.title)
const drawerTitle = computed(() => {
  if (!sectionSelected.value)
    return message.value.settings.title
  return activeSection.value === 'labels'
    ? message.value.settings.groups.application
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

/** 内容滚动联动：滚动位置跨过区段边界时同步 active（labels 面板不参与联动） */
function handleScrollActive(section: string): void {
  if (section !== activeSection.value && activeSection.value !== 'labels' && activeSection.value !== 'shortcuts')
    selectSection(section)
}

function handleDialogOpen(open: boolean): void {
  if (!open)
    closeSettings()
}

async function focusActiveNavigation(event: Event): Promise<void> {
  event.preventDefault()
  await nextTick()
  document
    .querySelector<HTMLElement>('.settings-dialog .settings-navigation-item.active')
    ?.focus()
}

onMounted(async () => {
  await nextTick()
  settingsNav.value?.scrollTo(activeSection.value, 'auto')
})

onBeforeUnmount(() => {
  clearTimeout(saveStatusTimer)
  if (props.dialogOnly)
    consumeSettingsReturnUrl()
})
</script>

<template>
  <SettingsMobileView
    v-if="embeddedMobile"
    :website-sections="websiteSections"
    :application-sections="applicationSections"
    :active-section="activeSection"
    :active-item="activeItem"
    :section-selected="sectionSelected"
    :title="drawerTitle"
    :save-status-visible="saveStatusVisible"
    :label-management-enabled="labelManagementEnabled"
    :translation-supported="translationSupported"
    show-root-back
    @select="changeSection"
    @show-section-list="showSectionList"
    @leave="emit('leave')"
    @close="emit('close')"
  />

  <Dialog v-else-if="desktopUi" :open="true" @update:open="handleDialogOpen">
    <DialogContent
      :show-close-button="false"
      class="settings-dialog"
      overlay-class="settings-dialog-overlay"
      @open-auto-focus="focusActiveNavigation"
    >
      <aside class="settings-dialog-sidebar">
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
              {{ message.settings.autoSave }}
            </p>
          </Transition>
        </SettingsMenu>
      </aside>

      <section class="settings-dialog-main">
        <header class="settings-dialog-panel-header">
          <div class="settings-dialog-panel-title">
            <div>
              <DialogTitle class="settings-dialog-title">
                {{ dialogTitle }}
              </DialogTitle>
              <DialogDescription class="sr-only">
                {{ dialogTitle }}
              </DialogDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="settings-close-button"
            :aria-label="message.settings.close"
            @click="closeSettings"
          >
            <span class="i-lucide-x icon-btn" aria-hidden="true" />
          </Button>
        </header>

        <div class="settings-dialog-content">
          <SettingsPanel
            :active-section="activeSection"
            :show-language="translationSupported"
            :show-label-admin="labelManagementEnabled"
            :show-all="activeSection !== 'labels' && activeSection !== 'shortcuts'"
          />
        </div>
      </section>
    </DialogContent>
  </Dialog>

  <Drawer v-else :open="true" @update:open="handleDialogOpen">
    <DrawerContent class="settings-drawer">
      <SettingsMobileView
        :website-sections="websiteSections"
        :application-sections="applicationSections"
        :active-section="activeSection"
        :active-item="activeItem"
        :section-selected="sectionSelected"
        :title="drawerTitle"
        :save-status-visible="saveStatusVisible"
        :hash-prefix="dialogOnly ? 'settings' : undefined"
        :label-management-enabled="labelManagementEnabled"
        :translation-supported="translationSupported"
        @select="changeSection"
        @show-section-list="showSectionList"
        @close="closeSettings"
      />
    </DrawerContent>
  </Drawer>
</template>

<style>
.settings-dialog-overlay {
  background: rgb(16 24 20 / 48%) !important;
  backdrop-filter: blur(2px);
}

.settings-dialog {
  display: grid !important;
  width: min(1100px, calc(100vw - 64px)) !important;
  max-width: none !important;
  height: min(760px, calc(100dvh - 64px));
  grid-template-columns: 248px minmax(0, 1fr);
  gap: 0 !important;
  overflow: hidden;
  border-color: var(--vp-c-divider) !important;
  border-radius: 14px !important;
  padding: 0 !important;
  background: var(--vp-c-bg) !important;
  box-shadow: var(--vp-shadow-3) !important;
}

.settings-drawer {
  width: min(100%, 760px) !important;
  max-height: calc(100dvh - 24px) !important;
  margin-inline: auto;
  overflow: hidden;
  border-color: var(--vp-c-divider) !important;
  background: var(--vp-c-bg) !important;
  box-shadow: var(--vp-shadow-3) !important;
}

[data-slot='drawer-overlay']:has(+ .settings-drawer) {
  background: rgb(16 24 20 / 48%);
  backdrop-filter: blur(2px);
}
</style>

<style scoped>
.settings-dialog-sidebar {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 20px;
  border-inline-end: 1px solid var(--vp-c-divider);
  padding: 28px 20px 20px;
  background: var(--vp-c-bg-alt);
}

.settings-dialog-menu {
  height: 100%;
}

.settings-dialog-title {
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-title);
  font-size: calc(24px * var(--site-ui-scale));
  line-height: calc(32px * var(--site-ui-scale));
  letter-spacing: -0.02em;
}

.settings-save-note {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-block-start: auto;
  padding: 10px 8px 0;
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
}

.settings-save-enter-active,
.settings-save-leave-active {
  transition:
    opacity 160ms ease-out,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.settings-save-enter-from,
.settings-save-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.settings-dialog-main {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
}

.settings-dialog-panel-header {
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-block-end: 1px solid var(--vp-c-divider);
  padding: 16px 24px 16px 28px;
}

.settings-dialog-panel-title {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 12px;
}

.settings-close-button {
  flex: 0 0 auto;
  border-radius: 8px;
  color: var(--vp-c-text-2);
}

.settings-dialog-content {
  --settings-scrollbar: color-mix(in srgb, var(--vp-c-text-3) 42%, transparent);
  --settings-scrollbar-hover: color-mix(in srgb, var(--vp-c-text-2) 64%, transparent);

  min-height: 0;
  overflow-y: auto;
  padding: 28px;
  overscroll-behavior: contain;
  scrollbar-color: var(--settings-scrollbar) transparent;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
}

.settings-dialog-content::-webkit-scrollbar {
  width: 10px;
}

.settings-dialog-content::-webkit-scrollbar-track {
  background: transparent;
}

.settings-dialog-content::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: var(--settings-scrollbar);
  background-clip: padding-box;
}

.settings-dialog-content::-webkit-scrollbar-thumb:hover {
  background: var(--settings-scrollbar-hover);
  background-clip: padding-box;
}

.settings-dialog-content :deep(.settings-section + .settings-section) {
  margin-block-start: 52px;
}

html[data-reduced-motion='true'] .settings-save-enter-active,
html[data-reduced-motion='true'] .settings-save-leave-active {
  transition: none;
}
</style>
