<script setup lang="ts">
import type { EmojiAttrs } from './types'
import { computed } from 'vue'

const props = withDefaults(defineProps<EmojiAttrs>(), {
  width: 20,
  height: 20,
})

const computedSrc = computed(() => {
  return props.src || `/emojis/${props.emoji}`
})

const computedAlt = computed(() => {
  return props.alt || props.emoji
})
</script>

<template>
  <span :data-emoji="emoji" :title="title || emoji">
    <img
      :src="computedSrc"
      :alt="computedAlt"
      :width="width"
      :height="height"
      class="emoji-image"
    >
  </span>
</template>

<style scoped>
.emoji-image {
  display: inline-block;
  vertical-align: text-bottom;
}
</style>
