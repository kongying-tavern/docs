<script setup lang="ts">
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@theme/components/ui/alert-dialog/index.ts'
import { Alert, AlertDescription } from '@theme/components/ui/alert/index.ts'
import { Button } from '@theme/components/ui/button/index.ts'
import { useI18n } from 'vue-i18n'

defineProps<{ error?: string }>()
const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('forum.publish.feedbackForm.deleteDraftTitle') }}</AlertDialogTitle>
        <AlertDialogDescription>{{ t('forum.publish.feedbackForm.deleteDraftDescription') }}</AlertDialogDescription>
      </AlertDialogHeader>
      <Alert v-if="error" variant="destructive" role="alert">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t('ui.button.cancel') }}</AlertDialogCancel>
        <Button type="button" variant="destructive" @click="emit('confirm')">
          {{ t('forum.publish.feedbackForm.deleteDraft') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
