<script setup lang="ts">
defineProps<{
  id: string
  title: string
  description: string
}>()
</script>

<template>
  <section :id="id" class="settings-section" tabindex="-1">
    <header class="settings-section-header">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </header>
    <div class="settings-section-body">
      <slot />
    </div>
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
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}

.settings-section-header p {
  margin-block-start: 4px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 22px;
}

.settings-section-body {
  display: grid;
  gap: 12px;
}
</style>
