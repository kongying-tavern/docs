<script setup lang="ts">
import type { ButtonVariants } from '../button/index.ts'
import type { WithClassAsProps } from './types.ts'
import { ArrowLeft } from '@lucide/vue'
import { cn } from '../../../lib/tailwind.ts'
import { Button } from '../button/index.ts'
import { useCarousel } from './useCarousel.ts'

const props = withDefaults(defineProps<{
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
}
& WithClassAsProps>(), {
  variant: 'outline',
  size: 'icon',
})

const { orientation, canScrollPrev, scrollPrev } = useCarousel()
</script>

<template>
  <Button
    data-slot="carousel-previous"
    :disabled="!canScrollPrev"
    :class="cn(
      'absolute size-8 rounded-full',
      orientation === 'horizontal'
        ? 'top-1/2 -left-12 -translate-y-1/2'
        : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
      props.class,
    )"
    :variant="variant"
    :size="size"
    @click="scrollPrev"
  >
    <slot>
      <ArrowLeft />
      <span class="sr-only">Previous Slide</span>
    </slot>
  </Button>
</template>
