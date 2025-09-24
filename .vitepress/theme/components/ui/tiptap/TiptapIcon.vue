<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  name: string & {}
  size?: 'sm' | 'md' | 'lg'
  class?: HTMLAttributes['class']
}>()

// Compute size classes
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'h-4 w-4'
    case 'lg': return 'h-6 w-6'
    default: return 'h-5 w-5'
  }
})
</script>

<template>
  <span
    :class="cn(
      props.name,
      sizeClasses,
      props.class,
    )"
    data-slot="tiptap-icon"
  />
</template>
