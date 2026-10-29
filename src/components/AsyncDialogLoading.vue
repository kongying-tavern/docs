<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import AsyncContentLoading from './AsyncContentLoading.vue'

defineOptions({ inheritAttrs: false })
defineProps<{ error?: Error }>()
const emit = defineEmits<{ close: [], retry: [] }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <Dialog :open="true" @update:open="open => !open && emit('close')">
    <DialogContent>
      <DialogTitle class="sr-only">
        {{ error ? t('ui.asyncContent.failed') : t('ui.button.loading') }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ t('ui.button.loading') }}
      </DialogDescription>
      <AsyncContentLoading :error="error" @retry="emit('retry')" />
    </DialogContent>
  </Dialog>
</template>
