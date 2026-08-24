import { refAutoReset, useLocalStorage } from '@vueuse/core'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { STORAGE_KEYS } from '../../constants'
import { createTopicDraftSchema, createTopicFormSchema, getAllowedTopicTypes } from '../../utils/validation'
import { getFormTabsConfig, TRANSITION_DURATION } from '../publish-topic-form/config'
import { createDefaultTopicDraft, restoreTopicDraft } from './topicDraft'

export function useFormState() {
  const { message } = useLocalized()
  const { hasAnyPermissions } = useRuleChecks()
  const hasPermission = hasAnyPermissions('manage_feedback')
  const formTabs = getFormTabsConfig(hasPermission)

  // Form state
  const isOpen = ref(false)
  const currentTabIndex = ref<number>(0)
  const inSwitchTabTransition = refAutoReset(false, TRANSITION_DURATION)

  // Form data with persistence
  const storedFormData = useLocalStorage<unknown>(
    STORAGE_KEYS.FORUM_FORM_DATA,
    createDefaultTopicDraft(),
    {
      deep: true,
      mergeDefaults: false,
    },
  )

  const validationSchema = computed(() => createTopicFormSchema(message, hasPermission.value))
  const {
    resetForm: resetValidationForm,
    setFieldValue,
    validate,
    values,
  } = useForm({
    validationSchema,
    initialValues: restoreTopicDraft(storedFormData.value),
  })

  const formData = computed(() => restoreTopicDraft(values))

  watch(formData, (draft) => {
    storedFormData.value = {
      ...draft,
      tags: [...draft.tags],
    }
  }, { deep: true })

  // Computed properties
  const tabList = computed(() => {
    return getAllowedTopicTypes(hasPermission.value)
  })

  const nextTabIndex = computed(() => {
    return (currentTabIndex.value + 1) % tabList.value.length
  })

  const nextTab = computed(() => {
    return formTabs.find(val => val.value === tabList.value[nextTabIndex.value])
  })

  const isDisabled = computed(() => {
    return !createTopicDraftSchema({
      canPublishAnnouncement: hasPermission.value,
    }).safeParse(formData.value).success
  })

  // Actions
  function switchTab(): void {
    const targetIndex = nextTabIndex.value
    const targetType = tabList.value[targetIndex]
    if (!targetType)
      return
    currentTabIndex.value = targetIndex
    inSwitchTabTransition.value = true
    setTimeout(setFieldValue, TRANSITION_DURATION / 2, 'type', targetType)
  }

  function initFormData(): void {
    const freshDraft = createDefaultTopicDraft()
    storedFormData.value = freshDraft
    resetValidationForm({ values: freshDraft })
  }

  function setFormType(type: (typeof tabList.value)[number]): void {
    if (!tabList.value.includes(type))
      return
    setFieldValue('type', type)
    // Also update the currentTabIndex to match the type
    const typeIndex = tabList.value.indexOf(type)
    if (typeIndex !== -1) {
      currentTabIndex.value = typeIndex
    }
  }

  watch([hasPermission, () => formData.value.type], ([, type]) => {
    const allowedType = tabList.value.includes(type) ? type : tabList.value[0]
    if (allowedType)
      setFormType(allowedType)
  }, { immediate: true })

  function openForm(typeFromUrl?: (typeof tabList.value)[number]): void {
    // If a type is specified from URL, override the localStorage value
    if (typeFromUrl && tabList.value.includes(typeFromUrl)) {
      setFormType(typeFromUrl)
    }
    isOpen.value = true
  }

  function closeForm(): void {
    isOpen.value = false
  }

  return {
    // State
    isOpen,
    currentTabIndex,
    inSwitchTabTransition,
    formData,
    formTabs,

    // Computed
    tabList,
    nextTab,
    isDisabled,
    hasPermission,
    validate,

    // Actions
    switchTab,
    initFormData,
    setFormType,
    openForm,
    closeForm,
  }
}
