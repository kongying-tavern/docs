<script setup lang="ts">
import { withBase } from 'vitepress'
import { computed } from 'vue'

export interface EmojiAttrs {
  emoji: string
  width?: number
  height?: number
}
const { emoji, width = 20, height = 20 } = defineProps<EmojiAttrs>()

const alt = computed(() => emoji ? `${emoji.split('/')[1].split('.')[0]}` : 'Unknown')
</script>

<template>
  <img :src="withBase(`/emojis/${emoji}`)" :alt="alt" :title="alt" :data-emoji="`:${emoji}:`" :width="width" :height="height">
</template>

<style>
.emoji-wrapper {
  display: inline-block;
}
img[data-emoji] {
  display: inline-block;
}
</style>
