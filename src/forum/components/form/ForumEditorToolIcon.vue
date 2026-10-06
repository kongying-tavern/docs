<script setup lang="ts">
defineProps<{ tool: 'emoji' | 'mention' | 'upload' }>()
const icons = {
  emoji: 'i-custom:emoji',
  mention: 'i-custom:mention',
  upload: 'i-lucide:image',
}
</script>

<template>
  <span :class="icons[tool]" class="c-[var(--vp-c-text-2)] icon-btn size-4" aria-hidden="true" />
</template>
