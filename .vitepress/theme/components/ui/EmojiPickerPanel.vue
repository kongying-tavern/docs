<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { computed, ref, watch, watchEffect } from 'vue'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLocalized } from '@/hooks/useLocalized'
import EmojiData from '~/_data/emojis.json'

import { RECENT_EMOJIS_STORAGE_KEY, useEmojiPreload } from '~/composables/useGlobalEmojiPreloader'
import Emoji from './Emoji.vue'

export interface EmojiItem {
  preset: string
  emojiPlaceholder: string
  emoji: string
  width: number
  height: number
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{ recordCount?: number, disabled?: boolean, compact?: boolean, closeOnSelect?: boolean }>(), { recordCount: 8, closeOnSelect: true })

const emit = defineEmits<{
  (e: 'select', arg1: EmojiItem): void
}>()

const { message } = useLocalized()

const recentEmojis = useLocalStorage<Record<string, string[]>>(RECENT_EMOJIS_STORAGE_KEY, {})

if (!import.meta.env.SSR) {
  if (typeof recentEmojis.value !== 'object' || recentEmojis.value === null || Array.isArray(recentEmojis.value)) {
    recentEmojis.value = {}
  }
}

watchEffect(() => {
  if (typeof recentEmojis.value !== 'object' || recentEmojis.value === null || Array.isArray(recentEmojis.value)) {
    recentEmojis.value = {}
  }
})

const isOpen = defineModel<boolean>('open', { default: false })
const activePresetIndex = ref(0)

const emojiPreloader = useEmojiPreload()

watch(isOpen, opened => opened && emojiPreloader.preloadAllGroupsTop(30), { immediate: true })
const currentPreset = computed(() => EmojiData[activePresetIndex.value] || null)
const currentEmojiList = computed<Record<string, string>>(() => {
  const list = EmojiData[activePresetIndex.value]?.list || []
  return Object.fromEntries(
    list.map(item => [Object.keys(item)[0], Object.values(item)[0]]),
  )
})

const recentEmojisFiltered = computed(() => {
  const currentPresetName = currentPreset.value?.presets
  if (!currentPresetName) {
    return []
  }

  return (recentEmojis.value[currentPresetName] || [])
    .filter(emoji => emoji && typeof emoji === 'string')
    .slice(0, props.recordCount)
})

function selectEmoji(emoji: string) {
  if (props.disabled || !emoji || typeof emoji !== 'string') {
    return
  }

  emit('select', {
    emoji,
    emojiPlaceholder: `:${emoji}:`,
    preset: currentPreset.value.presets,
    width: currentPreset.value.width,
    height: currentPreset.value.height,
  })
  if (props.closeOnSelect)
    isOpen.value = false

  // 更新最近使用的表情
  const currentPresetName = currentPreset.value.presets
  if (!currentPresetName) {
    return
  }

  const presetEmojis = recentEmojis.value[currentPresetName] || []
  const newPresetEmojis = presetEmojis.filter(e => e !== emoji)
  newPresetEmojis.unshift(emoji)

  recentEmojis.value = {
    ...recentEmojis.value,
    [currentPresetName]: newPresetEmojis.slice(0, 8),
  }
}

function nextPreset() {
  if (activePresetIndex.value < EmojiData.length - 1) {
    activePresetIndex.value++
  }
}

function prevPreset() {
  if (activePresetIndex.value > 0) {
    activePresetIndex.value--
  }
}

function selectPreset(value: unknown): void {
  if (typeof value !== 'string' || value === '')
    return
  const index = Number(value)
  if (Number.isInteger(index) && index >= 0 && index < EmojiData.length)
    activePresetIndex.value = index
}

function deleteRecentEmoji(emoji: string) {
  if (!emoji || typeof emoji !== 'string') {
    return
  }

  const currentPresetName = currentPreset.value.presets
  if (!currentPresetName) {
    return
  }

  recentEmojis.value = {
    ...recentEmojis.value,
    [currentPresetName]: (recentEmojis.value[currentPresetName] || []).filter(e => e !== emoji),
  }
}
</script>

