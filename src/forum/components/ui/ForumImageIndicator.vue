<script setup lang="ts">
import { computed } from 'vue'

const { tone = 'overlay', continuous = false, ariaLabel = undefined, ariaLabels = [], progress, total } = defineProps<{
  total: number
  progress: number
  tone?: 'overlay' | 'surface'
  continuous?: boolean
  ariaLabel?: string
  ariaLabels?: string[]
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

const activeIndex = computed(() => Math.min(
  Math.max(Math.round(progress), 0),
  Math.max(0, total - 1),
))

function markerStyle(index: number): Record<string, string> {
  const proximity = Math.max(0, 1 - Math.abs(index - progress))
  return {
    width: `${14 + proximity * 10}px`,
    opacity: `${0.35 + proximity * 0.65}`,
  }
}
</script>

<template>
  <div
    class="forum-image-indicator"
    :class="[`forum-image-indicator-${tone}`, { 'is-continuous': continuous }]"
    role="group"
    :aria-label="ariaLabel ?? `${activeIndex + 1} / ${total}`"
  >
    <button
      v-for="dotIndex in total"
      :key="dotIndex"
      type="button"
      class="forum-image-indicator-marker"
      :style="markerStyle(dotIndex - 1)"
      :aria-current="activeIndex === dotIndex - 1 ? 'true' : undefined"
      :aria-label="ariaLabels[dotIndex - 1] ?? String(dotIndex)"
      @click.stop="emit('select', dotIndex - 1)"
    />
  </div>
</template>

<style scoped>
.forum-image-indicator {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 10px 16px;
}

.forum-image-indicator-overlay {
  --forum-image-indicator-color: var(--forum-media-on-overlay);
}

.forum-image-indicator-surface {
  --forum-image-indicator-color: var(--vp-c-text-2);
}

.forum-image-indicator-marker {
  box-sizing: content-box;
  height: 7px;
  padding: 5px 2px;
  border: 0;
  border-radius: 9999px;
  background: var(--forum-image-indicator-color);
  background-clip: content-box;
  cursor: pointer;
  transition:
    width 200ms ease,
    opacity 200ms ease;
}

.forum-image-indicator-marker:hover {
  opacity: 1 !important;
}

.forum-image-indicator.is-continuous .forum-image-indicator-marker {
  transition: none;
}

.forum-image-indicator-marker:focus-visible {
  outline: 2px solid var(--forum-image-indicator-color);
  outline-offset: 2px;
}

html[data-reduced-motion='true'] .forum-image-indicator-marker {
  transition: none;
}
</style>
