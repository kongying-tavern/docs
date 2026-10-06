<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'

defineProps<{ error?: string }>()
const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { required: true })
const { message } = useLocalized()
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ message.forum.publish.feedbackForm.deleteDraftTitle }}</AlertDialogTitle>
        <AlertDialogDescription>{{ message.forum.publish.feedbackForm.deleteDraftDescription }}</AlertDialogDescription>
      </AlertDialogHeader>
      <Alert v-if="error" variant="destructive" role="alert">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ message.ui.button.cancel }}</AlertDialogCancel>
        <Button type="button" variant="destructive" @click="emit('confirm')">
          {{ message.forum.publish.feedbackForm.deleteDraft }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
