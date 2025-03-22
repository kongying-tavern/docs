<script setup lang="ts">
import type { PopoverContentProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

import EmojiData from '~/_data/emojis.json'

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
  defineProps<PopoverContentProps & { class?: HTMLAttributes['class'], recordCount?: number }>(),
  {
    align: 'center',
    side: 'top',
    sideOffset: 50,
    disableUpdateOnLayoutShift: true,
    recordCount: 8,
  },
)

const emit = defineEmits<{
  (e: 'select', arg1: EmojiItem): void
}>()

const recentEmojis = useLocalStorage<Record<string, string[]>>('RECENT_EMOJIS', {})

const isOpen = ref(false)
const activePresetIndex = ref(0)
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
  if (!emoji || typeof emoji !== 'string') {
    return
  }

  emit('select', {
    emoji,
    emojiPlaceholder: `:${emoji}:`,
    preset: currentPreset.value.presets,
    width: currentPreset.value.width,
    height: currentPreset.value.height,
  })

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
          variant="ghost"
          :class="cn('h-8 w-6 border border-[var(--vp-c-gutter)] border-solid bg-transparent', $props.class)"
        >
          <span class="i-custom:emoji icon-btn size-4 c-[var(--vp-c-text-2)]" />
        </Button>
      </slot>
    </PopoverTrigger>
    <PopoverContent v-bind="{ ...$props }" class="size-fit p-0">
      <div
        class="h-[270px] w-[360px] flex flex-col border rounded-lg bg-[var(--vp-c-bg-elv)] c-[var(--vp-c-text-1)] shadow"
      >
        <div class="flex flex-1 flex-col overflow-hidden p-2">
          <div v-if="recentEmojisFiltered.length > 0" class="mb-2">
            <p class="text-sm font-bold">
              最近使用
            </p>
            <TransitionGroup
              name="emoji-shift" tag="div"
              class="emoji-grid-inner grid grid-cols-8 grid-rows-1 max-h-32px gap-1 overflow-hidden"
            >
              <Button
                v-for="emoji in recentEmojisFiltered" :key="emoji" variant="ghost" class="h-8 w-8 p-0 text-lg"
                @click="selectEmoji(emoji)" @dblclick="deleteRecentEmoji(emoji)"
              >
                <Emoji :emoji="emoji" :width="currentPreset.width" :height="currentPreset.height" />
              </Button>
            </TransitionGroup>
          </div>
          <p class="text-sm font-bold">
            {{ currentPreset.presets }}
          </p>
          <div class="emoji-list grid grid-cols-8 gap-1 overflow-auto">
            <Button
              v-for="(emoji, key) in currentEmojiList" :key="key" variant="ghost" class="size-fit p-1 text-lg"
              @click="selectEmoji(emoji)"
            >
              <Emoji :emoji="emoji" :width="currentPreset.width" :height="currentPreset.height" />
            </Button>
          </div>
        </div>
        <div class="h-10 w-full flex items-center justify-between bg-[var(--vp-c-bg-alt)] p-2">
          <div class="flex gap-2 overflow-auto">
            <Button
              v-for="(preset, index) in EmojiData" :key="preset.presets" variant="ghost" class="size-fit p-1"
              @click="() => { activePresetIndex = index; }"
            >
              <Emoji :emoji="preset.logo" :height="25" :width="25" />
            </Button>
          </div>
          <div class="ml-4 flex gap-1">
            <Button variant="ghost" class="w-4" :disabled="activePresetIndex === 0" @click="prevPreset">
              <span class="i-lucide:chevron-left icon-btn" />
            </Button>
            <Button
              variant="ghost" class="w-4" :disabled="activePresetIndex === EmojiData.length - 1"
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
::-webkit-scrollbar {
  display: none;
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

.emoji-grid-inner>*:nth-child(n+9) {
  display: none;
}
</style>
