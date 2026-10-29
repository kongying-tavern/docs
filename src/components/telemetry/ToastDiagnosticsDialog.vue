<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import ClipboardCopyButton from '@/components/ui/ClipboardCopyButton.vue'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToastDiagnostics } from '~/composables/useToastDiagnostics'

const { t } = useI18n({ useScope: 'global' })
const { diagnostics, closeDiagnostics, restoreDiagnosticsFocus } = useToastDiagnostics()
</script>

<template>
  <Dialog :open="Boolean(diagnostics)" @update:open="value => !value && closeDiagnostics()">
    <DialogContent
      class="toast-diagnostics z-[1000000000]"
      overlay-class="z-[999999999]"
      data-clarity-mask="true"
      @close-auto-focus="restoreDiagnosticsFocus"
    >
      <DialogHeader>
        <DialogTitle>{{ diagnostics?.title || t('forum.telemetry.errorDetails') }}</DialogTitle>
        <DialogDescription>{{ t('forum.telemetry.errorDetails') }}</DialogDescription>
      </DialogHeader>
      <pre class="toast-diagnostics-text">{{ diagnostics?.content }}</pre>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="ghost">
            {{ t('ui.button.close') }}
          </Button>
        </DialogClose>
        <ClipboardCopyButton
          :value="diagnostics?.content ?? ''"
          :label="t('forum.telemetry.copyErrorInfo')"
          :success-label="t('forum.telemetry.copySuccess')"
        />
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.toast-diagnostics-text {
  margin: 0;
  min-width: 0;
  font-family: var(--vp-font-family-mono);
  @apply text-ui-13;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 959px) {
  .toast-diagnostics :deep(button) {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
