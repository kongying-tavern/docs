<script setup lang="ts">
import type { SettingsSectionId } from '~/composables/useSettingsNavigation'
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import AsyncContentLoading from '~/components/AsyncContentLoading.vue'
import { defineRecoverableAsyncComponent } from '~/components/defineRecoverableAsyncComponent'
import TelemetrySettings from '~/components/telemetry/TelemetrySettings.vue'
import { useSitePreferences } from '~/composables/useSitePreferences'
import ForumTranslationSettings from '~/forum/components/settings/ForumTranslationSettings.vue'
import AppearanceSettings from './AppearanceSettings.vue'
import NotificationSettings from './NotificationSettings.vue'
import SettingsSection from './SettingsSection.vue'

defineProps<{
  activeSection: SettingsSectionId
  showAll?: boolean
  showLanguage?: boolean
  showLabelAdmin?: boolean
}>()
const ForumExperimentSettings = defineRecoverableAsyncComponent(() => import('~/forum/components/settings/ForumExperimentSettings.vue'), AsyncContentLoading)
const ForumLabelAdminPage = defineRecoverableAsyncComponent(() => import('~/forum/components/settings/ForumLabelAdminPage.vue'), AsyncContentLoading)
const ForumProfileSettings = defineRecoverableAsyncComponent(() => import('~/forum/components/settings/ForumProfileSettings.vue'), AsyncContentLoading)
const ForumShortcutSettings = defineRecoverableAsyncComponent(() => import('~/forum/components/settings/ForumShortcutSettings.vue'), AsyncContentLoading)

const { localeIndex } = useData()
const { message } = useLocalized()
const { desktopUi } = useSitePreferences()
const privacyHref = computed(() => withBase(`${getLangPath(localeIndex.value)}privacy`))
</script>

<template>
  <ForumProfileSettings v-if="activeSection === 'profile'" />
  <ForumExperimentSettings v-if="activeSection === 'experiments'" />
  <SettingsSection
    v-if="showAll || activeSection === 'appearance'"
    id="appearance"
    :title="message.settings.appearance.title"
    :show-heading="showAll"
  >
    <AppearanceSettings />
  </SettingsSection>

  <SettingsSection
    v-if="desktopUi && (showAll || activeSection === 'notifications')"
    id="notifications"
    :title="message.settings.notifications.title"
    :show-heading="showAll"
  >
    <NotificationSettings />
  </SettingsSection>

  <SettingsSection
    v-if="(showAll && showLanguage) || activeSection === 'language'"
    id="language"
    :title="message.settings.language.title"
    :show-heading="showAll"
  >
    <ForumTranslationSettings />
  </SettingsSection>

  <SettingsSection
    v-if="showAll || activeSection === 'privacy'"
    id="privacy"
    :title="message.settings.privacy.title"
    :show-heading="showAll"
  >
    <TelemetrySettings />
    <template #footer>
      <a
        class="privacy-policy-link"
        :href="privacyHref"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ message.forum.sidebar.privacyPolicy }}
        <span class="i-lucide-arrow-up-right icon-btn" aria-hidden="true" />
      </a>
    </template>
  </SettingsSection>

  <ForumLabelAdminPage v-if="showLabelAdmin && activeSection === 'labels'" embedded />
  <ForumShortcutSettings v-if="activeSection === 'shortcuts'" />
</template>

<style scoped>
.privacy-policy-link {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-3);
  @apply text-label;
}

.privacy-policy-link:hover {
  color: var(--vp-c-text-2);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
