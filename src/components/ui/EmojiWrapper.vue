<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/core'
import type { EmojiAttrs } from './types'

const props = defineProps<NodeViewProps & {
  attrs?: EmojiAttrs
}>()

// Extract emoji attributes from node attrs
const emojiAttrs = props.node?.attrs as EmojiAttrs
</script>

<template>
  <span :data-emoji="emojiAttrs?.['data-emoji']" :title="emojiAttrs?.title">
    <img
      :src="emojiAttrs?.src || `/emojis/${emojiAttrs?.emoji}`"
      :alt="emojiAttrs?.alt || emojiAttrs?.emoji"
      :width="emojiAttrs?.width || 20"
      :height="emojiAttrs?.height || 20"
    >
  </span>
</template>
