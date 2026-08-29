import type { TopicFormData } from '~/services/forum/form/validation'
import { refAutoReset } from '@vueuse/core'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/composables/useRuleChecks'
import {
  createDefaultTopicDraft,
  readTopicDraft,
  restoreTopicDraft,
  writeTopicDraft,
} from '~/services/forum/form/topicDraft'
import { createTopicFormSchema, getAllowedTopicTypes } from '~/services/forum/form/validation'
import { getFormTabsConfig, TRANSITION_DURATION } from '../publish-topic-form/config'

export function useFormState() {
  const { message } = useLocalized()
  const { hasAnyPermissions } = useRuleChecks()
  const hasPermission = hasAnyPermissions('manage_feedback')
  const formTabs = computed(() => getFormTabsConfig(message, hasPermission))

  const isOpen = ref(false)
  const currentTabIndex = ref<number>(0)
  const inSwitchTabTransition = refAutoReset(false, TRANSITION_DURATION)

  /**
   * In-memory drafts kept per topic type. Each type holds its own working
   * copy so the content of the BUG/FEAT tabs never mixes or overwrites and
   * switching away preserves unsaved edits for the next visit.
   */
  const draftSessions = new Map<TopicFormData['type'], TopicFormData>()

  const validationSchema = computed(() => createTopicFormSchema(message, hasPermission.value))
  const {
    resetForm: resetValidationForm,
    setFieldValue,
    meta,
    validate,
    values,
  } = useForm({
    validationSchema,
    initialValues: readTopicDraft('BUG'),
    // Fields unmount every time the dialog/drawer closes; keep their values so
    // the draft survives a same-session reopen.
    keepValuesOnUnmount: true,
  })

  const formData = computed(() => restoreTopicDraft(values))
  const isDirty = computed(() => meta.value.dirty)

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
    const draft = draftSessions.get(type) ?? readTopicDraft(type)
    resetValidationForm({ values: { ...draft, type, tags: [...draft.tags] } })
  }

  function switchTab(): void {
    const targetType = tabList.value[nextTabIndex.value]
    if (!targetType)
      return
    snapshotDraft(formData.value.type)
    currentTabIndex.value = nextTabIndex.value
    inSwitchTabTransition.value = true
    setTimeout(() => {
      setFieldValue('type', targetType)
      applyDraft(targetType)
    }, TRANSITION_DURATION / 2)
  }

  function initFormData(): void {
    const type = formData.value.type
    const freshDraft = createDefaultTopicDraft()
    draftSessions.set(type, freshDraft)
    writeTopicDraft(type, freshDraft)
    resetValidationForm({ values: freshDraft })
  }

  function saveDraft(): void {
    const type = formData.value.type
    const draft = { ...formData.value, type, tags: [...formData.value.tags] }
    draftSessions.set(type, draft)
    writeTopicDraft(type, draft)
    resetValidationForm({ values: draft })
  }

  function discardDraft(): void {
    const type = formData.value.type
    const draft = readTopicDraft(type)
    draftSessions.set(type, draft)
    resetValidationForm({ values: draft })
  }

  function setFormType(type: (typeof tabList.value)[number]): void {
    if (!tabList.value.includes(type))
      return
    const prevType = formData.value.type
    if (prevType !== type) {
      snapshotDraft(prevType)
      applyDraft(type)
    }
    currentTabIndex.value = tabList.value.indexOf(type)
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
    inSwitchTabTransition,
    formData,
    formTabs,
    isDirty,

    tabList,
    nextTab,
    hasPermission,
    validate,

    switchTab,
    initFormData,
    saveDraft,
    discardDraft,
    setFormType,
    openForm,
    closeForm,
  }
}
