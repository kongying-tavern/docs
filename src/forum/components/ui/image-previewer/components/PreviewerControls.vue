<script setup lang="ts">
import { X } from '@lucide/vue'
import { useLocalized } from '@/hooks/useLocalized'
import ForumImageIndicator from '../../ForumImageIndicator.vue'

defineProps<{
  index: number
  total: number
  showDots?: boolean
}>()

const emit = defineEmits<{
  close: []
  select: [index: number]
}>()

const { message } = useLocalized()
</script>

<template>
  <button
    type="button"
    class="forum-preview-close"
    :aria-label="message.ui.button.close"
    @click.stop="emit('close')"
  >
    <X class="size-5" />
  </button>

  <ForumImageIndicator
    v-if="showDots !== false && total > 1"
    class="forum-preview-dots"
    :progress="index"
    :total="total"
    @select="emit('select', $event)"
  />
</template>

<style scoped>
.forum-preview-close {
  position: absolute;
  top: 16px;
  right: 20px;
  z-index: 2;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--vp-c-white) 16%, transparent);
  background: var(--forum-media-glass);
  backdrop-filter: blur(12px);
  color: var(--forum-media-on-overlay);
  cursor: pointer;
  transition:
    opacity 200ms ease,
    transform 220ms ease,
    background-color 160ms ease,
    border-color 160ms ease;
}

.forum-preview-close:hover {
  background: var(--forum-media-glass-hover);
  border-color: color-mix(in srgb, var(--vp-c-white) 28%, transparent);
}

.forum-preview-close svg {
  transition: transform 260ms cubic-bezier(0.34, 1.4, 0.64, 1);
}

.forum-preview-close:hover svg {
  transform: rotate(90deg) scale(1.1);
}

.forum-preview-close:active {
  transform: scale(0.94);
}

.forum-preview-dots.forum-image-indicator {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  padding: 6px 14px;
  border: 1px solid color-mix(in srgb, var(--vp-c-white) 14%, transparent);
  border-radius: 9999px;
  background: var(--forum-media-glass);
  backdrop-filter: blur(12px);
  transition:
    opacity 200ms ease,
    transform 220ms ease;
}

.forum-preview-dots .forum-image-indicator-marker {
  transition:
    width 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .forum-preview-close,
  .forum-preview-dots {
    transition: none !important;
  }

  .forum-preview-close svg {
    transition: none;
  }
}
</style>
