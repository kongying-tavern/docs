<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  alignStart?: boolean
  labelFor?: string
}>()
</script>

<template>
  <div class="settings-row" :class="{ 'items-start': alignStart }">
    <div class="settings-row-copy">
      <component :is="labelFor ? 'label' : 'div'" :for="labelFor" class="settings-row-title">
        {{ title }}
      </component>
      <div v-if="description || $slots.description" class="settings-row-description">
        <slot name="description">
          {{ description }}
        </slot>
      </div>
    </div>
    <div class="settings-row-control">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.settings-row {
  position: relative;
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px;
  background: transparent;
}

.settings-row:not(:last-child)::after {
  position: absolute;
  bottom: 0;
  inset-inline: 16px;
  height: 1px;
  background: var(--vp-c-divider);
  content: '';
}

.settings-row.items-start {
  align-items: flex-start;
}

.settings-row-copy {
  min-width: 0;
  flex: 1;
}

.settings-row-title {
  color: var(--vp-c-text-1);
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 600;
  line-height: calc(20px * var(--site-ui-scale));
}

.settings-row-description {
  margin-block-start: 3px;
  color: var(--vp-c-text-2);
  font-size: calc(13px * var(--site-ui-scale));
  line-height: calc(20px * var(--site-ui-scale));
}

.settings-row-control {
  display: flex;
  min-width: 0;
  flex: 0 0 auto;
  align-items: center;
}

@media (max-width: 639px) {
  .settings-row {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }

  .settings-row.items-start {
    align-items: stretch;
  }

  .settings-row-control {
    width: 100%;
  }
}
</style>
