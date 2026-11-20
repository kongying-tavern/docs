<script setup lang="ts">
import type { WithClassAsProps } from './types.ts'
import { cn } from '../../../lib/utils.ts'
import { useCarousel } from './useCarousel.ts'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<WithClassAsProps>()

const { carouselRef, orientation } = useCarousel()
function setCarouselElement(element: unknown) {
  carouselRef.value = element instanceof HTMLElement ? element : undefined
}
</script>

<template>
  <div
    :ref="setCarouselElement"
    data-slot="carousel-content"
    class="overflow-hidden"
  >
    <div
      :class="
        cn(
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          props.class,
        )"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </div>
</template>
