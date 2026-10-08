<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'

const props = defineProps<{
  title: string
  description: string
  backLabel: string
  resetLabel: string
  submitLabel: string
  sections: readonly {
    id: string
    icon: string
    label: string
    selected: string
    options: readonly { id: string, label: string, icon?: string }[]
  }[]
}>()
const emit = defineEmits<{
  select: [section: string, value: string]
  reset: []
  submit: []
}>()
const open = defineModel<boolean>('open', { default: false })
const section = ref<string | null>(null)
const lastSection = ref<string | null>(null)
const rootPanel = useTemplateRef<HTMLElement>('rootPanel')
const detailPanel = useTemplateRef<HTMLElement>('detailPanel')
const body = useTemplateRef<HTMLElement>('body')
const panelHeight = ref(0)
const sections = computed(() => props.sections.map(item => ({
  ...item,
  value: item.options.find(option => option.id === item.selected)?.label ?? '',
})))
const detail = computed(() => props.sections.find(item => item.id === (section.value ?? lastSection.value)))
const options = computed(() => detail.value?.options ?? [])
const selected = computed(() => detail.value?.selected ?? '')
const title = computed(() => props.sections.find(item => item.id === section.value)?.label ?? props.title)

// Keep the outgoing step mounted until the drawer's closing animation finishes.
watch(open, (isOpen) => {
  if (isOpen)
    section.value = null
})

function measurePanel(): void {
  const panel = section.value ? detailPanel.value : rootPanel.value
  if (open.value && panel)
    panelHeight.value = panel.scrollHeight
}

useResizeObserver([rootPanel, detailPanel], measurePanel)

watch([open, section], async ([isOpen, current], [wasOpen, previous]) => {
  if (!open.value)
    return
  await nextTick()
  if (!isOpen || section.value !== current)
    return
  measurePanel()
  if (!wasOpen || current === previous)
    return
  if (body.value)
    body.value.scrollTop = 0
  const target = current
    ? detailPanel.value?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ?? detailPanel.value?.querySelector<HTMLButtonElement>('button')
    : [...rootPanel.value?.querySelectorAll<HTMLButtonElement>('button') ?? []].find(button => button.dataset.section === previous)
  target?.focus({ preventScroll: true })
}, { flush: 'post' })

function enterSection(value: string): void {
  lastSection.value = value
  section.value = value
}

function handlePanelKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowLeft' && section.value) {
    event.preventDefault()
    section.value = null
    return
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
    return
  const panel = section.value ? detailPanel.value : rootPanel.value
  const buttons = [...panel?.querySelectorAll<HTMLButtonElement>('button') ?? []]
  const index = buttons.indexOf(event.target as HTMLButtonElement)
  if (index < 0)
    return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
  buttons[next]?.focus()
}

function chooseOption(id: string): void {
  if (section.value)
    emit('select', section.value, id)
}

function submit(): void {
  emit('submit')
  open.value = false
}
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerTrigger as-child>
      <Button type="button" variant="ghost" size="icon-lg" class="forum-filter-drawer-trigger" :aria-label="props.title">
        <span class="i-lucide-sliders-horizontal size-5" aria-hidden="true" />
      </Button>
    </DrawerTrigger>
    <DrawerContent class="forum-filter-drawer max-h-[85dvh] overflow-hidden">
      <DrawerHeader class="text-left">
        <div class="forum-filter-drawer-title-row" :class="{ 'has-section': section }">
          <div class="forum-filter-drawer-back" :inert="!section" :aria-hidden="!section">
            <Button type="button" variant="ghost" size="icon-sm" :aria-label="props.backLabel" @click="section = null">
              <span class="i-lucide-arrow-left size-4" aria-hidden="true" />
            </Button>
          </div>
          <DrawerTitle class="forum-filter-drawer-title">
            <Transition name="forum-filter-drawer-title">
              <span :key="section ?? 'root'">
                {{ title }}
              </span>
            </Transition>
          </DrawerTitle>
        </div>
        <DrawerDescription class="sr-only">
          {{ props.description }}
        </DrawerDescription>
      </DrawerHeader>
      <div ref="body" class="forum-filter-drawer-body" @keydown="handlePanelKeydown">
        <div class="forum-filter-drawer-panels" :style="{ height: `${panelHeight}px` }">
          <div ref="rootPanel" class="forum-filter-drawer-panel" :class="{ 'is-active': !section }" :inert="Boolean(section)" :aria-hidden="Boolean(section)">
            <button v-for="item in sections" :key="item.id" :data-section="item.id" type="button" class="forum-filter-drawer-row" @click="enterSection(item.id)">
              <span :class="item.icon" class="text-[var(--vp-c-text-3)] shrink-0 size-5" aria-hidden="true" />
              <span class="text-left flex-1">{{ item.label }}</span>
              <span v-if="item.value" class="forum-filter-drawer-value">{{ item.value }}</span>
              <span class="i-lucide-chevron-right text-[var(--vp-c-text-3)] shrink-0 size-4" aria-hidden="true" />
            </button>
          </div>
          <div ref="detailPanel" class="forum-filter-drawer-panel is-detail" :class="{ 'is-active': section }" :inert="!section" :aria-hidden="!section">
            <button v-for="item in options" :key="item.id" type="button" class="forum-filter-drawer-row" :aria-pressed="selected === item.id" @click="chooseOption(item.id)">
              <span v-if="'icon' in item && item.icon" :class="item.icon" class="shrink-0 size-5" aria-hidden="true" />
              <span class="text-left flex-1">{{ item.label }}</span>
              <span class="forum-filter-drawer-check i-lucide-check text-[var(--vp-c-brand-1)] size-4" :class="{ 'is-selected': selected === item.id }" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <DrawerFooter class="forum-filter-drawer-footer" :class="{ 'has-section': section }">
        <div class="forum-filter-drawer-reset" :inert="Boolean(section)" :aria-hidden="Boolean(section)">
          <Button type="button" variant="secondary" class="w-full" @click="emit('reset')">
            {{ props.resetLabel }}
          </Button>
        </div>
        <Button type="button" class="flex-1" @click="submit">
          {{ props.submitLabel }}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

