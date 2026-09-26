<script setup lang="ts">
import type { SettingsNavigationItem, SettingsSectionId } from '~/composables/useSettingsNavigation'

defineOptions({ inheritAttrs: false })

defineProps<{
  items: SettingsNavigationItem[]
  activeSection: SettingsSectionId
  hashPrefix?: string
  drilldown?: boolean
}>()

const emit = defineEmits<{
  select: [section: SettingsSectionId]
}>()
</script>

<template>
  <nav v-bind="$attrs" class="settings-navigation" :class="{ drilldown }">
    <a
      v-for="item in items"
      :key="item.id"
      :href="`#${hashPrefix ? `${hashPrefix}/` : ''}${item.id}`"
      class="settings-navigation-item"
      :class="{ active: !drilldown && activeSection === item.id }"
      :aria-current="!drilldown && activeSection === item.id ? 'page' : undefined"
      @click.prevent="emit('select', item.id)"
    >
      <span :class="item.icon" class="settings-navigation-icon icon-btn" aria-hidden="true" />
      <span class="settings-navigation-label">{{ item.label }}</span>
      <span v-if="drilldown" class="i-lucide-chevron-right settings-navigation-chevron icon-btn" aria-hidden="true" />
    </a>
  </nav>
</template>

<style scoped>
.settings-navigation {
  display: grid;
  gap: 4px;
}

.settings-navigation-item {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 11px;
  border-radius: 9px;
  padding: 8px 12px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition:
    background-color 160ms ease-out,
    color 160ms ease-out;
}

.settings-navigation-item:hover,
.settings-navigation-item:focus-visible {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.settings-navigation-item:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.settings-navigation-item.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.settings-navigation-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin-block-start: 0;
}

.settings-navigation-label {
  min-width: 0;
  flex: 1;
  color: inherit;
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 600;
  line-height: calc(20px * var(--site-ui-scale));
}

.settings-navigation-chevron {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  color: var(--vp-c-text-3);
}

.settings-navigation.drilldown .settings-navigation-item {
  min-height: 48px;
}
</style>
