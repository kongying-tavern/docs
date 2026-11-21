<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AlertVariants } from './index.ts'
import { cn } from '../../../lib/tailwind.ts'
import { alertVariants } from './index.ts'

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
