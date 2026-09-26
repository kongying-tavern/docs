<script setup lang="ts">
import type { FORUM } from '~/components/forum/types'
import type { ForumFilter, ForumSort, ForumTopicType } from '~/services/forum/forumRoute'
import { computed, nextTick, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumListControlOptions } from '~/composables/forum/useForumListControlOptions'
import { useForumViewMode } from '~/composables/useForumViewMode'

interface ForumSearchSettings {
  query: string
  filter: ForumFilter
  topicType: ForumTopicType
  sort: ForumSort
  viewMode: FORUM.TopicViewMode
}

type Section = 'range' | 'type' | 'sort' | 'view'

const props = defineProps<{
  query: string
  filter: ForumFilter
  topicType: ForumTopicType
  sort: ForumSort
}>()
const emit = defineEmits<{ search: [settings: ForumSearchSettings] }>()

const { message } = useLocalized()
const { viewMode } = useForumViewMode()
const { filters, types, sorts, views } = useForumListControlOptions()
const typeOptions = computed(() => types.value.map(item => ({
  ...item,
  label: item.id === 'bug'
    ? message.value.forum.header.navigation.bugFeedback
    : item.id === 'feat'
      ? message.value.forum.header.navigation.featFeedback
      : item.label,
})))
const open = ref(false)
const section = ref<Section | null>(null)
const rootPanel = ref<HTMLElement | null>(null)
const detailPanel = ref<HTMLElement | null>(null)
const panelHeight = ref(192)
const draft = ref<ForumSearchSettings>({ query: props.query, filter: props.filter, topicType: props.topicType, sort: props.sort, viewMode: viewMode.value })
const sections = computed(() => [
  { id: 'range' as const, icon: 'i-lucide-list', label: message.value.forum.header.search.feedbackRange, value: filters.value.find(item => item.id === draft.value.filter)?.label ?? '' },
  { id: 'type' as const, icon: 'i-lucide-shapes', label: message.value.forum.header.search.feedbackType, value: typeOptions.value.find(item => item.id === draft.value.topicType)?.label ?? '' },
  { id: 'sort' as const, icon: 'i-lucide-arrow-down-wide-narrow', label: message.value.forum.sidebar.listSort, value: sorts.value.find(item => item.id === draft.value.sort)?.label ?? '' },
  { id: 'view' as const, icon: 'i-lucide-layout-list', label: message.value.forum.header.view.label, value: views.value.find(item => item.id === draft.value.viewMode)?.label ?? '' },
])
const options = computed(() => {
  switch (section.value) {
    case 'range': return filters.value
    case 'type': return typeOptions.value
    case 'sort': return sorts.value
    case 'view': return views.value
    default: return []
  }
})
const selected = computed(() => {
  switch (section.value) {
    case 'range': return draft.value.filter
    case 'type': return draft.value.topicType
    case 'sort': return draft.value.sort
    case 'view': return draft.value.viewMode
    default: return ''
  }
})
const title = computed(() => sections.value.find(item => item.id === section.value)?.label ?? message.value.forum.header.search.settings)

watch(open, (isOpen) => {
  if (!isOpen) {
    section.value = null
    return
  }
  draft.value = { query: props.query, filter: props.filter, topicType: props.topicType, sort: props.sort, viewMode: viewMode.value }
})

watch([open, section, () => options.value.length], async () => {
  if (!open.value)
    return
  await nextTick()
  panelHeight.value = (section.value ? detailPanel.value : rootPanel.value)?.scrollHeight ?? panelHeight.value
}, { flush: 'post' })

function chooseOption(id: string): void {
  switch (section.value) {
    case 'range':
      draft.value.filter = id as ForumFilter
      break
    case 'type':
      draft.value.topicType = id as ForumTopicType
      break
    case 'sort':
      draft.value.sort = id as ForumSort
      break
    case 'view':
      draft.value.viewMode = id as FORUM.TopicViewMode
      break
  }
}

function reset(): void {
  draft.value = { query: draft.value.query, filter: 'all', topicType: 'all', sort: 'created', viewMode: 'CARD' }
}

