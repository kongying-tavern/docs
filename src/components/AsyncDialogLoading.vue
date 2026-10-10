<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useLocalized } from '@/hooks/useLocalized'
import AsyncContentLoading from './AsyncContentLoading.vue'

defineOptions({ inheritAttrs: false })
defineProps<{ error?: Error }>()
const emit = defineEmits<{ close: [], retry: [] }>()
const { message } = useLocalized()
</script>

<template>
  <Dialog :open="true" @update:open="open => !open && emit('close')">
    <DialogContent>
      <DialogTitle class="sr-only">
        {{ error ? message.ui.asyncContent.failed : message.ui.button.loading }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ message.ui.button.loading }}
      </DialogDescription>
      <AsyncContentLoading :error="error" @retry="emit('retry')" />
    </DialogContent>
  </Dialog>
</template>