<template>
  <div
    :class="{ 'emoji-panel-compact': compact }"
    class="flex flex-col h-72 max-h-[var(--reka-popover-content-available-height)] w-full"
  >
    <div class="emoji-picker-body p-2 flex flex-1 flex-col overflow-hidden">
      <div v-if="recentEmojisFiltered.length > 0" class="mb-2 shrink-0">
        <p class="text-sm font-bold">
          {{ message.forum.publish.feedbackForm.recentUsed }}
        </p>
        <TransitionGroup
          name="emoji-shift" tag="div"
          class="emoji-grid-inner gap-1 grid grid-cols-8 grid-rows-1 max-h-32px overflow-hidden"
        >
          <Button
            v-for="emoji in recentEmojisFiltered" :key="emoji" type="button" variant="ghost" size="icon-sm" :aria-label="emoji"
            @click="selectEmoji(emoji)" @dblclick="deleteRecentEmoji(emoji)"
          >
            <Emoji :emoji="emoji" :width="currentPreset.width" :height="currentPreset.height" />
          </Button>
        </TransitionGroup>
      </div>
      <p class="text-sm font-bold shrink-0">
        {{ currentPreset.presets }}
      </p>
      <div class="emoji-list overscroll-contain gap-1 grid grid-cols-8 overflow-auto" tabindex="0" :aria-label="currentPreset.presets">
        <Button
          v-for="(emoji, key) in currentEmojiList" :key="key" type="button" variant="ghost" size="icon-sm" :aria-label="String(key)"
          @click="selectEmoji(emoji)"
        >
          <Emoji :emoji="emoji" :width="currentPreset.width" :height="currentPreset.height" />
        </Button>
      </div>
    </div>
    <div class="emoji-picker-groups p-2 border-t flex shrink-0 w-full items-center justify-between">
      <ToggleGroup type="single" size="sm" :spacing="1" :model-value="String(activePresetIndex)" class="emoji-presets overflow-auto" @update:model-value="selectPreset">
        <ToggleGroupItem
          v-for="(preset, index) in EmojiData" :key="preset.presets" :value="String(index)" :aria-label="preset.presets" class="px-0 size-8"
        >
          <Emoji :emoji="preset.logo" :height="25" :width="25" />
        </ToggleGroupItem>
      </ToggleGroup>
      <div class="ml-4 flex gap-1">
        <Button type="button" variant="ghost" size="icon-xs" :aria-label="message.forum.publish.feedbackForm.previousEmojiGroup" :disabled="activePresetIndex === 0" @click="prevPreset">
          <span class="i-lucide:chevron-left icon-btn" />
        </Button>
        <Button
          type="button" variant="ghost" size="icon-xs" :aria-label="message.forum.publish.feedbackForm.nextEmojiGroup" :disabled="activePresetIndex === EmojiData.length - 1"
          @click="nextPreset"
        >
          <span class="i-lucide:chevron-right icon-btn" />
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-list {
  flex: 1;
  min-height: 0;
  align-content: start;
  scrollbar-width: thin;
}
.emoji-list:focus-visible {
  outline: 1px solid oklch(var(--ring));
  outline-offset: -1px;
}
.emoji-picker-body {
  min-height: 0;
}
.emoji-panel-compact {
  height: 100%;
  min-height: 0;
  max-height: none;
}

.emoji-shift-enter-active,
.emoji-shift-leave-active {
  transition: all 0.3s ease;
}

.emoji-shift-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.emoji-shift-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.emoji-shift-move {
  transition: all 0.3s ease;
}

.emoji-grid-inner > *:nth-child(n + 9) {
  display: none;
}

html[data-reduced-motion='true'] .emoji-shift-enter-active,
html[data-reduced-motion='true'] .emoji-shift-leave-active,
html[data-reduced-motion='true'] .emoji-shift-move {
  transition: none;
}
.emoji-panel-compact .emoji-list,
.emoji-panel-compact .emoji-grid-inner {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.emoji-panel-compact .emoji-list,
.emoji-panel-compact :deep(.emoji-presets) {
  scrollbar-width: none;
}
.emoji-panel-compact .emoji-list::-webkit-scrollbar,
.emoji-panel-compact :deep(.emoji-presets::-webkit-scrollbar) {
  display: none;
}
.emoji-panel-compact .emoji-list {
  grid-auto-rows: 48px;
}
.emoji-panel-compact .emoji-grid-inner {
  max-height: 48px;
}
.emoji-panel-compact :deep(button) {
  min-width: 44px;
  min-height: 44px;
}
.emoji-panel-compact .emoji-list :deep(button),
.emoji-panel-compact .emoji-grid-inner :deep(button) {
  width: 100%;
  min-width: 0;
  height: 48px;
}
.emoji-panel-compact .emoji-list :deep(img),
.emoji-panel-compact .emoji-grid-inner :deep(img) {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.emoji-panel-compact .emoji-grid-inner > *:nth-child(n + 8) {
  display: none;
}
</style>
