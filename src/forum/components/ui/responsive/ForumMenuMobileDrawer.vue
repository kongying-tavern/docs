<script setup lang="ts">
import type { FORUM } from '../../types'
import { computed, ref, shallowRef } from 'vue'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'
import ForumMenuMobilePanel from './ForumMenuMobilePanel.vue'

const props = defineProps<{
  items: FORUM.TopicDropdownMenu[]
  title: string
}>()

defineSlots<{
  trigger: () => unknown
  menu: () => unknown
}>()

const { message } = useLocalized()

const open = ref(false)

interface MenuPanel {
  title: string
  items: FORUM.TopicDropdownMenu[]
}

const panels = shallowRef<MenuPanel[]>([{ title: props.title, items: props.items }])

const currentPanel = computed(() => panels.value.at(-1) ?? { title: props.title, items: props.items })
const canGoBack = computed(() => panels.value.length > 1)

function handleOpenChange(next: boolean) {
  open.value = next
  if (next)
    panels.value = [{ title: props.title, items: props.items }]
}

function handleNavigate(panel: MenuPanel) {
  panels.value = [...panels.value, panel]
}

function handleGoBack() {
  if (canGoBack.value)
    panels.value = panels.value.slice(0, -1)
}

function handleClose() {
  open.value = false
}
</script>

<template>
  <Drawer :open="open" @update:open="handleOpenChange">
    <DrawerTrigger as-child>
      <slot name="trigger" />
    </DrawerTrigger>
    <DrawerContent class="pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[80dvh] overflow-hidden">
      <DrawerHeader class="text-left shrink-0">
        <DrawerTitle class="flex gap-2 items-center">
          <button
            v-if="canGoBack"
            type="button"
            class="text-[var(--vp-c-text-2)] rounded-full inline-flex shrink-0 h-7 w-7 items-center justify-center hover:bg-[var(--vp-c-default-soft)]"
            :aria-label="message.forum.topic.menu.back"
            @click="handleGoBack"
          >
            <span class="i-lucide-arrow-left size-4" aria-hidden="true" />
          </button>
          <span class="truncate">{{ currentPanel.title }}</span>
        </DrawerTitle>
        <DrawerDescription class="sr-only">
          {{ currentPanel.title }}
        </DrawerDescription>
      </DrawerHeader>
      <div class="px-4 pb-2 overscroll-contain flex-1 min-h-0 overflow-y-auto">
        <Transition name="forum-menu-panel" mode="out-in">
          <div :key="currentPanel.title">
            <slot v-if="!canGoBack" name="menu" />
            <ForumMenuMobilePanel
              :items="currentPanel.items"
              @navigate="handleNavigate"
              @close="handleClose"
            />
          </div>
        </Transition>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<style scoped>
.forum-menu-panel-enter-active,
.forum-menu-panel-leave-active {
  transition: opacity 120ms ease;
}

.forum-menu-panel-enter-from,
.forum-menu-panel-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .forum-menu-panel-enter-active,
  .forum-menu-panel-leave-active {
    transition: none;
  }
}
</style>
