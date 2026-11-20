<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { EmptyActionsVariants } from '.'
import { emptyActionsVariants } from '.'
import { cn } from '../../../lib/utils'

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
