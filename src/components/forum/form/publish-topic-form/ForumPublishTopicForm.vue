<script setup lang="ts">
import type { ImageAttachmentError } from '~/services/forum/form/imageAttachment'
import type { TopicFormTransactionStage } from '~/services/forum/form/topicFormTransaction'
import type { TopicFormData } from '~/services/forum/form/validation'
import {
  createReusableTemplate,
  useEventListener,
  useMediaQuery,
} from '@vueuse/core'
import { last } from 'lodash-es'
import { computed, nextTick, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogDescription,
  DialogScrollContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useHashChecker } from '@/hooks/useHashChecker'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import ForumImageUpload from '~/components/forum/form/ForumImageUpload.vue'
import { formatImageAttachmentError, formatMessage } from '~/components/forum/utils/forumUi'
import { rememberLoginIntent } from '~/services/forum/loginIntent'
import { useFormState } from '../composables/useFormState'
import { useFormSubmit } from '../composables/useFormSubmit'
import ForumFormActionBar from '../ForumFormActionBar.vue'
import ForumFormActions from '../ForumFormActions.vue'
import ForumFormContent from '../ForumFormContent.vue'
import ForumFormTabs from '../ForumFormTabs.vue'
import { FORM_HASH } from './config'

const userAuth = useUserAuthStore()
const { message } = useLocalized()
const isDesktop = useMediaQuery('(min-width: 768px)')
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const {
  isOpen,
  inSwitchTabTransition,
  formData,
  formTabs,
  tabList,
  nextTab,
  hasPermission,
  switchTab,
  initFormData,
  isDirty,
  saveDraft,
  discardDraft,
  setFormType,
  openForm,
  closeForm,
  validate,
} = useFormState()

const {
  submitLoading,
  addFiles,
  attachments,
  progress,
  remove,
  retry,
  handleSubmit: submitForm,
  reset,
} = useFormSubmit()

const [UseForm, Form] = createReusableTemplate()
const [UseUploader, Uploader] = createReusableTemplate()

type SubmissionPhase = 'idle' | 'closing' | 'uploading' | 'publishing' | 'failed' | 'succeeded'

const SEND_MOTION_MS = 260
const SUBMISSION_TOAST_ID = 'forum-topic-submission'
const submissionPhase = ref<SubmissionPhase>('idle')
const draftPromptOpen = ref(false)
const validationErrorCount = ref(0)
const firstInvalidField = ref<string>()
let networkStage: TopicFormTransactionStage = 'uploading'

const finalIsDisabled = computed(() => submitLoading.value || submissionPhase.value === 'closing')
const imageSelectionDisabled = computed(() => submitLoading.value)

function imageErrorText(error: ImageAttachmentError): string {
  return formatImageAttachmentError(error, message.value.forum.publish.feedbackForm)
}

function updateUploadToast(): void {
  const copy = message.value.forum.publish.feedbackForm
  toast.loading(formatMessage(copy.uploadingImages, {
    settled: progress.value.settled,
    total: progress.value.total,
  }), { id: SUBMISSION_TOAST_ID })
}

function focusFirstInvalid(): void {
  if (!firstInvalidField.value)
    return
  const id = firstInvalidField.value === 'text' ? 'content' : firstInvalidField.value
  const target = document.getElementById(id)
  target?.focus()
  target?.scrollIntoView({ behavior: prefersReducedMotion.value ? 'auto' : 'smooth', block: 'center' })
}

async function closeAfterSend(): Promise<void> {
  await nextTick()
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      closeForm()
      if (submissionPhase.value === 'closing')
        submissionPhase.value = networkStage
      resolve()
    }, prefersReducedMotion.value ? 0 : SEND_MOTION_MS)
  })
}

function reopenFailedForm(stage: 'upload' | 'topic'): void {
  openForm()
  nextTick(() => {
    if (stage === 'upload') {
      const retryButton = document.querySelector<HTMLElement>('[data-status="failed"] button')
      retryButton?.focus()
      retryButton?.scrollIntoView({ block: 'center' })
    }
  })
}

useHashChecker(
  [FORM_HASH, ...tabList.value.map((val: string) => `${FORM_HASH}-${val}`)],
  (hash: string) => {
    if (!userAuth.isTokenValid) {
      rememberLoginIntent(hash)
      return true
    }
    const targetTab = last(hash.split('-'))
    const targetType = targetTab && tabList.value.includes(targetTab as TopicFormData['type'])
      ? targetTab as TopicFormData['type']
      : undefined

    if (targetType) {
      setFormType(targetType)
    }
    isOpen.value = true
  },
  {
    redirectHash: 'login-alert',
  },
)

async function handleFormSubmit(): Promise<void> {
  if (submitLoading.value || submissionPhase.value === 'closing')
    return

  const validation = await validate()
  if (!validation.valid) {
    const fields = Object.keys(validation.errors)
    validationErrorCount.value = fields.length
    firstInvalidField.value = fields[0]
    await nextTick()
    focusFirstInvalid()
    return
  }

  validationErrorCount.value = 0
  firstInvalidField.value = undefined
  const draft = structuredClone(formData.value)
  submissionPhase.value = 'closing'
  networkStage = progress.value.total > progress.value.settled ? 'uploading' : 'publishing'

  if (networkStage === 'uploading')
    updateUploadToast()
  else
    toast.loading(message.value.forum.publish.feedbackForm.publishing, { id: SUBMISSION_TOAST_ID })

  const closeCompletion = closeAfterSend()
  const result = await submitForm(
    draft,
    hasPermission.value,
    undefined,
    (stage) => {
      networkStage = stage
      if (stage === 'uploading' && progress.value.total > progress.value.settled)
        updateUploadToast()
      else if (stage === 'publishing')
        toast.loading(message.value.forum.publish.feedbackForm.publishing, { id: SUBMISSION_TOAST_ID })
    },
  )
  await closeCompletion

  if (result.ok) {
    submissionPhase.value = 'succeeded'
    toast.success(message.value.forum.publish.feedbackForm.success, { id: SUBMISSION_TOAST_ID })
    initFormData()
    reset()
    return
  }

  submissionPhase.value = 'failed'
  const stage = result.stage === 'upload' ? 'upload' : 'topic'
  const description = result.stage === 'upload'
    ? result.errors.map(imageErrorText).join('\n')
    : result.error.message
  toast.error(
    stage === 'upload'
      ? message.value.forum.publish.feedbackForm.uploadFailed
      : message.value.forum.publish.feedbackForm.publishFailed,
    {
      id: SUBMISSION_TOAST_ID,
      description,
      action: {
        label: message.value.forum.publish.feedbackForm.returnToForm,
        onClick: () => reopenFailedForm(stage),
      },
    },
  )
}

