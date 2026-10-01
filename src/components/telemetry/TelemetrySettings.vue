<script setup lang="ts">
import { computed, onMounted } from 'vue'
import ClipboardCopyButton from '@/components/ui/ClipboardCopyButton.vue'
import { Switch } from '@/components/ui/switch'
import { useLocalized } from '@/hooks/useLocalized'
import SettingsRow from '~/components/settings/SettingsRow.vue'
import {
  disableReporting,
  enableReporting,
  ensureSession,
  reportingEnabled,
} from '~/services/telemetry'
import { currentSupportCode } from '~/services/telemetry/session'

const { message } = useLocalized()
const sessionId = computed(() => reportingEnabled.value ? currentSupportCode.value : null)

const reportingDescription = computed(() =>
  reportingEnabled.value
    ? message.value.forum.telemetry.description
    : message.value.forum.telemetry.stateDisabled,
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
      :title="message.forum.telemetry.enable"
      :description="reportingDescription"
    >
      <Switch
        :model-value="reportingEnabled"
        :aria-label="message.forum.telemetry.enable"
        @update:model-value="setReporting"
      />
    </SettingsRow>

    <SettingsRow
      v-if="reportingEnabled && sessionId"
      :title="message.forum.telemetry.sessionId"
    >
      <template #description>
        <span>{{ message.forum.telemetry.sessionHint }}</span>
      </template>
      <ClipboardCopyButton
        class="telemetry-session-copy"
        :value="sessionId"
        :label="message.forum.telemetry.copySessionId"
        :display-label="sessionId"
        :success-label="message.forum.telemetry.copySuccess"
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
  font-size: calc(16px * var(--site-ui-scale));
  line-height: calc(22px * var(--site-ui-scale));
}

@media (max-width: 639px) {
  .telemetry-session-copy {
    width: 100%;
  }
}
</style>
