<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/tailwind.ts'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <thead
    data-slot="table-header"
    :class="cn('table-header [&_tr]:border-b', props.class)"
  >
    <slot />
  </thead>
</template>
