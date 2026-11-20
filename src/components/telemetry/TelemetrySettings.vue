<script setup lang="ts">
import { ClipboardCopyButton } from '@theme/components/ui/clipboard-copy-button/index.ts'
import { Switch } from '@theme/components/ui/switch/index.ts'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingsRow from '@/src/features/settings/SettingsRow.vue'
import {
  disableReporting,
  enableReporting,
  ensureSession,
  reportingEnabled,
} from '@/src/services/telemetry/index.ts'
import { currentSupportCode } from '@/src/services/telemetry/session.ts'

const { t } = useI18n({ useScope: 'global' })
const sessionId = computed(() => reportingEnabled.value ? currentSupportCode.value : null)

const reportingDescription = computed(() =>
  reportingEnabled.value
    ? t('forum.telemetry.description')
    : t('forum.telemetry.stateDisabled'),
)

onMounted(() => {
  if (reportingEnabled.value)
    ensureSession()
})

function setReporting(enabled: boolean): void {
  if (enabled === reportingEnabled.value)
    return

  if (!enabled) {
    disableReporting()
  }
  else {
    enableReporting()
  }
}
</script>

<template>
  <div class="telemetry-settings">
    <SettingsRow
      :title="t('forum.telemetry.enable')"
      :description="reportingDescription"
    >
      <Switch
        :model-value="reportingEnabled"
        :aria-label="t('forum.telemetry.enable')"
        @update:model-value="setReporting"
      />
    </SettingsRow>

    <SettingsRow
      v-if="reportingEnabled && sessionId"
      :title="t('forum.telemetry.sessionId')"
    >
      <template #description>
        <span>{{ t('forum.telemetry.sessionHint') }}</span>
      </template>
      <ClipboardCopyButton
        class="telemetry-session-copy"
        :value="sessionId"
        :label="t('forum.telemetry.copySessionId')"
        :display-label="sessionId"
        :success-label="t('forum.telemetry.copySuccess')"
      />
    </SettingsRow>
  </div>
</template>

<style scoped>
.telemetry-settings {
  display: contents;
}

.telemetry-session-copy {
  max-width: 100%;
  font-family: var(--vp-font-family-mono);
  @apply text-ui-16;
  @apply leading-ui-22;
}

@media (max-width: 639px) {
  .telemetry-session-copy {
    width: 100%;
  }
}
</style>
