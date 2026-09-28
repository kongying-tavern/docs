<script setup lang="ts">
/* eslint-disable no-console */
import type ForumAPI from '~/forum/api/types'
import type { ImageAttachmentError } from '~/forum/services/form/imageAttachment'
import type { TopicFormTransactionStage } from '~/forum/services/form/topicFormTransaction'
import type { TopicFormData } from '~/forum/services/form/validation'
import { OctagonXIcon, XIcon } from '@lucide/vue'
import {
  createReusableTemplate,
  useEventListener,
  useMediaQuery,
} from '@vueuse/core'
import { last } from 'lodash-es'
import { computed, nextTick, ref, watch } from 'vue'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
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
import { useSitePreferences } from '~/composables/useSitePreferences'
import { isPhoneBindingRequiredError } from '~/forum/api/gitee'
import ForumImageUpload from '~/forum/components/form/ForumImageUpload.vue'
import ForumQuotedTopicCard from '~/forum/components/topic/ForumQuotedTopicCard.vue'
import { formatImageAttachmentError } from '~/forum/components/utils/submitFormUi'
import { useForumTopicQuery } from '~/forum/composables/useForumQueries'
import { rememberLoginIntent } from '~/forum/services/loginIntent'
import {
  clearQuotedTopicRequest,
  isQuotableTopicType,
  QUOTED_TOPIC_ID_PARAM,
  QUOTED_TOPIC_TYPE_PARAM,
  readQuotedTopicRequest,
} from '~/forum/services/topicQuote'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { OpsEvents, reportError, trackOp } from '~/services/telemetry'
import { toast } from '~/services/telemetry/toast'
import { formatMessage } from '~/utils/formatMessage'
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
const { reducedMotion: prefersReducedMotion } = useSitePreferences()

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
  setQuotedTopic,
  openForm,
  closeForm,
  validate,
} = useFormState()

const quotedTopicQuery = useForumTopicQuery(computed(() => formData.value.quotedTopic?.id ?? ''))
const quotedTopicData = computed(() => String(quotedTopicQuery.data.value?.id ?? '') === formData.value.quotedTopic?.id
  ? quotedTopicQuery.data.value
  : undefined)
let pendingQuotedTopicDefaultType: TopicFormData['type'] | undefined

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

interface SubmissionAlert {
  title: string
  description: string
}

const submissionAlert = ref<SubmissionAlert | null>(null)
let networkStage: TopicFormTransactionStage = 'uploading'

const quotedTopicPending = computed(() => Boolean(formData.value.quotedTopic)
  && (quotedTopicQuery.isLoading.value
    || Boolean(quotedTopicQuery.error.value)
    || !quotedTopicData.value))
const finalIsDisabled = computed(() => submitLoading.value || submissionPhase.value === 'closing' || quotedTopicPending.value)
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
    const hasQuotedTopicParams = new URL(window.location.href).searchParams.has(QUOTED_TOPIC_ID_PARAM)
      || new URL(window.location.href).searchParams.has(QUOTED_TOPIC_TYPE_PARAM)
    const quotedTopic = readQuotedTopicRequest(window.location.href)
    if (quotedTopic) {
      pendingQuotedTopicDefaultType = quotedTopic.type
      setQuotedTopic(quotedTopic)
    }
    else if (hasQuotedTopicParams) {
      toast.error(message.value.forum.topic.quote.invalid, { report: false })
    }
    if (hasQuotedTopicParams)
      clearQuotedTopicRequest(window.history, window.location.href)

    const targetTab = last(hash.split('-'))
    const requestedType = quotedTopic?.type ?? targetTab
    const targetType = requestedType && tabList.value.includes(requestedType as TopicFormData['type'])
      ? requestedType as TopicFormData['type']
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

watch(() => quotedTopicQuery.data.value, (quotedTopic) => {
  const reference = formData.value.quotedTopic
  if (!quotedTopic || !reference || String(quotedTopic.id) !== reference.id)
    return

  if (!isQuotableTopicType(quotedTopic.type)) {
    setQuotedTopic(undefined)
    pendingQuotedTopicDefaultType = undefined
    toast.error(message.value.forum.topic.quote.invalid, { report: false })
    return
  }

  const actualReference: ForumAPI.QuotedTopicReference = {
    id: String(quotedTopic.id),
    type: quotedTopic.type,
  }
  setQuotedTopic(actualReference)

  if (pendingQuotedTopicDefaultType && formData.value.type === pendingQuotedTopicDefaultType) {
    const allowedType = tabList.value.includes(actualReference.type)
      ? actualReference.type
      : undefined
    if (allowedType)
      setFormType(allowedType)
  }
  pendingQuotedTopicDefaultType = undefined
})

