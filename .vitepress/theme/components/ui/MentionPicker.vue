<script setup lang="ts">
import type { PopoverContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '~/forum/api/types'
import { reactiveOmit } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import MentionPickerPanel from './MentionPickerPanel.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<PopoverContentProps & { class?: HTMLAttributes['class'], searchTerm?: string, showSearch?: boolean, disabled?: boolean, items?: ForumAPI.User[], recordCount?: number }>(), {
  align: 'start',
  side: 'bottom',
  sideOffset: 8,
  collisionPadding: 12,
  recordCount: 4,
  searchTerm: '',
  showSearch: true,
})
const emit = defineEmits<{ select: [user: ForumAPI.User] }>()
const isOpen = defineModel<boolean>('open', { default: false })
const contentProps = reactiveOmit(props, 'class', 'searchTerm', 'showSearch', 'disabled', 'items', 'recordCount')
const { message } = useLocalized()
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <slot name="trigger">
        <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" :aria-label="message.forum.publish.feedbackForm.mentionUser" :class="cn(props.class)">
          <span class="i-custom:mention c-[var(--vp-c-text-2)] icon-btn size-4" />
        </Button>
      </slot>
    </PopoverTrigger>
    <PopoverContent v-bind="{ ...$attrs, ...contentProps }" class="p-0 w-72">
      <MentionPickerPanel v-model:open="isOpen" :disabled="disabled" :items="items" :record-count="recordCount" :show-search="showSearch" :search-term="searchTerm" @select="emit('select', $event)" />
    </PopoverContent>
  </Popover>
</template>
