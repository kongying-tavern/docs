<script setup lang="ts">
import type { FORUM } from '../types'
import ForumResponsiveMenu from './responsive/ForumResponsiveMenu.vue'

defineProps<{
  items: FORUM.MenuElement[]
  label: string
  title: string
  disabled?: boolean
}>()
</script>

<template>
  <ForumResponsiveMenu :items="items" :title="title" align="start">
    <template #trigger>
      <button
        type="button"
        class="forum-topic-property-trigger"
        :disabled="disabled"
        :aria-label="`${title}: ${label}`"
        @pointerdown.stop
        @click.stop
      >
        <slot>{{ label }}</slot>
        <span class="i-lucide-chevron-down forum-topic-property-chevron" aria-hidden="true" />
      </button>
    </template>
  </ForumResponsiveMenu>
</template>

<style scoped>
.forum-topic-property-trigger {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.forum-topic-property-chevron {
  width: 12px;
  height: 12px;
  opacity: 0;
  transition: opacity 0.15s;
}

.forum-topic-property-trigger:hover,
.forum-topic-property-trigger[data-state='open'] {
  color: var(--vp-c-text-1);
}

.forum-topic-property-trigger:hover .forum-topic-property-chevron,
.forum-topic-property-trigger:focus-visible .forum-topic-property-chevron,
.forum-topic-property-trigger[data-state='open'] .forum-topic-property-chevron {
  opacity: 1;
}

.forum-topic-property-trigger:focus-visible {
  outline: 2px solid oklch(var(--ring));
  outline-offset: 2px;
  border-radius: 2px;
}

.forum-topic-property-trigger:disabled {
  opacity: 0.5;
  cursor: wait;
}

@media (hover: none) {
  .forum-topic-property-chevron {
    opacity: 1;
  }
}

html[data-reduced-motion='true'] .forum-topic-property-chevron {
  transition: none;
}
</style>
