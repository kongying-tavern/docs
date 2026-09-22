<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  direction: 'previous' | 'next'
  label: string
  visible?: boolean
  autoHide?: boolean
  size?: 'small' | 'medium'
}>(), {
  visible: true,
  autoHide: false,
  size: 'medium',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const animatedVisible = ref(false)
let enterFrame: number | undefined

function syncVisibility(visible: boolean) {
  if (enterFrame !== undefined)
    cancelAnimationFrame(enterFrame)
  enterFrame = undefined

  if (!visible) {
    animatedVisible.value = false
    return
  }

  enterFrame = requestAnimationFrame(() => {
    animatedVisible.value = true
    enterFrame = undefined
  })
}

watch(() => props.visible, syncVisibility)

onMounted(() => syncVisibility(props.visible))

onBeforeUnmount(() => {
  if (enterFrame !== undefined)
    cancelAnimationFrame(enterFrame)
})
</script>

<template>
  <button
    type="button"
    class="forum-image-navigation-button"
    :class="[
      `forum-image-navigation-button-${size}`,
      { 'is-visible': animatedVisible, 'is-auto-hide': autoHide },
    ]"
    :aria-label="label"
    :aria-hidden="visible ? undefined : 'true'"
    :disabled="!visible"
    @click="emit('click', $event)"
  >
    <span
      :class="direction === 'previous' ? 'i-lucide-chevron-left' : 'i-lucide-chevron-right'"
      aria-hidden="true"
    />
  </button>
</template>

<style scoped>
.forum-image-navigation-button {
  display: grid;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 9999px;
  background: var(--forum-media-overlay);
  backdrop-filter: blur(12px);
  color: var(--forum-media-on-overlay);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  scale: 0.82;
  transition:
    opacity 160ms ease-out,
    scale 180ms cubic-bezier(0.2, 0, 0, 1),
    background-color 120ms ease-out;
}

.forum-image-navigation-button-small {
  width: 34px;
  height: 34px;
}

.forum-image-navigation-button-medium {
  width: 44px;
  height: 44px;
}

.forum-image-navigation-button-small span {
  width: 18px;
  height: 18px;
}

.forum-image-navigation-button-medium span {
  width: 22px;
  height: 22px;
}

.forum-image-navigation-button.is-visible {
  opacity: 1;
  pointer-events: auto;
  scale: 1;
}

.forum-image-navigation-button.is-auto-hide {
  opacity: 0;
  pointer-events: none;
  scale: 0.82;
}

:global(.forum-preview-stage:hover) .forum-image-navigation-button.is-auto-hide,
.forum-image-navigation-button.is-auto-hide:focus-visible {
  opacity: 1;
  pointer-events: auto;
  scale: 1;
}

:global(.forum-preview-root.closing) .forum-image-navigation-button {
  opacity: 0;
  pointer-events: none;
  scale: 0.82;
}

@media (hover: hover) and (pointer: fine) {
  .forum-image-navigation-button:hover {
    background: var(--forum-media-overlay-strong);
    scale: 1.06;
  }
}

.forum-image-navigation-button:active {
  scale: 0.96;
}

.forum-image-navigation-button:focus-visible {
  outline: 2px solid var(--forum-media-on-overlay);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .forum-image-navigation-button {
    transition: none;
  }
}
</style>
