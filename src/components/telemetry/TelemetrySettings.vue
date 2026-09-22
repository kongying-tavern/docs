<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import ClipboardCopyButton from '@/components/ui/ClipboardCopyButton.vue'
import { useLocalized } from '@/hooks/useLocalized'
import SettingsRow from '~/components/settings/SettingsRow.vue'
import {
  clarityAvailable,
  disableReporting,
  enableReporting,
  ensureSession,
  reportingEnabled,
} from '~/services/telemetry'

defineProps<{
  privacyHref: string
}>()

const { message } = useLocalized()
const sessionId = ref<string | null>(null)
const clarityReady = ref(false)
const reportingDescription = computed(() => {
  if (!reportingEnabled.value)
    return message.value.forum.telemetry.stateDisabled

  const unavailable = clarityReady.value ? '' : ` ${message.value.forum.telemetry.unavailable}`
  return `${message.value.forum.telemetry.description}${unavailable}`
})

function refreshClarityReady(): void {
  clarityReady.value = clarityAvailable()
}

onMounted(() => {
  refreshClarityReady()
  sessionId.value = reportingEnabled.value ? ensureSession().code : null
})
useEventListener('clarity-ready', refreshClarityReady)

function toggleReporting(): void {
  if (reportingEnabled.value) {
    disableReporting()
    sessionId.value = null
  }
  else {
    enableReporting()
    sessionId.value = ensureSession().code
  }
}
</script>

<template>
  <div class="telemetry-settings">
    <SettingsRow
      :title="message.forum.telemetry.enable"
      :description="reportingDescription"
    >
      <label class="telemetry-switch">
        <input
          type="checkbox"
          role="switch"
          class="accent-[var(--vp-c-brand-1)] size-4"
          :checked="reportingEnabled"
          @change="toggleReporting"
        >
        <span class="sr-only">{{ message.forum.telemetry.enable }}</span>
      </label>
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

    <a
      class="telemetry-privacy-link"
      :href="privacyHref"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ message.forum.sidebar.privacyPolicy }}
    </a>
  </div>
</template>

<style scoped>
.telemetry-settings {
  display: grid;
  gap: 10px;
}

.telemetry-switch {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.telemetry-session-copy {
  max-width: 100%;
  font-family: var(--vp-font-family-mono);
  font-size: 16px;
  line-height: 22px;
}

.telemetry-privacy-link {
  width: fit-content;
  margin-inline-start: 4px;
  font-size: 12px;
  line-height: 18px;
  color: var(--vp-c-brand-1);
}

.telemetry-privacy-link:hover {
  text-decoration: underline;
}

@media (max-width: 639px) {
  .telemetry-switch {
    justify-content: flex-end;
  }

  .telemetry-session-copy {
    width: 100%;
  }
}
</style>