async function handleFilesSelected(files: File[]): Promise<void> {
  const result = await addFiles(files)
  if (!result.ok) {
    for (const error of result.errors)
      toast.error(imageErrorText(error))
  }
}

async function handleRetry(id: string): Promise<void> {
  const result = await retry(id)
  if (!result.ok) {
    for (const error of result.errors)
      toast.error(imageErrorText(error))
  }
}

function handleClose(): void {
  if (submitLoading.value || submissionPhase.value === 'closing')
    return
  if (!isDirty.value) {
    closeForm()
    return
  }
  draftPromptOpen.value = true
}

function handleOpenChange(open: boolean): void {
  if (open)
    openForm()
  else
    void handleClose()
}

function keepDraft(): void {
  saveDraft()
  draftPromptOpen.value = false
  closeForm()
}

function discardCurrentDraft(): void {
  discardDraft()
  draftPromptOpen.value = false
  closeForm()
}

function saveDirtyDraft(): void {
  if (isDirty.value)
    saveDraft()
}

useEventListener('pagehide', saveDirtyDraft)
useEventListener('beforeunload', saveDirtyDraft)

watch(progress, () => {
  if (submitLoading.value && networkStage === 'uploading' && progress.value.total)
    updateUploadToast()
}, { deep: true })

watch(isOpen, (open) => {
  if (open && !submitLoading.value) {
    submissionPhase.value = 'idle'
    validationErrorCount.value = 0
  }
})
</script>

<template>
  <UseUploader v-slot="{ size }">
    <ForumImageUpload
      :attachments="attachments"
      :disabled="imageSelectionDisabled"
      :size="size"
      @files-selected="handleFilesSelected"
      @remove="remove"
      @retry="handleRetry"
    />
  </UseUploader>

  <UseForm>
    <ForumFormTabs
      :model-value="formData.type"
      :tabs="formTabs"
      :has-permission="hasPermission"
      @update:model-value="setFormType"
    >
      <ForumFormContent :tabs="formTabs" @files-selected="handleFilesSelected">
        <template #uploader="{ size }">
          <Uploader :size="size" />
        </template>
      </ForumFormContent>
    </ForumFormTabs>
  </UseForm>

  <Dialog v-if="isDesktop" :open="isOpen" @update:open="handleOpenChange">
    <DialogScrollContent
      class="form-container paper mx-auto p-0 flex flex-col max-w-none w-[min(800px,calc(100vw-32px))] shadow-[var(--vp-shadow-3)] overflow-visible before:pos-absolute"
      :hide-default-close-button="true"
      :data-phase="submissionPhase"
      :class="{ 'animate-switching': inSwitchTabTransition }"
    >
      <DialogTitle class="sr-only">
        {{ message.forum.publish.title }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ message.forum.publish.form.content.placeholder }}
      </DialogDescription>

      <form class="letter-form flex flex-col" @submit.prevent="handleFormSubmit">
        <div class="form-motion-surface flex flex-col">
          <Form />

          <ForumFormActions
            :loading="submitLoading"
            :disabled="finalIsDisabled"
            :error-count="validationErrorCount"
            @close="handleClose"
            @review-errors="focusFirstInvalid"
          />
        </div>

        <ForumFormActionBar
          :next-tab="nextTab"
          :in-transition="inSwitchTabTransition"
          @close="handleClose"
          @switch-tab="switchTab"
        />
      </form>
    </DialogScrollContent>
  </Dialog>

  <Drawer v-else :open="isOpen" @update:open="handleOpenChange">
    <DrawerContent class="form-container max-h-[calc(100dvh-8px)] overflow-hidden" :data-phase="submissionPhase">
      <DrawerTitle class="sr-only">
        {{ message.forum.publish.title }}
      </DrawerTitle>
      <DrawerDescription class="sr-only">
        {{ message.forum.publish.form.content.placeholder }}
      </DrawerDescription>
      <form class="letter-form flex flex-col min-h-0" @submit.prevent="handleFormSubmit">
        <Form />
        <ForumFormActions
          :loading="submitLoading"
          :disabled="finalIsDisabled"
          :error-count="validationErrorCount"
          @close="handleClose"
          @review-errors="focusFirstInvalid"
        />
      </form>
    </DrawerContent>
  </Drawer>

  <AlertDialog v-model:open="draftPromptOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ message.forum.publish.feedbackForm.keepDraftTitle }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ message.forum.publish.feedbackForm.keepDraftDescription }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="discardCurrentDraft">
          {{ message.forum.publish.feedbackForm.discardDraft }}
        </AlertDialogCancel>
        <AlertDialogAction @click="keepDraft">
          {{ message.forum.publish.feedbackForm.keepDraft }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style lang="scss" src="./ForumPublishTopicForm.scss"></style>
