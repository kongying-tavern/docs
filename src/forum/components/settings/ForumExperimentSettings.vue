<script setup lang="ts">
import { Switch } from '@theme/components/ui/switch/index.ts'
import { useI18n } from 'vue-i18n'
import SettingsRow from '@/src/features/settings/SettingsRow.vue'
import SettingsSection from '@/src/features/settings/SettingsSection.vue'
import { useAccountLoginExperiment } from '@/src/forum/composables/state/useAccountLoginExperiment.ts'

const { t } = useI18n({ useScope: 'global' })
const { canManage, enabled: accountLoginEnabled } = useAccountLoginExperiment()
</script>

<template>
  <SettingsSection v-if="canManage" id="experiments" :title="t('settings.experiments.title')">
    <SettingsRow
      :title="t('settings.experiments.accountLogin')"
      :description="t('settings.experiments.accountLoginDescription')"
      label-for="experiment-account-login"
    >
      <Switch id="experiment-account-login" v-model="accountLoginEnabled" />
    </SettingsRow>
  </SettingsSection>
</template>
