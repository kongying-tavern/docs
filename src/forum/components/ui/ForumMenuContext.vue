<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '../types'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import ForumDropdownMenu from './ForumDropdownMenu.vue'
import { menuContentClasses } from './responsive/shared'

const { menu = [], class: className } = defineProps<{
  menu?: FORUM.TopicDropdownMenu[]
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <!-- A context menu must not lock and relayout the entire image list. -->
  <ContextMenu :modal="false">
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent fluid :class="cn(menuContentClasses(menu), 'data-[state=open]:animate-none data-[state=closed]:animate-none z-[max(50,calc(var(--vp-z-index-sidebar)+1))]', className)">
      <slot name="menu" />
      <ForumDropdownMenu :items="menu" />
    </ContextMenuContent>
  </ContextMenu>
</template>
