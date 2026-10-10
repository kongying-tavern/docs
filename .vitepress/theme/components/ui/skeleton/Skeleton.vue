<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<SkeletonProps>()
</script>

<template>
  <div
    data-slot="skeleton"
    :class="cn('motion-safe:animate-pulse rounded-md bg-primary/10', props.class)"
  />
</template>

<style>
html[data-reduced-motion='true'] [data-slot='skeleton'] {
  animation: none !important;
}
</style>
