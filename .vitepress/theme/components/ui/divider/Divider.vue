<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<DividerProps>()

// @unocss-include
const dividerVariants = cva('flex items-center gap-2.5 before:content-[""] after:content-[""]', {
  variants: {
    variant: {
      default: 'before:bg-[oklch(var(--border))] before:h-px before:w-full before:content',
      center:
        'before:bg-[oklch(var(--border))] after:bg-[oklch(var(--border))] before:h-px before:w-full after:h-px after:w-full',
      left: 'after:bg-[oklch(var(--border))] after:h-px after:w-full',
      right: 'before:bg-[oklch(var(--border))] before:h-px before:w-full',
    },
  },
  defaultVariants: {
    variant: 'center',
  },
})

interface DividerProps {
  variant?: VariantProps<typeof dividerVariants>['variant']
  class?: string
}

const classes = computed(() =>
  cn(
    dividerVariants({
      variant: props.variant,
    }),
    props.class,
  ),
)
</script>

<template>
  <div data-slot="divider" :class="classes">
    <span class="text-dimmed text-sm text-nowrap">
      <slot />
    </span>
  </div>
</template>
