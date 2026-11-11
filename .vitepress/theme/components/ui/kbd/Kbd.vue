<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  emphasis?: 'strong' | 'subtle'
}>()
</script>

<template>
  <kbd
    data-slot="kbd"
    :class="cn(
      'border-border bg-muted pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm border px-1.5 font-sans text-xs leading-none shadow-[0_1px_0_var(--border-color)] select-none',
      props.emphasis === 'subtle' ? 'text-foreground/80' : 'text-foreground',
      props.emphasis === 'strong' ? 'font-bold' : 'font-medium',
      `[&_svg:not([class*='size-'])]:size-3`,
      '[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10',
      props.class,
    )"
  >
    <slot />
  </kbd>
</template>
