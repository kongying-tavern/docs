import type { TopicFormData } from '~/forum/services/form/validation'
import { useForm } from 'vee-validate'
import { computed, reactive, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import {
  createDefaultTopicDraft,
  readTopicDraft,
  removeTopicDraft,
  restoreTopicDraft,
  writeTopicDraft,
} from '~/forum/services/form/topicDraft'
import { createTopicFormSchema, getAllowedTopicTypes } from '~/forum/services/form/validation'
import { getFormTabsConfig } from '../publish-topic-form/form-config'

export function useFormState(draftsEnabled: () => boolean = () => true) {
  const loadDraft = (type: TopicFormData['type']) => draftsEnabled()
    ? readTopicDraft(type)
    : { ...createDefaultTopicDraft(), type }
  const { message } = useLocalized()
  const { hasAnyPermissions } = useRuleChecks()
  const hasPermission = hasAnyPermissions('manage_feedback')
  const formTabs = computed(() => getFormTabsConfig(message, hasPermission))

  const isOpen = ref(false)
  const currentTabIndex = ref<number>(0)

  /**
   * In-memory drafts kept per topic type. Each type holds its own working
   * copy so the content of the BUG/FEAT tabs never mixes or overwrites and
   * switching away preserves unsaved edits for the next visit.
   */
  const draftSessions = new Map<TopicFormData['type'], TopicFormData>()
  const initialDraft = loadDraft('BUG')
  const savedBaselines = reactive(new Map<TopicFormData['type'], TopicFormData>([['BUG', initialDraft]]))

  const validationSchema = computed(() => createTopicFormSchema(message, hasPermission.value))
  const {
    resetForm: resetValidationForm,
    setFieldValue,
    validate,
    values,
  } = useForm({
    validationSchema,
    initialValues: initialDraft,
    // Fields unmount every time the dialog/drawer closes; keep their values so
    // the draft survives a same-session reopen.
    keepValuesOnUnmount: true,
  })

  const formData = computed(() => restoreTopicDraft(values))
  function textIdentity(draft: TopicFormData): string {
    return JSON.stringify([draft.type, draft.title, draft.text, draft.tags, draft.quotedTopic ?? null, draft.isPrivate === true])
  }
  const isDirty = computed(() => textIdentity(formData.value)
    !== textIdentity(savedBaselines.get(formData.value.type) ?? loadDraft(formData.value.type)))
  const savedAttachments = computed(() => (savedBaselines.get(formData.value.type) ?? loadDraft(formData.value.type)).attachments ?? [])

  const tabList = computed(() => {
    return getAllowedTopicTypes(hasPermission.value)
  })

  const nextTabIndex = computed(() => {
    return (currentTabIndex.value + 1) % tabList.value.length
  })

  const nextTab = computed(() => {
    return formTabs.value.find(val => val.value === tabList.value[nextTabIndex.value])
  })

  function snapshotDraft(type: TopicFormData['type']): void {
    const current = formData.value
    draftSessions.set(type, { ...current, type, tags: [...current.tags] })
  }

  function applyDraft(type: TopicFormData['type']): void {
    if (!savedBaselines.has(type))
      savedBaselines.set(type, { ...loadDraft(type), type })
    const draft = draftSessions.get(type) ?? loadDraft(type)
    resetValidationForm({ values: { ...draft, type, tags: [...draft.tags], isPrivate: draft.isPrivate === true } })
  }

  watch(draftsEnabled, () => {
    draftSessions.clear()
    savedBaselines.clear()
    applyDraft(formData.value.type)
  }, { flush: 'sync' })

  function switchTab(): void {
    const targetType = tabList.value[nextTabIndex.value]
    if (!targetType)
      return
    setFormType(targetType)
  }

  function initFormData(type = formData.value.type): void {
    const freshDraft = { ...createDefaultTopicDraft(), type }
    if (draftsEnabled())
      writeTopicDraft(type, freshDraft)
    draftSessions.set(type, freshDraft)
    savedBaselines.set(type, freshDraft)
    if (type === formData.value.type)
      resetValidationForm({ values: { ...freshDraft, isPrivate: false } })
  }

  function saveDraft(attachments: NonNullable<TopicFormData['attachments']> = [], type = formData.value.type, reset = true): void {
    const working = type === formData.value.type ? formData.value : draftSessions.get(type) ?? loadDraft(type)
    const draft = restoreTopicDraft({ ...working, type, tags: [...working.tags], attachments })
    if (!draftsEnabled())
      return
    writeTopicDraft(type, draft)
    draftSessions.set(type, draft)
    savedBaselines.set(type, draft)
    if (reset && type === formData.value.type)
      resetValidationForm({ values: { ...draft, isPrivate: draft.isPrivate === true } })
  }

  function discardDraft(): void {
    const type = formData.value.type
    const draft = loadDraft(type)
    draftSessions.set(type, draft)
    savedBaselines.set(type, draft)
    resetValidationForm({ values: { ...draft, isPrivate: draft.isPrivate === true } })
  }

  function deleteDraft(): void {
    const type = formData.value.type
    if (!draftsEnabled())
      return
    removeTopicDraft(type)
    const freshDraft = { ...createDefaultTopicDraft(), type }
    draftSessions.delete(type)
    savedBaselines.set(type, freshDraft)
    resetValidationForm({ values: { ...freshDraft, isPrivate: false } })
  }

  function setFormType(type: (typeof tabList.value)[number], carryReference = true): void {
    if (!tabList.value.includes(type))
      return
    const prevType = formData.value.type
    if (prevType !== type) {
      const quotedTopic = formData.value.quotedTopic
      snapshotDraft(prevType)
      applyDraft(type)
      if (quotedTopic && carryReference)
        setFieldValue('quotedTopic', quotedTopic)
    }
    currentTabIndex.value = tabList.value.indexOf(type)
  }

  function setPrivate(isPrivate: boolean): void {
    setFieldValue('isPrivate', isPrivate)
  }

  function setQuotedTopic(quotedTopic?: TopicFormData['quotedTopic']): void {
    setFieldValue('quotedTopic', quotedTopic)
  }

  watch([hasPermission, () => formData.value.type], ([, type]) => {
    const allowedType = tabList.value.includes(type) ? type : tabList.value[0]
    if (allowedType)
      setFormType(allowedType)
  }, { immediate: true })

  function openForm(typeFromUrl?: (typeof tabList.value)[number]): void {
    if (typeFromUrl && tabList.value.includes(typeFromUrl)) {
      setFormType(typeFromUrl)
    }
    else if (!isOpen.value) {
      const current = values as Partial<TopicFormData> | undefined
      if (!current || current.text === undefined || current.tags === undefined)
        applyDraft(formData.value.type)
    }
    isOpen.value = true
  }

  function closeForm(): void {
    snapshotDraft(formData.value.type)
    isOpen.value = false
  }

  return {
    isOpen,
    formData,
    formTabs,
    isDirty,
    savedAttachments,

    tabList,
    nextTab,
    hasPermission,
    validate,

    switchTab,
    initFormData,
    saveDraft,
    discardDraft,
    deleteDraft,
    setFormType,
    setPrivate,
    setQuotedTopic,
    openForm,
    closeForm,
  }
}
