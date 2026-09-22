<script setup lang="ts">
import type { DropdownMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '../types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import ForumDropdownMenu from '../ForumDropdownMenu.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    items: FORUM.TopicDropdownMenu[]
    side?: DropdownMenuContentProps['side']
    align?: DropdownMenuContentProps['align']
    class?: HTMLAttributes['class']
  }>(),
  {
    side: 'bottom',
  },
)

defineSlots<{
  trigger: () => unknown
  /** 内容前置行，如调用方自定义的菜单项 */
  menu: () => unknown
}>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      fluid
      :side="side"
      :align="align"
      :class="cn('w-max text-nowrap', props.class)"
    >
      <slot name="menu" />
      <ForumDropdownMenu :items="props.items" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
