/* eslint-disable no-console */
import type { ImageAttachmentError } from '~/forum/services/form/imageAttachment'
import type { TopicFormTransactionStage } from '~/forum/services/form/topicFormTransaction'
import type { TopicFormData } from '~/forum/services/form/validation'
import { useEventListener } from '@vueuse/core'
import { last } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { isPhoneBindingRequiredError } from '~/forum/api/gitee'
import { formatImageAttachmentError } from '~/forum/components/utils/submitFormUi'
import { useForumTopicQuery } from '~/forum/composables/data/useForumQueries'
import { useHashChecker } from '~/forum/hooks/useHashChecker'
import { clearQuotedTopicRequest, isQuotableTopicType, QUOTED_TOPIC_ID_PARAM, QUOTED_TOPIC_TYPE_PARAM, readQuotedTopicRequest } from '~/forum/services/forumTopicQuote'
import { rememberLoginIntent } from '~/forum/services/loginIntent'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { OpsEvents, reportError, trackOp } from '~/services/telemetry'
import { toast } from '~/services/telemetry/toast'
import { formatMessage } from '~/utils/formatMessage'
import { FORM_HASH } from '../publish-topic-form/config'
import { useFormState } from './useFormState'
import { useFormSubmit } from './useFormSubmit'

export interface PublishTopicPresentation {
  focusValidation: (field?: string) => void
  settleSend: () => Promise<void>
  focusUploadFailure: () => void
}

export function usePublishTopicController(presentation: () => PublishTopicPresentation | null) {
  const userAuth = useUserAuthStore()
  const { message } = useLocalized()
  const userInfo = useUserInfoStore()
  const username = computed(() => userInfo.info?.login || 'Guest')

  const {
    isOpen,
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

  type SubmissionPhase = 'idle' | 'submitting' | 'uploading' | 'publishing' | 'failed' | 'succeeded'

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
  const finalIsDisabled = computed(() => submitLoading.value || submissionPhase.value === 'submitting' || quotedTopicPending.value)
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
    presentation()?.focusValidation(firstInvalidField.value)
  }

  async function closeAfterSend(): Promise<void> {
    await presentation()?.settleSend()
    closeForm()
    if (submissionPhase.value === 'submitting')
      submissionPhase.value = networkStage
  }

  function reopenFailedForm(stage: 'upload' | 'topic'): void {
    openForm()
    if (stage === 'upload')
      presentation()?.focusUploadFailure()
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

    const actualReference: NonNullable<TopicFormData['quotedTopic']> = {
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
    if (submitLoading.value || submissionPhase.value === 'submitting')
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
      focusFirstInvalid()
      return
    }

    validationErrorCount.value = 0
    firstInvalidField.value = undefined
    const draft = structuredClone(formData.value)
    submissionPhase.value = 'submitting'
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
    toast.dismiss(SUBMISSION_TOAST_ID)
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
    if (submitLoading.value || submissionPhase.value === 'submitting')
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

  return {
    form: { isOpen, formData, formTabs, nextTab, hasPermission, username, quotedTopicData, quotedTopicQuery, draftPromptOpen },
    upload: { attachments, imageSelectionDisabled, remove, handleFilesSelected, handleRetry },
    submission: { submitLoading, submissionPhase, submissionAlert, validationErrorCount, finalIsDisabled },
    actions: { handleFormSubmit, handleClose, handleOpenChange, keepDraft, discardCurrentDraft, setFormType, switchTab, focusFirstInvalid },
  }
}

export type PublishTopicController = ReturnType<typeof usePublishTopicController>
