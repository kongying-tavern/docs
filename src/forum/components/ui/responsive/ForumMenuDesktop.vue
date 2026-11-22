<script setup lang="ts">
import type { DropdownMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '@/src/forum/shared/types.d.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@theme/components/ui/dropdown-menu/index.ts'
import { cn } from '@theme/lib/tailwind.ts'
import ForumDropdownMenu from '../ForumDropdownMenu.vue'
import { menuContentClasses } from './shared.ts'

defineOptions({
  inheritAttrs: false,
})

const { side = 'bottom', class: className, items } = defineProps<{
  items: FORUM.TopicDropdownMenu[]
  side?: DropdownMenuContentProps['side']
  align?: DropdownMenuContentProps['align']
  class?: HTMLAttributes['class']
}>()

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
      :class="cn(menuContentClasses(items), className)"
    >
      <slot name="menu" />
      <ForumDropdownMenu :items="items" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