async function handleFormSubmit(): Promise<void> {
  if (submitLoading.value || submissionPhase.value === 'closing')
    return

  if (formData.value.quotedTopic) {
    await quotedTopicQuery.refetch()
    const quotedTopic = quotedTopicQuery.data.value
    if (quotedTopicQuery.error.value || !quotedTopic || String(quotedTopic.id) !== formData.value.quotedTopic.id)
      return
    if (!isQuotableTopicType(quotedTopic.type)) {
      setQuotedTopic(undefined)
      toast.error(message.value.forum.topic.quote.invalid, { report: false })
      return
    }
    setQuotedTopic({ id: String(quotedTopic.id), type: quotedTopic.type })
  }

  submissionAlert.value = null

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
    submissionAlert.value = null
    toast.success(message.value.forum.publish.feedbackForm.success, { id: SUBMISSION_TOAST_ID })
    trackOp(OpsEvents.topicPublish)
    initFormData()
    reset()
    return
  }

  submissionPhase.value = 'failed'
  const stage = result.stage === 'upload' ? 'upload' : 'topic'
  console.error('[forum] 反馈发布失败:', result)
  const isPhoneBinding = result.stage === 'topic' && isPhoneBindingRequiredError(result.error)
  const copy = message.value.forum.publish.feedbackForm
  submissionAlert.value = {
    title: stage === 'upload' ? copy.uploadFailed : copy.publishFailed,
    description: result.stage === 'upload'
      ? result.errors.map(imageErrorText).join('\n')
      : (isPhoneBinding ? copy.phoneBindingRequired : result.error.message),
  }
  // 与 toast 版一致的遥测口径：upload 阶段无 error 详情，topic 阶段上报原始错误
  reportError(result.stage === 'upload' ? { scene: 'up' } : { scene: 'tp', error: result.error })
  // 发送动画已关闭弹窗，失败时自动重开，让用户就地看到告警并重试
  reopenFailedForm(stage)
}

async function handleFilesSelected(files: File[]): Promise<void> {
  const result = await addFiles(files)
  if (!result.ok) {
    for (const error of result.errors)
      toast.error(imageErrorText(error), { report: false })
  }
}

async function handleRetry(id: string): Promise<void> {
  const result = await retry(id)
  if (!result.ok) {
    for (const error of result.errors)
      toast.error(imageErrorText(error), { report: false })
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
  else if (!open) {
    submissionAlert.value = null
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
    <Alert v-if="submissionAlert" variant="destructive" class="mb-3 pr-9">
      <OctagonXIcon />
      <AlertTitle>{{ submissionAlert.title }}</AlertTitle>
      <AlertDescription class="whitespace-pre-wrap break-words">
        {{ submissionAlert.description }}
      </AlertDescription>
      <button
        type="button"
        class="color-[var(--vp-c-text-2)] icon-btn right-1.5 top-1.5 absolute hover:color-[var(--vp-c-text-1)]"
        :aria-label="message.ui.button.close"
        @click="submissionAlert = null"
      >
        <XIcon class="size-3.5" />
      </button>
    </Alert>

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
        <template #after-content>
          <ForumQuotedTopicCard
            v-if="formData.quotedTopic"
            class="mt-3 w-full"
            :reference="formData.quotedTopic"
            :topic="quotedTopicData"
            :loading="quotedTopicQuery.isLoading.value || (!quotedTopicData && !quotedTopicQuery.error.value)"
            :unavailable="Boolean(quotedTopicQuery.error.value)"
            :interactive="false"
            @retry="quotedTopicQuery.refetch()"
          />
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
        <!-- 放弃草稿销毁用户内容，破坏性选项与保留选项需要视觉区分 -->
        <AlertDialogCancel
          class="text-destructive border-destructive/40 hover:bg-destructive/10"
          @click="discardCurrentDraft"
        >
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
