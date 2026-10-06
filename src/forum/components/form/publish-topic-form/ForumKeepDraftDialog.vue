<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'

defineProps<{ saving: boolean, error: string }>()
const emit = defineEmits<{ save: [], discard: [] }>()
const open = defineModel<boolean>('open', { required: true })
const { message } = useLocalized()
const saveButton = useTemplateRef<InstanceType<typeof Button>>('saveButton')
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent @open-auto-focus.prevent="saveButton?.$el?.focus()" @escape-key-down="saving && $event.preventDefault()">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ message.forum.publish.feedbackForm.keepDraftTitle }}</AlertDialogTitle>
        <AlertDialogDescription>{{ message.forum.publish.feedbackForm.keepDraftDescription }}</AlertDialogDescription>
      </AlertDialogHeader>
      <Alert v-if="error" variant="destructive" role="alert">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      <AlertDialogFooter>
        <Button type="button" variant="ghost" :disabled="saving" @click="emit('discard')">
          {{ message.forum.publish.feedbackForm.discardDraft }}
        </Button>
        <Button ref="saveButton" type="button" :disabled="saving" :aria-busy="saving" @click="emit('save')">
          <span v-if="saving" class="i-lucide-loader-circle animate-spin" data-icon="inline-start" aria-hidden="true" />
          {{ saving ? message.forum.publish.feedbackForm.savingDraft : message.forum.publish.feedbackForm.keepDraft }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
