<script setup lang="ts">
import type { SettingsSectionId } from '~/composables/useSettingsNavigation'
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import TelemetrySettings from '~/components/telemetry/TelemetrySettings.vue'
import ForumLabelAdminPage from '~/forum/components/settings/ForumLabelAdminPage.vue'
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

const { localeIndex } = useData()
const { message } = useLocalized()
const privacyHref = computed(() => withBase(`${getLangPath(localeIndex.value)}privacy`))
</script>

<template>
  <SettingsSection
    v-if="showAll || activeSection === 'appearance'"
    id="appearance"
    :title="message.settings.appearance.title"
    :show-heading="showAll"
  >
    <AppearanceSettings />
  </SettingsSection>

  <SettingsSection
    v-if="showAll || activeSection === 'notifications'"
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
</template>

<style scoped>
.privacy-policy-link {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-3);
  font-size: calc(13px * var(--site-ui-scale));
  line-height: calc(20px * var(--site-ui-scale));
}

.privacy-policy-link:hover {
  color: var(--vp-c-text-2);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
