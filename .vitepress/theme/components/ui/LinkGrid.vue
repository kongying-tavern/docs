<script setup lang="ts">
import { withBase } from 'vitepress'

defineProps<{
  items: Integration[]
}>()

interface Integration {
  icon: string
  name: string
  link: string
  target?: string
  secondary?: string
}
</script>

<template>
  <div class="slide-enter flex flex-wrap gap-4">
    <a
      v-for="item of items"
      :key="item.name"
      :href="item.link"
      :target="item.target"
      :title="withBase(item.link)"
      class="Link h-30 w-30 flex flex-col items-center justify-center text-center text-inherit"
    >
      <div
        v-if="item.icon.startsWith('i')"
        :class="item.icon"
        class="mb2 h-10 w-10"
      />
      <img
        v-else
        :src="withBase(item.icon)"
        class="no-zoomable mb-2 h-10 w-10"
      >
      <span class="text-sm font-[var(--vp-font-family-subtitle)]">{{
        item.name
      }}</span>
      <span class="text-xs opacity-50">{{ item.secondary }}</span>
    </a>
  </div>
</template>

<style scoped>
.Link {
  color: inherit !important;
  text-decoration: none !important;
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
  transition:
    border-color 0.25s,
    background-color 0.25s;
}

.Link:hover {
  color: var(--vp-c-brand) !important;
  border-color: var(--vp-c-brand) !important;
}
</style>
