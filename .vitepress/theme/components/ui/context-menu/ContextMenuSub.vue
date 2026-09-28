<script setup lang="ts">
import type { ContextMenuSubEmits, ContextMenuSubProps } from 'reka-ui'
import {
  ContextMenuSub,
  useForwardPropsEmits,
} from 'reka-ui'

const props = defineProps<ContextMenuSubProps>()
const emits = defineEmits<ContextMenuSubEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <ContextMenuSub v-slot="slotProps" data-slot="context-menu-sub" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </ContextMenuSub>
</template>
