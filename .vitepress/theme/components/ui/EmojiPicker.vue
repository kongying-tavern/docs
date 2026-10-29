<script lang="ts">
</script>

<script setup lang="ts">
import type { PopoverContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { EmojiItem } from './EmojiPickerPanel.vue'
import { reactiveOmit } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useEmojiPreload } from '~/composables/useGlobalEmojiPreloader'
import EmojiPickerPanel from './EmojiPickerPanel.vue'

export type { EmojiItem } from './EmojiPickerPanel.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<PopoverContentProps & { class?: HTMLAttributes['class'], recordCount?: number, disabled?: boolean }>(), {
  align: 'start',
  side: 'top',
  sideOffset: 8,
  collisionPadding: 12,
  recordCount: 8,
})
const emit = defineEmits<{ select: [emoji: EmojiItem] }>()
const isOpen = defineModel<boolean>('open', { default: false })
const contentProps = reactiveOmit(props, 'class', 'recordCount', 'disabled')
const { t } = useI18n({ useScope: 'global' })
const preload = useEmojiPreload()
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <slot name="trigger">
        <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" :aria-label="t('ui.button.emoji')" aria-haspopup="dialog" :class="cn(props.class)" @mouseenter="preload.smartPreload">
          <span class="i-custom:emoji c-[var(--vp-c-text-2)] icon-btn size-4" />
        </Button>
      </slot>
    </PopoverTrigger>
    <PopoverContent v-bind="{ ...$attrs, ...contentProps }" class="p-0 w-80 overflow-hidden">
      <EmojiPickerPanel v-model:open="isOpen" :disabled="disabled" :record-count="recordCount" @select="emit('select', $event)" />
    </PopoverContent>
  </Popover>
</template>
