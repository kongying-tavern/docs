<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { useData, withBase } from 'vitepress'
import { computed, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { consumeSettingsReturnUrl } from '~/services/settingsNavigation'

const { localeIndex, page } = useData()
const { message } = useLocalized()
const { hasAnyPermissions } = useRuleChecks()
const canManageLabels = hasAnyPermissions('manage_feedback')
const isLabelAdminPage = computed(() => page.value.relativePath.includes('settings-labels'))
const activeSection = ref('appearance')

const settingsItems = computed(() => [
  { id: 'appearance', label: message.value.settings.appearance.title, icon: 'i-lucide-palette' },
  { id: 'notifications', label: message.value.settings.notifications.title, icon: 'i-lucide-bell' },
  { id: 'language', label: message.value.settings.language.title, icon: 'i-lucide-languages' },
  { id: 'privacy', label: message.value.settings.privacy.title, icon: 'i-lucide-shield-check' },
])

function settingsHref(section: string): string {
  return withBase(`${getLangPath(localeIndex.value)}settings#${section}`)
}

function syncActiveSection(): void {
  activeSection.value = location.hash.slice(1) || 'appearance'
}

onMounted(syncActiveSection)
useEventListener('hashchange', syncActiveSection)

function fallbackHref(): string {
  return withBase(`${getLangPath(localeIndex.value)}feedback`)
}

function goBack(): void {
  const saved = consumeSettingsReturnUrl()
  if (saved) {
    location.assign(saved)
    return
  }
  if (document.referrer && new URL(document.referrer).origin === location.origin) {
    history.back()
    return
  }
  location.assign(fallbackHref())
}

function openLabelAdmin(): void {
  location.assign(withBase(`${getLangPath(localeIndex.value)}settings-labels`))
}
</script>

<template>
  <div class="settings-sidebar-extras">
    <Button variant="ghost" class="settings-sidebar-item settings-back" @click="goBack">
      <span class="i-lucide-arrow-left icon-btn" aria-hidden="true" />
      {{ message.settings.back }}
    </Button>
    <div class="settings-sidebar-divider" />
    <a
      v-for="item in settingsItems"
      :key="item.id"
      :href="settingsHref(item.id)"
      class="settings-sidebar-item"
      :class="{ active: !isLabelAdminPage && activeSection === item.id }"
      :aria-current="!isLabelAdminPage && activeSection === item.id ? 'location' : undefined"
    >
      <span :class="item.icon" class="icon-btn size-4" aria-hidden="true" />
      {{ item.label }}
    </a>
    <template v-if="canManageLabels">
      <div class="settings-sidebar-divider" />
      <button
        type="button"
        class="settings-sidebar-item"
        :class="{ active: isLabelAdminPage }"
        :aria-current="isLabelAdminPage ? 'location' : undefined"
        @click="openLabelAdmin"
      >
        <span class="i-lucide-tags icon-btn size-4" aria-hidden="true" />
        {{ message.forum.labelAdmin.title }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.settings-sidebar-extras {
  display: grid;
  gap: 4px;
  padding-top: 16px;
}

.settings-sidebar-item {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-align: start;
  text-decoration: none;
}

.settings-sidebar-item:hover,
.settings-sidebar-item.active {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.settings-sidebar-item.active {
  font-weight: 600;
}

.settings-back {
  color: var(--vp-c-text-1);
}

.settings-sidebar-divider {
  height: 1px;
  margin-block: 4px;
  background: var(--vp-c-divider);
}
</style>
