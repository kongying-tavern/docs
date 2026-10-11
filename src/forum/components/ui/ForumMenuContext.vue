<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '../types'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import ForumDropdownMenu from './ForumDropdownMenu.vue'

const { menu = [], class: className } = defineProps<{
  menu?: FORUM.TopicDropdownMenu[]
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent fluid :class="cn('w-max text-nowrap z-[max(50,calc(var(--vp-z-index-sidebar)+1))]', className)">
      <slot name="menu" />
      <ForumDropdownMenu :items="menu" />
    </ContextMenuContent>
  </ContextMenu>
</template>
