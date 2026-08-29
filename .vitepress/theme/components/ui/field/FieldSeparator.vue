<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Separator } from '../separator'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="field-separator"
    :data-content="!!$slots.default"
    :class="cn(
      'relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2',
      props.class,
    )"
  >
    <Separator class="inset-0 top-1/2 absolute" />
    <span
      v-if="$slots.default"
      class="text-muted-foreground mx-auto px-2 bg-background w-fit block relative"
      data-slot="field-separator-content"
    >
      <slot />
    </span>
  </div>
</template>
