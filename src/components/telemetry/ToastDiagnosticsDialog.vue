<script setup lang="ts">
import { Button } from '@/components/ui/button'
import ClipboardCopyButton from '@/components/ui/ClipboardCopyButton.vue'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLocalized } from '@/hooks/useLocalized'
import { useToastDiagnostics } from '~/composables/useToastDiagnostics'

const { message } = useLocalized()
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
        <DialogTitle>{{ diagnostics?.title || message.forum.telemetry.errorDetails }}</DialogTitle>
        <DialogDescription>{{ message.forum.telemetry.errorDetails }}</DialogDescription>
      </DialogHeader>
      <pre class="toast-diagnostics-text">{{ diagnostics?.content }}</pre>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="ghost">
            {{ message.ui.button.close }}
          </Button>
        </DialogClose>
        <ClipboardCopyButton
          :value="diagnostics?.content ?? ''"
          :label="message.forum.telemetry.copyErrorInfo"
          :success-label="message.forum.telemetry.copySuccess"
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
