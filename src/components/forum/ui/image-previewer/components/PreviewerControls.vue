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
  border-radius: 10px;
  border: 0;
  background: var(--forum-media-glass);
  backdrop-filter: blur(12px);
  color: var(--forum-media-on-overlay);
  cursor: pointer;
  transition:
    opacity 200ms ease,
    transform 220ms ease,
    background-color 160ms ease;
}

.forum-preview-close:hover {
  background: var(--forum-media-glass-hover);
}

.forum-preview-dots {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  transition:
    opacity 200ms ease,
    transform 220ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .forum-preview-close,
  .forum-preview-dots {
    transition: none !important;
  }
}
</style>
