<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '../types.d.ts'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@theme/components/ui/context-menu/index.ts'
import { cn } from '@theme/lib/utils.ts'
import ForumDropdownMenu from './ForumDropdownMenu.vue'
import { menuContentClasses } from './responsive/shared.ts'

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
