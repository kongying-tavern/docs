<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)
</script>

<template>
  <NodeViewWrapper
    class="emoji-wrapper mx-1px select-text" as="span" :style="{
      'line-height': `${props.HTMLAttributes.height}px`,
    }"
  >
    <Emoji :emoji="props.HTMLAttributes.emoji" :width="props.HTMLAttributes.width" :height="props.HTMLAttributes.height" />
  </NodeViewWrapper>
</template>

<style>
.emoji-wrapper {
  display: inline-block;
}

.emoji-wrapper > img {
  vertical-align: text-bottom;
}

img[data-emoji] {
  display: inline-block;
}
</style>
