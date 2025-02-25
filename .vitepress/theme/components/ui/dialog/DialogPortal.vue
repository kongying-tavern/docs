<script setup lang="ts">
import type { DialogPortalProps } from 'radix-vue'
import { DialogPortal } from 'radix-vue'

const props = defineProps<DialogPortalProps>()
</script>

<template>
  <DialogPortal v-bind="props">
    <slot />
  </DialogPortal>
</template>
