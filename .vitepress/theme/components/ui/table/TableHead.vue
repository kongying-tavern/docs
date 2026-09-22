<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <th
    data-slot="table-head"
    :class="cn('text-muted-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap', props.class)"
  >
    <slot />
  </th>
</template>
