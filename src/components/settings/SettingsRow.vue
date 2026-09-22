<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  alignStart?: boolean
}>()
</script>

<template>
  <div class="settings-row" :class="{ 'items-start': alignStart }">
    <div class="settings-row-copy">
      <div class="settings-row-title">
        {{ title }}
      </div>
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
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
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
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.settings-row-description {
  margin-block-start: 3px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 20px;
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
