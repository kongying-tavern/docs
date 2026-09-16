<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AlertVariants } from '.'
import { cn } from '@/lib/utils'
import { alertVariants } from '.'

const props = defineProps<{
  class?: HTMLAttributes['class']
  variant?: AlertVariants['variant']
}>()
</script>

<template>
  <div
    data-slot="alert"
    :data-variant="variant"
    role="alert"
    :class="cn(alertVariants({ variant }), props.class)"
  >
    <slot />
  </div>
</template>
