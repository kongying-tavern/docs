<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { EmptyActionsVariants } from '.'
import { cn } from '@/lib/utils'
import { emptyActionsVariants } from '.'

const props = defineProps<{
  class?: HTMLAttributes['class']
  variant?: EmptyActionsVariants['variant']
}>()
</script>

<template>
  <div
    data-slot="empty-actions"
    :class="cn(emptyActionsVariants({ variant }), props.class)"
  >
    <slot />
  </div>
</template>
