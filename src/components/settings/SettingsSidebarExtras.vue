<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { SETTINGS_SECTION_DEFINITIONS } from '~/config/settingsOptions'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { isBrowserTranslationSupported } from '~/forum/services/browserTranslation'
import { consumeSettingsReturnUrl } from '~/services/settingsNavigation'

const { localeIndex, page } = useData()
const router = useRouter()
const { message } = useLocalized()
const { hasAnyPermissions } = useRuleChecks()
const canManageLabels = hasAnyPermissions('manage_feedback')
const isLabelAdminPage = computed(() => page.value.relativePath.includes('settings-labels'))
const activeSection = ref('appearance')
const translationSupported = ref(false)
const returnDepth = ref(1)
const returnDepthStateKey = '__settingsReturnDepth'

const settingsItems = computed(() => SETTINGS_SECTION_DEFINITIONS
  .filter(section => section.group === 'website')
  .filter(section => section.id !== 'language' || translationSupported.value)
  .map(section => ({
    ...section,
    label: message.value.settings[section.id].title,
  })))

function settingsHref(section: string): string {
  return withBase(`${getLangPath(localeIndex.value)}settings#${section}`)
}

function syncActiveSection(): void {
  activeSection.value = location.hash.slice(1) || 'appearance'
}

function syncReturnDepth(): void {
  // VitePress 为页内锚点新增历史记录，返回按钮要跳过这些设置分区。
  const depth = history.state?.[returnDepthStateKey]
  if (Number.isInteger(depth) && depth > 0) {
    returnDepth.value = depth
    return
  }

  returnDepth.value += 1
  history.replaceState({ ...history.state, [returnDepthStateKey]: returnDepth.value }, '')
}

onMounted(() => {
  translationSupported.value = isBrowserTranslationSupported()
  syncActiveSection()
  const depth = history.state?.[returnDepthStateKey]
  if (Number.isInteger(depth) && depth > 0) {
    returnDepth.value = depth
  }
  else {
    history.replaceState({ ...history.state, [returnDepthStateKey]: returnDepth.value }, '')
  }
})
useEventListener('hashchange', () => {
  syncActiveSection()
  syncReturnDepth()
})
useEventListener('popstate', () => {
  syncActiveSection()
  const depth = history.state?.[returnDepthStateKey]
  returnDepth.value = Number.isInteger(depth) && depth > 0 ? depth : 1
})

function fallbackHref(): string {
  return withBase(`${getLangPath(localeIndex.value)}feedback`)
}

function goBack(): void {
  const saved = consumeSettingsReturnUrl()
  if (saved && saved !== location.href && history.length > returnDepth.value) {
    history.go(-returnDepth.value)
    return
  }
  if (document.referrer && document.referrer !== location.href && new URL(document.referrer).origin === location.origin && history.length > 1) {
    history.back()
    return
  }
  void router.go(saved && saved !== location.href ? saved : fallbackHref())
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
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 500;
  line-height: calc(20px * var(--site-ui-scale));
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
