<script setup lang="ts">
import { CheckIcon, CopyIcon } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { toast } from '~/services/telemetry/toast'

const props = withDefaults(defineProps<{
  value: string
  label: string
  successLabel: string
  displayLabel?: string
  compact?: boolean
}>(), {
  compact: false,
})

const { t } = useI18n({ useScope: 'global' })
const { copy, copied, isSupported } = useClipboard({ copiedDuring: 1500 })

async function handleCopy() {
  const ok = await copy(props.value).catch(() => false)
  if (ok === false)
    toast.error(t('settings.copyFailed'))
}
</script>

<template>
  <Button
    v-if="isSupported"
    type="button"
    variant="outline"
    :size="compact ? 'icon-xs' : 'sm'"
    :aria-label="copied ? successLabel : label"
    :title="copied ? successLabel : label"
    @click.stop="handleCopy"
  >
    <CheckIcon v-if="copied" class="text-[var(--vp-c-brand-1)]" />
    <CopyIcon v-else />
    <span v-if="!compact">{{ copied ? successLabel : (displayLabel ?? label) }}</span>
  </Button>
</template>
