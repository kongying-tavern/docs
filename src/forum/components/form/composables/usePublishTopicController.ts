/* eslint-disable no-console */
import type { FeedbackFormVariant } from '~/forum/services/form/feedbackFormExperiment'
import type { ImageAttachmentError } from '~/forum/services/form/imageAttachment'
import type { TopicFormData } from '~/forum/services/form/validation'
import { useEventListener } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { isPhoneBindingRequiredError } from '~/forum/api/gitee'
import { formatImageAttachmentError } from '~/forum/components/utils/submitFormUi'
import { useForumTopicQuery } from '~/forum/composables/data/useForumQueries'
import { useHashChecker } from '~/forum/hooks/useHashChecker'
import { resolvePublishTopicType } from '~/forum/services/form/publishTopicEntry'
import { readSavedTopicDrafts } from '~/forum/services/form/topicDraft'
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
import { useTopicDraftPersistence } from './useTopicDraftPersistence'

export interface PublishTopicPresentation {
  focusValidation: (field?: string) => void
  settleSend: () => Promise<void>
  focusUploadFailure: () => void
  createMore?: () => boolean
}

export function usePublishTopicController(presentation: () => PublishTopicPresentation | null, onEvent?: (event: 'attempt' | 'success' | 'failed' | 'validation') => void, variant: () => FeedbackFormVariant = () => 'compact') {
  const userAuth = useUserAuthStore()
  const { message } = useLocalized()
  const userInfo = useUserInfoStore()
  const username = computed(() => userInfo.info?.login || 'Guest')
  const draftsEnabled = () => variant() === 'compact'

  const {
    isOpen,
    formData,
    formTabs,
    tabList,
    nextTab,
    hasPermission,
    switchTab: advanceTab,
    initFormData,
    isDirty: textIsDirty,
    savedAttachments,
    saveDraft: persistDraft,
    discardDraft,
    deleteDraft,
    setFormType: updateFormType,
    setQuotedTopic,
    setPrivate: updatePrivate,
    openForm,
    closeForm,
    validate,
  } = useFormState(draftsEnabled)

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
    restore,
    serializedAttachments,
    getQueue,
  } = useFormSubmit(computed(() => formData.value.type), draftsEnabled)

  const draftSaving = ref(false)
  const draftSaveError = ref('')
  const draftPersistence = useTopicDraftPersistence({
    getQueue,
    persist: persistDraft,
    uploadError: errors => errors.map(imageErrorText).join('\n'),
    storageError: () => message.value.forum.publish.feedbackForm.draftSaveFailed,
  })
  const autoSaveState = computed(() => draftPersistence.states.get(formData.value.type))
  const autoSaveEnabled = computed(() => draftsEnabled() && (autoSaveState.value?.enabled ?? false))
  watch(draftsEnabled, (enabled) => {
    if (!enabled) {
      for (const type of draftPersistence.states.keys())
        draftPersistence.stop(type)
    }
  }, { flush: 'sync' })
  const autoSaveStatus = computed(() => autoSaveState.value?.status ?? 'saved')
  const savedAt = computed(() => autoSaveState.value?.savedAt ?? 0)
  const editorIdle = ref(true)
  let editorIdleTimer: ReturnType<typeof setTimeout> | undefined
  function markEditorActive(): void {
    clearTimeout(editorIdleTimer)
    editorIdle.value = false
    editorIdleTimer = setTimeout(() => editorIdle.value = true, 1200)
  }
  const isDirty = computed(() => textIsDirty.value
    || attachments.value.some(image => image.status !== 'uploaded')
    || JSON.stringify(serializedAttachments.value) !== JSON.stringify(savedAttachments.value))

  type SubmissionPhase = 'idle' | 'submitting' | 'uploading' | 'publishing' | 'failed' | 'succeeded'

  const SUBMISSION_TOAST_ID = 'forum-topic-submission'
  const lastPublishedAt = ref<number | null>(null)
  const showCreateMore = ref(false)
  const CREATE_MORE_REOPEN_WINDOW_MS = 5 * 60_000
  watch(username, () => {
    lastPublishedAt.value = null
    showCreateMore.value = false
  }, { flush: 'sync' })
  const submissionPhase = ref<SubmissionPhase>('idle')
  const submissionBusy = ref(false)
  const entryPage = ref<'types' | 'form'>('form')
  const choosingType = computed(() => entryPage.value === 'types')
  const editingSavedDraft = ref(false)
  let entryTargetType: TopicFormData['type'] | undefined
  function resolveEntryPage(targetType?: TopicFormData['type']): 'types' | 'form' {
    return targetType || variant() === 'legacy' ? 'form' : 'types'
  }
  function initializeEntryPage(): void {
    if (submissionBusy.value || submissionPhase.value === 'succeeded' || editingSavedDraft.value)
      return
    entryPage.value = resolveEntryPage(entryTargetType)
  }
  watch(() => formData.value.type, () => {
    editingSavedDraft.value = false
  }, { flush: 'sync' })
  const draftPromptOpen = ref(false)
  const deleteDraftPromptOpen = ref(false)
  const deleteDraftError = ref('')
  const validationErrorCount = ref(0)
  const firstInvalidField = ref<string>()

  interface SubmissionAlert {
    title: string
    description: string
  }

  const submissionAlert = ref<SubmissionAlert | null>(null)

  const quotedTopicPending = computed(() => Boolean(formData.value.quotedTopic)
    && (quotedTopicQuery.isLoading.value
      || Boolean(quotedTopicQuery.error.value)
      || !quotedTopicData.value))
  const finalIsDisabled = computed(() => draftSaving.value || submissionBusy.value || quotedTopicPending.value)
  const imageSelectionDisabled = computed(() => submissionBusy.value || draftSaving.value)

  function setFormType(type: TopicFormData['type'], carryReference = true): void {
    if (!draftSaving.value && !submissionBusy.value)
      updateFormType(type, carryReference)
  }

  function setPrivate(isPrivate: boolean): void {
    if (draftsEnabled() && !draftSaving.value && !submissionBusy.value)
      updatePrivate(isPrivate)
  }

  function switchTab(): void {
    if (!draftSaving.value && !submissionBusy.value)
      advanceTab()
  }

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
    try {
      await presentation()?.settleSend()
    }
    catch (error) {
      console.warn('[forum] Send animation failed:', error)
    }
    closeForm()
  }

  function reopenFailedForm(stage: 'upload' | 'topic'): void {
    openForm()
    if (stage === 'upload')
      presentation()?.focusUploadFailure()
  }

  let pendingDraftHash: string | undefined
  function resumeDraft(hash: string): void {
    if (!userAuth.isTokenValid || !draftsEnabled() || draftSaving.value || submissionBusy.value)
      return
    const type = resolvePublishTopicType(hash, tabList.value)
    openForm()
    if (type && readSavedTopicDrafts(tabList.value).some(draft => draft.type === type))
      selectSavedDraft(type)
    else
      entryPage.value = 'types'
  }
  watch(() => userInfo.info, (info) => {
    if (!info || !pendingDraftHash)
      return
    const hash = pendingDraftHash
    pendingDraftHash = undefined
    resumeDraft(hash)
  }, { flush: 'post' })

  useHashChecker(
    [FORM_HASH, ...tabList.value.flatMap((val: string) => [`${FORM_HASH}-${val}`, `${FORM_HASH}-DRAFT-${val}`])],
    (hash: string) => {
      pendingDraftHash = undefined
      if (draftSaving.value || submissionBusy.value)
        return
      if (!userAuth.isTokenValid) {
        rememberLoginIntent(hash)
        return true
      }
      if (hash.startsWith(`${FORM_HASH}-DRAFT-`)) {
        if (!userInfo.info) {
          pendingDraftHash = hash
          void userInfo.refreshUserInfo().catch(() => {
            if (pendingDraftHash === hash)
              pendingDraftHash = undefined
          })
          return
        }
        resumeDraft(hash)
        return
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

      const targetType = resolvePublishTopicType(hash, tabList.value, quotedTopic?.type)
      editingSavedDraft.value = false
      entryTargetType = targetType
      entryPage.value = resolveEntryPage(targetType)
      openForm(targetType)
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
    if (draftSaving.value || submissionBusy.value)
      return
    submissionBusy.value = true
    let closeCompletion: Promise<void> | undefined
    try {
      onEvent?.('attempt')

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
        onEvent?.('validation')
        const fields = Object.keys(validation.errors)
        validationErrorCount.value = fields.length
        firstInvalidField.value = fields[0]
        focusFirstInvalid()
        return
      }

      validationErrorCount.value = 0
      firstInvalidField.value = undefined
      const draft = structuredClone(formData.value)
      const createMore = showCreateMore.value && (presentation()?.createMore?.() ?? false)
      submissionPhase.value = 'submitting'
      if (progress.value.total > progress.value.settled)
        updateUploadToast()
      else
        toast.loading(message.value.forum.publish.feedbackForm.publishing, { id: SUBMISSION_TOAST_ID })

      closeCompletion = closeAfterSend()
      const result = await submitForm(
        draft,
        hasPermission.value,
        undefined,
        (stage) => {
          submissionPhase.value = stage
          if (stage === 'uploading' && progress.value.total > progress.value.settled)
            updateUploadToast()
          else if (stage === 'publishing')
            toast.loading(message.value.forum.publish.feedbackForm.publishing, { id: SUBMISSION_TOAST_ID })
        },
      )
      await closeCompletion

      if (result.ok) {
        lastPublishedAt.value = Date.now()
        onEvent?.('success')
        submissionPhase.value = 'succeeded'
        submissionAlert.value = null
        toast.success(message.value.forum.publish.feedbackForm.success, { id: SUBMISSION_TOAST_ID })
        trackOp(OpsEvents.topicPublish)
        draftPersistence.stop(draft.type)
        try {
          initFormData(draft.type)
          reset(draft.type)
        }
        catch (error) {
          // Publication is already committed; local cleanup must not invite a duplicate retry.
          reportError({ scene: 'tp', error })
          toast.error(message.value.forum.publish.feedbackForm.draftSaveFailed, { report: false })
          return
        }
        if (createMore) {
          openForm()
          presentation()?.focusValidation(draft.type === 'BUG' ? 'text' : 'title')
        }
        return
      }

      submissionPhase.value = 'failed'
      onEvent?.('failed')
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
    catch (error) {
      await closeCompletion
      const stage = submissionPhase.value === 'uploading' ? 'upload' : 'topic'
      submissionPhase.value = 'failed'
      onEvent?.('failed')
      toast.dismiss(SUBMISSION_TOAST_ID)
      const copy = message.value.forum.publish.feedbackForm
      submissionAlert.value = {
        title: stage === 'upload' ? copy.uploadFailed : copy.publishFailed,
        description: error instanceof Error ? error.message : copy.publishFailed,
      }
      reportError({ scene: stage === 'upload' ? 'up' : 'tp', error })
      reopenFailedForm(stage)
    }
    finally {
      submissionBusy.value = false
    }
  }

  async function handleFilesSelected(files: File[]): Promise<void> {
    if (imageSelectionDisabled.value)
      return
    const result = await addFiles(files)
    if (!result.ok) {
      for (const error of result.errors)
        toast.error(imageErrorText(error), { report: false })
    }
  }

  async function handleRetry(id: string): Promise<void> {
    const type = formData.value.type
    const result = await retry(id)
    if (!result.ok) {
      for (const error of result.errors)
        toast.error(imageErrorText(error), { report: false })
    }
    else if (draftPersistence.states.get(type)?.enabled) {
      void draftPersistence.flush(type)
    }
  }

  async function handleClose(): Promise<void> {
    if (draftSaving.value || submissionBusy.value)
      return
    if (!draftsEnabled()) {
      closeForm()
      return
    }
    draftSaveError.value = ''
    const type = formData.value.type
    if (autoSaveEnabled.value && isDirty.value) {
      draftSaving.value = true
      try {
        if (await draftPersistence.flush(type)) {
          closeForm()
          return
        }
        draftSaveError.value = draftPersistence.states.get(type)?.error ?? ''
      }
      finally {
        draftSaving.value = false
      }
    }
    if (!isDirty.value) {
      closeForm()
      return
    }
    draftPromptOpen.value = true
  }

  function handleOpenChange(open: boolean): void {
    if (draftSaving.value || submissionBusy.value)
      return
    if (open) {
      if (isOpen.value)
        return
      editingSavedDraft.value = false
      entryTargetType = undefined
      entryPage.value = resolveEntryPage()
      openForm()
    }
    else {
      void handleClose()
    }
  }

  function selectInitialType(type: TopicFormData['type']): void {
    if (draftSaving.value || submissionBusy.value || !tabList.value.includes(type))
      return
    setFormType(type)
    editingSavedDraft.value = false
    entryPage.value = 'form'
  }

  function returnToTypeSelection(): void {
    if (!isOpen.value || draftSaving.value || submissionBusy.value)
      return
    entryPage.value = 'types'
  }

  function selectSavedDraft(type: TopicFormData['type']): void {
    if (!draftsEnabled() || draftSaving.value || submissionBusy.value || !tabList.value.includes(type)
      || !readSavedTopicDrafts(tabList.value).some(draft => draft.type === type)) {
      return
    }
    setFormType(type, false)
    draftPersistence.activate(type)
    editingSavedDraft.value = true
    entryPage.value = 'form'
  }

  function requestDeleteDraft(): void {
    if (!draftsEnabled() || !editingSavedDraft.value || draftSaving.value || submissionBusy.value)
      return
    deleteDraftError.value = ''
    deleteDraftPromptOpen.value = true
  }

  function confirmDeleteDraft(): void {
    if (!draftsEnabled() || draftSaving.value || submissionBusy.value)
      return
    const type = formData.value.type
    try {
      deleteDraft()
      draftPersistence.stop(type)
      reset(type)
      deleteDraftPromptOpen.value = false
      editingSavedDraft.value = false
      closeForm()
    }
    catch {
      deleteDraftError.value = message.value.forum.publish.feedbackForm.deleteDraftFailed
    }
  }

  async function saveDraft(): Promise<boolean> {
    if (!draftsEnabled() || draftSaving.value || submissionBusy.value)
      return false
    draftSaving.value = true
    draftSaveError.value = ''
    const type = formData.value.type
    try {
      const saved = await draftPersistence.save(type)
      if (!saved)
        draftSaveError.value = draftPersistence.states.get(type)?.error ?? ''
      return saved
    }
    finally {
      draftSaving.value = false
    }
  }

  watch([formData, () => attachments.value.map(image => image.id).join(','), autoSaveEnabled], () => {
    if (!autoSaveEnabled.value || !isDirty.value || submitLoading.value || draftSaving.value)
      return
    draftPersistence.schedule(formData.value.type)
  }, { deep: true })

  onBeforeUnmount(() => {
    clearTimeout(editorIdleTimer)
  })

  async function keepDraft(): Promise<void> {
    if (await saveDraft()) {
      draftPromptOpen.value = false
      closeForm()
    }
  }

  function discardCurrentDraft(): void {
    if (draftSaving.value)
      return
    draftPersistence.cancel(formData.value.type)
    discardDraft()
    restore(savedAttachments.value)
    draftSaveError.value = ''
    draftPromptOpen.value = false
    closeForm()
  }

  function saveDirtyDraft(): void {
    if (draftsEnabled() && isDirty.value)
      draftPersistence.saveSnapshot(formData.value.type)
  }

  useEventListener('pagehide', saveDirtyDraft)
  useEventListener('beforeunload', (event) => {
    saveDirtyDraft()
    if (isDirty.value || submissionBusy.value || draftSaving.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  })

  watch(progress, () => {
    if (submitLoading.value && submissionPhase.value === 'uploading' && progress.value.total)
      updateUploadToast()
  }, { deep: true })

  watch(isOpen, (open) => {
    if (open) {
      const elapsed = lastPublishedAt.value === null ? Infinity : Date.now() - lastPublishedAt.value
      showCreateMore.value = draftsEnabled() && elapsed >= 0 && elapsed < CREATE_MORE_REOPEN_WINDOW_MS
    }
    if (open && !submissionBusy.value) {
      submissionPhase.value = 'idle'
      validationErrorCount.value = 0
    }
    else if (!open) {
      submissionAlert.value = null
    }
  }, { flush: 'sync' })

  return {
    form: { showCreateMore, entryPage, choosingType, editingSavedDraft, autoSaveEnabled, autoSaveStatus, savedAt, editorIdle, deleteDraftPromptOpen, deleteDraftError, isOpen, formData, formTabs, nextTab, hasPermission, username, quotedTopicData, quotedTopicQuery, draftPromptOpen, isDirty, draftSaving, draftSaveError },
    upload: { attachments, imageSelectionDisabled, remove, handleFilesSelected, handleRetry },
    submission: { submitLoading, submissionPhase, submissionAlert, validationErrorCount, finalIsDisabled },
    actions: { initializeEntryPage, markEditorActive, requestDeleteDraft, confirmDeleteDraft, selectInitialType, returnToTypeSelection, handleFormSubmit, handleClose, handleOpenChange, keepDraft, discardCurrentDraft, setFormType, switchTab, focusFirstInvalid, saveDraft, setPrivate, setQuotedTopic, clearAttachments: reset },
  }
}

export type PublishTopicController = ReturnType<typeof usePublishTopicController>
