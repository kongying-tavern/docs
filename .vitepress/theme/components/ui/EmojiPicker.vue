<script setup lang="ts">
import type { PopoverContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit, useLocalStorage } from '@vueuse/core'
import { computed, ref, watch, watchEffect } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import EmojiData from '~/_data/emojis.json'

import { useEmojiPreload } from '~/composables/useGlobalEmojiPreloader'
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

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: HTMLAttributes['class'], recordCount?: number, disabled?: boolean }>(),
  {
    align: 'start',
    side: 'top',
    sideOffset: 8,
    collisionPadding: 12,
    recordCount: 8,
  },
)

const emit = defineEmits<{
  (e: 'select', arg1: EmojiItem): void
}>()

const { message } = useLocalized()
const triggerLabel = computed(() => message.value.ui?.button?.emoji ?? 'Emoji')

const recentEmojis = useLocalStorage<Record<string, string[]>>('RECENT_EMOJIS', {})

// 立即修复无效的初始值
if (!import.meta.env.SSR) {
  if (typeof recentEmojis.value !== 'object' || recentEmojis.value === null || Array.isArray(recentEmojis.value)) {
    recentEmojis.value = {}
  }
}

// 验证并自动重置对象类型
watchEffect(() => {
  if (typeof recentEmojis.value !== 'object' || recentEmojis.value === null || Array.isArray(recentEmojis.value)) {
    recentEmojis.value = {}
  }
})

const isOpen = defineModel<boolean>('open', { default: false })
const contentProps = reactiveOmit(props, 'class', 'recordCount', 'disabled')
const activePresetIndex = ref(0)

const emojiPreloader = useEmojiPreload()

function handleTriggerHover() {
  emojiPreloader.smartPreload()
}

watch(isOpen, opened => opened && emojiPreloader.preloadAllGroupsTop(30))
const currentPreset = computed(() => EmojiData[activePresetIndex.value] || null)
const currentEmojiList = computed<Record<string, string>>(() => {
  const list = EmojiData[activePresetIndex.value]?.list || []
  return Object.fromEntries(
    list.map(item => [Object.keys(item)[0], Object.values(item)[0]]),
  )
})

// 过滤空值并限制最大数量
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
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <slot name="trigger">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          :disabled="disabled"
          :aria-label="triggerLabel"
          aria-haspopup="dialog"
          :class="cn(props.class)"
          @mouseenter="handleTriggerHover"
        >
          <span class="i-custom:emoji c-[var(--vp-c-text-2)] icon-btn size-4" />
        </Button>
      </slot>
    </PopoverTrigger>
    <PopoverContent v-bind="{ ...$attrs, ...contentProps }" class="p-0 w-80 overflow-hidden">
      <div
        class="flex flex-col h-72 max-h-[var(--reka-popover-content-available-height)] w-full"
      >
        <div class="p-2 flex flex-1 flex-col overflow-hidden">
          <div v-if="recentEmojisFiltered.length > 0" class="mb-2">
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
          <p class="text-sm font-bold">
            {{ currentPreset.presets }}
          </p>
          <div class="emoji-list overscroll-contain gap-1 grid grid-cols-8 overflow-auto">
            <Button
              v-for="(emoji, key) in currentEmojiList" :key="key" type="button" variant="ghost" size="icon-sm" :aria-label="String(key)"
              @click="selectEmoji(emoji)"
            >
              <Emoji :emoji="emoji" :width="currentPreset.width" :height="currentPreset.height" />
            </Button>
          </div>
        </div>
        <div class="p-2 border-t flex shrink-0 w-full items-center justify-between">
          <ToggleGroup type="single" size="sm" :spacing="1" :model-value="String(activePresetIndex)" class="overflow-auto" @update:model-value="selectPreset">
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
    </PopoverContent>
  </Popover>
</template>

<style scoped>
.emoji-list {
  scrollbar-width: thin;
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

@media (prefers-reduced-motion: reduce) {
  .emoji-shift-enter-active,
  .emoji-shift-leave-active,
  .emoji-shift-move {
    transition: none;
  }
}
</style>