<style scoped>
.forum-filter-drawer-trigger {
  flex-shrink: 0;
  height: 48px;
}
:global(.forum-filter-drawer) {
  --forum-filter-drawer-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.forum-filter-drawer-title-row {
  display: flex;
  align-items: center;
  min-height: 32px;
}
.forum-filter-drawer-back {
  width: 0;
  margin-right: 0;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.8);
  transition:
    width 260ms var(--forum-filter-drawer-ease),
    margin-right 260ms var(--forum-filter-drawer-ease),
    opacity 160ms ease,
    transform 260ms var(--forum-filter-drawer-ease);
}
.has-section .forum-filter-drawer-back {
  width: 32px;
  margin-right: 8px;
  opacity: 1;
  transform: scale(1);
}
.forum-filter-drawer-title {
  position: relative;
  flex: 1;
}
.forum-filter-drawer-title span {
  display: block;
}
.forum-filter-drawer-title-leave-active {
  position: absolute;
  inset: 0 auto auto 0;
}
.forum-filter-drawer-title-enter-active,
.forum-filter-drawer-title-leave-active {
  transition:
    opacity 160ms ease,
    filter 180ms ease,
    transform 180ms var(--forum-filter-drawer-ease);
}
.forum-filter-drawer-title-enter-from {
  opacity: 0;
  filter: blur(3px);
  transform: translateY(5px);
}
.forum-filter-drawer-title-leave-to {
  opacity: 0;
  filter: blur(2px);
  transform: translateY(-5px);
}
.forum-filter-drawer-body {
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 0 16px 16px;
}
.forum-filter-drawer-panels {
  position: relative;
  overflow: clip;
  transition: height 260ms var(--forum-filter-drawer-ease);
}
.forum-filter-drawer-panel {
  position: absolute;
  inset: 0 0 auto;
  width: 100%;
  opacity: 0;
  filter: blur(3px);
  pointer-events: none;
  transform: translateX(-18px);
  transition:
    opacity 200ms ease,
    filter 200ms ease,
    transform 260ms var(--forum-filter-drawer-ease);
}
.forum-filter-drawer-panel.is-detail {
  transform: translateX(18px);
}
.forum-filter-drawer-panel.is-active {
  opacity: 1;
  filter: blur(0);
  pointer-events: auto;
  transform: translateX(0);
}
.forum-filter-drawer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 8px;
  padding: 0 12px;
  background: transparent;
  color: var(--vp-c-text-1);
  @apply text-ui-14;
  transition:
    background-color 120ms ease,
    transform 120ms ease;
}
.forum-filter-drawer-row:active {
  transform: scale(0.985);
}
.forum-filter-drawer-check {
  flex-shrink: 0;
  opacity: 0;
  transform: scale(0.65);
  transition:
    opacity 160ms ease,
    transform 200ms var(--forum-filter-drawer-ease);
}
.forum-filter-drawer-check.is-selected {
  opacity: 1;
  transform: scale(1);
}
.forum-filter-drawer-row:hover,
.forum-filter-drawer-row:focus-visible {
  background: var(--vp-c-default-soft);
}
.forum-filter-drawer-row:focus-visible {
  outline-offset: -2px;
}
.forum-filter-drawer-value {
  overflow: hidden;
  max-width: 40%;
  color: var(--vp-c-text-3);
  @apply text-ui-12;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.forum-filter-drawer-footer {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 12px 16px max(16px, env(safe-area-inset-bottom));
  transition: grid-template-columns 260ms var(--forum-filter-drawer-ease);
}
.forum-filter-drawer-footer.has-section {
  grid-template-columns: 0fr 1fr;
}
.forum-filter-drawer-reset {
  min-width: 0;
  overflow: hidden;
  padding-right: 8px;
  opacity: 1;
  transition:
    opacity 160ms ease,
    padding-right 260ms var(--forum-filter-drawer-ease);
}
.has-section .forum-filter-drawer-reset {
  padding-right: 0;
  opacity: 0;
}
html[data-reduced-motion='true'] .forum-filter-drawer-back,
html[data-reduced-motion='true'] .forum-filter-drawer-footer,
html[data-reduced-motion='true'] .forum-filter-drawer-reset,
html[data-reduced-motion='true'] .forum-filter-drawer-row,
html[data-reduced-motion='true'] .forum-filter-drawer-check,
html[data-reduced-motion='true'] .forum-filter-drawer-title-enter-active,
html[data-reduced-motion='true'] .forum-filter-drawer-title-leave-active,
html[data-reduced-motion='true'] .forum-filter-drawer-panels,
html[data-reduced-motion='true'] .forum-filter-drawer-panel {
  transition: none;
}
html[data-reduced-motion='true'] .forum-filter-drawer-panel,
html[data-reduced-motion='true'] .forum-filter-drawer-title-enter-from,
html[data-reduced-motion='true'] .forum-filter-drawer-title-leave-to {
  filter: none;
  transform: none;
}
html[data-reduced-motion='true'] .forum-filter-drawer-row:active {
  transform: none;
}
</style>
