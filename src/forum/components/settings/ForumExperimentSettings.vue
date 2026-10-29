<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Switch } from '@/components/ui/switch'
import SettingsRow from '~/components/settings/SettingsRow.vue'
import SettingsSection from '~/components/settings/SettingsSection.vue'
import { useAccountLoginExperiment } from '~/forum/composables/state/useAccountLoginExperiment'
import { useFeedbackFormExperiment } from '~/forum/composables/state/useFeedbackFormExperiment'

const { t } = useI18n({ useScope: 'global' })
const { canManage, enabled, assignedVariant } = useFeedbackFormExperiment()
const { enabled: accountLoginEnabled } = useAccountLoginExperiment()
</script>

<template>
  <SettingsSection v-if="canManage" id="experiments" :title="t('settings.experiments.title')">
    <SettingsRow
      :title="assignedVariant === 'compact' ? t('settings.experiments.legacyFeedbackForm') : t('settings.experiments.feedbackForm')"
      :description="assignedVariant === 'compact' ? t('settings.experiments.legacyDescription') : t('settings.experiments.description')"
      label-for="experiment-feedback-form"
    >
      <Switch id="experiment-feedback-form" v-model="enabled" />
    </SettingsRow>
    <SettingsRow
      :title="t('settings.experiments.accountLogin')"
      :description="t('settings.experiments.accountLoginDescription')"
      label-for="experiment-account-login"
    >
      <Switch id="experiment-account-login" v-model="accountLoginEnabled" />
    </SettingsRow>
  </SettingsSection>
</template>