function search(): void {
  emit('search', { ...draft.value })
  open.value = false
}
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerTrigger as-child>
      <Button type="button" variant="ghost" size="icon-lg" class="shrink-0 h-12" :aria-label="message.forum.header.search.settings">
        <span class="i-lucide-sliders-horizontal size-5" aria-hidden="true" />
      </Button>
    </DrawerTrigger>
    <DrawerContent class="forum-search-settings-drawer max-h-[85dvh] overflow-hidden">
      <DrawerHeader class="text-left">
        <div class="forum-search-settings-title-row flex gap-2 items-center">
          <Button v-if="section" type="button" variant="ghost" size="icon-sm" :aria-label="message.forum.topic.searchFacets.back" @click="section = null">
            <span class="i-lucide-arrow-left size-4" aria-hidden="true" />
          </Button>
          <Transition name="forum-search-settings-title" mode="out-in">
            <DrawerTitle :key="section ?? 'root'">
              {{ title }}
            </DrawerTitle>
          </Transition>
        </div>
        <DrawerDescription class="sr-only">
          {{ message.forum.topic.searchFacets.choose }}
        </DrawerDescription>
      </DrawerHeader>
      <div class="forum-search-settings-body">
        <div class="forum-search-settings-panels" :style="{ height: `${panelHeight}px` }">
          <div ref="rootPanel" class="forum-search-settings-panel" :class="{ 'is-active': !section }" :inert="Boolean(section)" :aria-hidden="Boolean(section)">
            <button v-for="item in sections" :key="item.id" type="button" class="forum-search-settings-row" @click="section = item.id">
              <span :class="item.icon" class="text-[var(--vp-c-text-3)] shrink-0 size-5" aria-hidden="true" />
              <span class="text-left flex-1">{{ item.label }}</span>
              <span v-if="item.value" class="forum-search-settings-value">{{ item.value }}</span>
              <span class="i-lucide-chevron-right text-[var(--vp-c-text-3)] shrink-0 size-4" aria-hidden="true" />
            </button>
          </div>
          <div ref="detailPanel" class="forum-search-settings-panel is-detail" :class="{ 'is-active': section }" :inert="!section" :aria-hidden="!section">
            <button v-for="item in options" :key="item.id" type="button" class="forum-search-settings-row" :aria-pressed="selected === item.id" @click="chooseOption(item.id)">
              <span v-if="'icon' in item && item.icon" :class="item.icon" class="shrink-0 size-5" aria-hidden="true" />
              <span class="text-left flex-1">{{ item.label }}</span>
              <span v-if="selected === item.id" class="i-lucide-check text-[var(--vp-c-brand-1)] size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <DrawerFooter class="forum-search-settings-footer">
        <Button v-if="!section" type="button" variant="secondary" class="flex-1" @click="reset">
          {{ message.forum.header.search.resetFilters }}
        </Button>
        <Button type="button" class="flex-1" @click="search">
          {{ message.ui.button.search }}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

<style scoped>
.forum-search-settings-drawer {
  --forum-search-settings-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.forum-search-settings-title-row {
  min-height: 32px;
}
.forum-search-settings-title-enter-active,
.forum-search-settings-title-leave-active {
  transition:
    opacity 120ms ease,
    transform 180ms var(--forum-search-settings-ease);
}
.forum-search-settings-title-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.forum-search-settings-title-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
.forum-search-settings-body {
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px 16px;
}
.forum-search-settings-panels {
  position: relative;
  transition: height 260ms var(--forum-search-settings-ease);
}
.forum-search-settings-panel {
  position: absolute;
  inset: 0 0 auto;
  width: 100%;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-14px);
  transition:
    opacity 200ms ease,
    transform 260ms var(--forum-search-settings-ease);
}
.forum-search-settings-panel.is-detail {
  transform: translateX(14px);
}
.forum-search-settings-panel.is-active {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
}
.forum-search-settings-row {
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
  font-size: calc(14px * var(--site-ui-scale));
}
.forum-search-settings-row:hover,
.forum-search-settings-row:focus-visible {
  background: var(--vp-c-default-soft);
}
.forum-search-settings-value {
  overflow: hidden;
  max-width: 40%;
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
  text-overflow: ellipsis;
  white-space: nowrap;
}
.forum-search-settings-footer {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 12px 16px max(16px, env(safe-area-inset-bottom));
}
@media (prefers-reduced-motion: reduce) {
  .forum-search-settings-title-enter-active,
  .forum-search-settings-title-leave-active,
  .forum-search-settings-panels,
  .forum-search-settings-panel {
    transition: none;
  }
}
</style>
