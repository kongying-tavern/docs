<script setup lang="ts">
import { X } from '@lucide/vue'
import { useLocalized } from '@/hooks/useLocalized'

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

  <div
    v-if="showDots !== false && total > 1"
    class="forum-preview-dots"
  >
    <button
      v-for="(_, dotIndex) in total"
      :key="dotIndex"
      type="button"
      class="forum-preview-dot"
      :class="{ active: dotIndex === index }"
      :aria-label="`${dotIndex + 1}`"
      @click.stop="emit('select', dotIndex)"
    />
  </div>
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
  transition: opacity 200ms ease, transform 220ms ease, background-color 160ms ease;
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
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  transition: opacity 200ms ease, transform 220ms ease;
}

.forum-preview-dot {
  box-sizing: content-box;
  width: 8px;
  height: 8px;
  padding: 5px;
  border: 0;
  border-radius: 9999px;
  background: var(--forum-media-dot);
  background-clip: content-box;
  cursor: pointer;
  transition: width 200ms ease, background-color 200ms ease;
}

.forum-preview-dot:hover {
  background-color: var(--forum-media-dot-hover);
}

.forum-preview-dot.active {
  width: 22px;
  background-color: var(--forum-media-on-overlay);
}

@media (prefers-reduced-motion: reduce) {
  .forum-preview-close,
  .forum-preview-dots,
  .forum-preview-dot {
    transition: none !important;
  }
}
</style>
