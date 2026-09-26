<script setup lang="ts">
import type { ThemePreference } from '~/config/settingsOptions'

defineProps<{
  theme: ThemePreference
}>()
</script>

<template>
  <span class="theme-preview" :class="`theme-preview-${theme}`" aria-hidden="true">
    <template v-if="theme === 'auto'">
      <span class="theme-preview-half theme-preview-half-light">
        <span class="theme-preview-sidebar" />
        <span class="theme-preview-content"><span /><span /></span>
      </span>
      <span class="theme-preview-half theme-preview-half-dark">
        <span class="theme-preview-sidebar" />
        <span class="theme-preview-content"><span /><span /></span>
      </span>
    </template>
    <template v-else>
      <span class="theme-preview-sidebar" />
      <span class="theme-preview-content">
        <span />
        <span />
      </span>
    </template>
  </span>
</template>

<style scoped>
.theme-preview {
  display: grid;
  width: 100%;
  height: 58px;
  grid-template-columns: 28% 1fr;
  border: 1px solid var(--vp-c-divider);
  border-radius: 5px;
  overflow: hidden;
}

.theme-preview-light {
  background: #fff;
}

.theme-preview-light .theme-preview-sidebar {
  background: #f3f4f6;
}

.theme-preview-dark {
  border-color: #3f3f46;
  background: #18181b;
}

.theme-preview-dark .theme-preview-sidebar {
  background: #27272a;
}

.theme-preview-auto {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  background: transparent;
}

.theme-preview-half {
  display: grid;
  min-width: 0;
  grid-template-columns: 28% 1fr;
}

.theme-preview-half-dark {
  border-inline-start: 1px solid #3f3f46;
  background: #18181b;
}

.theme-preview-half-light {
  background: #fff;
}

.theme-preview-half-light .theme-preview-sidebar {
  background: #f3f4f6;
}

.theme-preview-half-dark .theme-preview-sidebar {
  background: #27272a;
}

.theme-preview-half .theme-preview-content {
  gap: 5px;
  padding: 5px;
}

.theme-preview-half .theme-preview-content span {
  height: 4px;
}

.theme-preview-half-dark .theme-preview-content span {
  background: #71717a;
}

.theme-preview-content {
  display: grid;
  align-content: center;
  gap: 7px;
  padding: 9px;
}

.theme-preview-content span {
  display: block;
  height: 5px;
  border-radius: 3px;
  background: #a1a1aa;
}

.theme-preview-content span:last-child {
  width: 68%;
}
</style>
