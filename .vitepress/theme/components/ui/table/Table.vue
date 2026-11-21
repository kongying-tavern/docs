<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/tailwind.ts'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="table-container"
    class="w-full relative overflow-x-auto"
  >
    <table
      data-slot="table"
      :class="cn('w-full caption-bottom text-sm', props.class)"
    >
      <slot />
    </table>
  </div>
</template>
