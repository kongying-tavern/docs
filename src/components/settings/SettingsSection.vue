<script setup lang="ts">
defineProps<{
  id: string
  title: string
  showHeading?: boolean
}>()
</script>

<template>
  <section :id="id" class="settings-section" tabindex="-1">
    <header v-if="showHeading" class="settings-section-header">
      <h2>{{ title }}</h2>
    </header>
    <div class="settings-section-body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="settings-section-footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.settings-section {
  scroll-margin-top: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 24px);
  outline: none;
}

.settings-section-header {
  margin-block-end: 20px;
}

.settings-section-header h2 {
  color: var(--vp-c-text-1);
  font-size: calc(20px * var(--site-ui-scale));
  font-weight: 600;
  line-height: calc(28px * var(--site-ui-scale));
}

.settings-section-body {
  container: settings-section / inline-size;
  display: grid;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.settings-section-footer {
  display: flex;
  margin-block-start: 12px;
  padding-inline: 16px;
}
</style>
