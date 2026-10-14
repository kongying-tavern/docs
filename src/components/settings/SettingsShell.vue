<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'

defineProps<{ embeddedMobile?: boolean, title: string }>()
const emit = defineEmits<{ close: [] }>()
const { message } = useLocalized()
const { desktopUi } = useSitePreferences()
</script>

<template>
  <template v-if="embeddedMobile">
    <DrawerTitle class="sr-only">
      {{ title }}
    </DrawerTitle>
    <DrawerDescription class="sr-only">
      {{ title }}
    </DrawerDescription>
    <slot />
  </template>
  <Dialog v-else-if="desktopUi" :open="true" @update:open="open => !open && emit('close')">
    <DialogContent :show-close-button="false" class="settings-dialog" overlay-class="settings-dialog-overlay">
      <DialogTitle class="sr-only">
        {{ title }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ title }}
      </DialogDescription>
      <Button class="settings-shell-close" variant="ghost" size="icon" :aria-label="message.settings.close" @click="emit('close')">
        <span class="i-lucide-x icon-btn" aria-hidden="true" />
      </Button>
      <slot />
    </DialogContent>
  </Dialog>
  <Drawer v-else :open="true" @update:open="open => !open && emit('close')">
    <DrawerContent class="settings-drawer">
      <DrawerTitle class="sr-only">
        {{ title }}
      </DrawerTitle>
      <DrawerDescription class="sr-only">
        {{ title }}
      </DrawerDescription>
      <slot />
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
  grid-template-columns: 248px minmax(0, 1fr) !important;
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

<style>
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
  @apply text-2xl;
  letter-spacing: -0.02em;
}

.settings-save-note {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-block-start: auto;
  padding: 10px 8px 0;
  color: var(--vp-c-text-3);
  @apply text-caption;
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
  padding: 16px 72px 16px 28px;
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
  @apply panel-scrollbar;
  min-height: 0;
  overflow-y: auto;
  padding: 28px;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.settings-dialog-content .settings-section + .settings-section {
  margin-block-start: 52px;
}

.settings-dialog-content .async-content-skeleton,
.settings-drawer-detail .async-content-skeleton {
  padding: 0;
}

html[data-reduced-motion='true'] .settings-save-enter-active,
html[data-reduced-motion='true'] .settings-save-leave-active {
  transition: none;
}
</style>

<style>
.settings-shell-close {
  position: absolute;
  z-index: 1;
  top: 16px;
  right: 24px;
}
</style>
