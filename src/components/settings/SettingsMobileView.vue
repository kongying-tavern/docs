<script setup lang="ts">
import type { SettingsNavigationItem, SettingsSectionId } from '~/composables/useSettingsNavigation'
import { Button } from '@/components/ui/button'
import { DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'
import SettingsMenu from './SettingsMenu.vue'
import SettingsPanel from './SettingsPanel.vue'

defineProps<{
  websiteSections: SettingsNavigationItem[]
  applicationSections: SettingsNavigationItem[]
  activeSection: SettingsSectionId
  activeItem: SettingsNavigationItem
  sectionSelected: boolean
  title: string
  saveStatusVisible: boolean
  hashPrefix?: string
  labelManagementEnabled: boolean
  translationSupported: boolean
  showRootBack?: boolean
}>()

const emit = defineEmits<{
  select: [section: SettingsSectionId]
  showSectionList: []
  leave: []
  close: []
}>()

const { message } = useLocalized()
</script>

<template>
  <div class="settings-mobile-view">
    <header class="settings-drawer-header">
      <div class="settings-drawer-title-row">
        <Button
          v-if="sectionSelected"
          type="button"
          variant="ghost"
          size="icon"
          class="settings-back-button"
          :aria-label="message.settings.back"
          @click="emit('showSectionList')"
        >
          <span class="i-lucide-arrow-left icon-btn" aria-hidden="true" />
        </Button>
        <Button
          v-else-if="showRootBack"
          type="button"
          variant="ghost"
          size="icon"
          class="settings-back-button"
          :aria-label="message.settings.back"
          @click="emit('leave')"
        >
          <span class="i-lucide-arrow-left icon-btn" aria-hidden="true" />
        </Button>
        <Button
          v-else
          type="button"
          variant="ghost"
          size="icon"
          class="settings-close-button"
          :aria-label="message.settings.close"
          @click="emit('close')"
        >
          <span class="i-lucide-x icon-btn" aria-hidden="true" />
        </Button>

        <Transition name="settings-drawer-title" mode="out-in">
          <DrawerTitle :key="sectionSelected ? activeSection : 'root'" class="settings-drawer-title">
            {{ title }}
          </DrawerTitle>
        </Transition>
        <span class="settings-drawer-button-spacer" aria-hidden="true" />
      </div>
      <DrawerDescription class="sr-only">
        {{ sectionSelected ? activeItem.label : message.settings.groups.website }}
      </DrawerDescription>
      <Transition name="settings-save">
        <p v-if="saveStatusVisible" class="settings-mobile-save" role="status">
          <span class="i-lucide-cloud-check icon-btn" aria-hidden="true" />
          {{ message.settings.autoSave }}
        </p>
      </Transition>
    </header>

    <div class="settings-drawer-body">
      <Transition name="settings-drawer-panel" mode="out-in">
        <SettingsMenu
          v-if="!sectionSelected"
          key="root"
          :website-sections="websiteSections"
          :application-sections="applicationSections"
          :active-section="activeSection"
          :hash-prefix="hashPrefix"
          drilldown
          @select="emit('select', $event)"
        />
        <div v-else :key="activeSection" class="settings-drawer-detail">
          <header v-if="activeSection === 'labels'" class="settings-drawer-section-intro">
            <h2>{{ activeItem.label }}</h2>
          </header>
          <SettingsPanel
            :active-section="activeSection"
            :show-language="translationSupported"
            :show-label-admin="labelManagementEnabled"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.settings-mobile-view {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
}

.settings-drawer-header {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 4px;
  border-block-end: 1px solid var(--vp-c-divider);
  padding: 12px 16px;
  text-align: start;
}

.settings-drawer-title-row {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 4px;
}

.settings-drawer-title {
  min-width: 0;
  flex: 1;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-title);
  font-size: calc(20px * var(--site-ui-scale));
  line-height: calc(28px * var(--site-ui-scale));
  letter-spacing: -0.02em;
}

.settings-close-button,
.settings-back-button {
  flex: 0 0 auto;
  border-radius: 8px;
  color: var(--vp-c-text-2);
}

.settings-back-button,
.settings-close-button,
.settings-drawer-button-spacer {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
}

.settings-drawer-body {
  --settings-scrollbar: color-mix(in srgb, var(--vp-c-text-3) 42%, transparent);

  min-height: 0;
  flex: 0 1 auto;
  overflow-y: auto;
  padding: 16px 16px max(24px, env(safe-area-inset-bottom));
  overscroll-behavior: contain;
  scrollbar-color: var(--settings-scrollbar) transparent;
  scrollbar-width: thin;
}

.settings-drawer-body::-webkit-scrollbar {
  width: 8px;
}

.settings-drawer-body::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: var(--settings-scrollbar);
  background-clip: padding-box;
}

.settings-drawer-detail {
  min-width: 0;
}

.settings-drawer-section-intro {
  margin-block-end: 20px;
  padding-inline: 2px;
}

.settings-drawer-section-intro h2 {
  color: var(--vp-c-text-1);
  font-size: calc(18px * var(--site-ui-scale));
  font-weight: 600;
  line-height: calc(26px * var(--site-ui-scale));
}

.settings-mobile-save {
  display: flex;
  min-height: 28px;
  align-items: center;
  gap: 7px;
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
}

.settings-save-enter-active,
.settings-save-leave-active,
.settings-drawer-title-enter-active,
.settings-drawer-title-leave-active,
.settings-drawer-panel-enter-active,
.settings-drawer-panel-leave-active {
  transition:
    opacity 140ms ease-out,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.settings-save-enter-from,
.settings-save-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.settings-drawer-title-enter-from,
.settings-drawer-panel-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.settings-drawer-title-leave-to,
.settings-drawer-panel-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

html[data-reduced-motion='true'] .settings-save-enter-active,
html[data-reduced-motion='true'] .settings-save-leave-active,
html[data-reduced-motion='true'] .settings-drawer-title-enter-active,
html[data-reduced-motion='true'] .settings-drawer-title-leave-active,
html[data-reduced-motion='true'] .settings-drawer-panel-enter-active,
html[data-reduced-motion='true'] .settings-drawer-panel-leave-active {
  transition: none;
}

@media (max-width: 479px) {
  .settings-drawer-header,
  .settings-drawer-body {
    padding-inline: 12px;
  }
}
</style>
