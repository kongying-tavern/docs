<script setup lang="ts">
import { Switch } from '@/components/ui/switch'
import { useLocalized } from '@/hooks/useLocalized'
import SettingsRow from '~/components/settings/SettingsRow.vue'
import SettingsSection from '~/components/settings/SettingsSection.vue'
import { useAccountLoginExperiment } from '~/forum/composables/state/useAccountLoginExperiment'
import { useFeedbackFormExperiment } from '~/forum/composables/state/useFeedbackFormExperiment'

const { message } = useLocalized()
const { canManage, enabled, assignedVariant } = useFeedbackFormExperiment()
const { enabled: accountLoginEnabled } = useAccountLoginExperiment()
</script>

<template>
  <SettingsSection v-if="canManage" id="experiments" :title="message.settings.experiments.title">
    <SettingsRow
      :title="assignedVariant === 'compact' ? message.settings.experiments.legacyFeedbackForm : message.settings.experiments.feedbackForm"
      :description="assignedVariant === 'compact' ? message.settings.experiments.legacyDescription : message.settings.experiments.description"
      label-for="experiment-feedback-form"
    >
      <Switch id="experiment-feedback-form" v-model="enabled" />
    </SettingsRow>
    <SettingsRow
      :title="message.settings.experiments.accountLogin"
      :description="message.settings.experiments.accountLoginDescription"
      label-for="experiment-account-login"
    >
      <Switch id="experiment-account-login" v-model="accountLoginEnabled" />
    </SettingsRow>
  </SettingsSection>
</template>
