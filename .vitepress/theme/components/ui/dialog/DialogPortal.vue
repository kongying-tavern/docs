<script setup lang="ts">
import { DialogPortal, type DialogPortalProps } from 'radix-vue'

const props = defineProps<DialogPortalProps>()
</script>

<template>
  <DialogPortal v-bind="props">
    <slot />
  </DialogPortal>
</template>
