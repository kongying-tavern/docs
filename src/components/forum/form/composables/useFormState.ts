import type ForumAPI from '@/apis/forum/api'
import { refAutoReset, useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useRuleChecks } from '~/composables/useRuleChecks'
import {
  FORM_DATA_KEY,
  FORM_DEFAULT_DATA,
  getFormTabsConfig,
  TRANSITION_DURATION,
} from '../publish-topic-form/config'

export function useFormState() {
  const formTabs = getFormTabsConfig()
  const { hasAnyPermissions } = useRuleChecks()

  // Form state
  const isOpen = ref(false)
  const currentTabIndex = ref<number>(0)
  const inSwitchTabTransition = refAutoReset(false, TRANSITION_DURATION)

  // Form data with persistence
  const formData = useLocalStorage<ForumAPI.CreateTopicOption>(
    FORM_DATA_KEY,
    FORM_DEFAULT_DATA,
    {
      deep: true,
      mergeDefaults: false,
    },
  )

  // Permissions
  const hasPermission = hasAnyPermissions('manage_feedback')

  // Computed properties
  const tabList = computed(() => {
    return formTabs.map(val => val.value).filter((val) => {
      if (val === 'ANN' && !hasPermission)
        return false
      return true
    })
  })

  const nextTabIndex = computed(() => {
    return (currentTabIndex.value + 1) % tabList.value.length
  })

  const nextTab = computed(() => {
    return formTabs.find(val => val.value === tabList.value[nextTabIndex.value])
  })

  const isDisabled = computed(() => {
    const currentTab = formTabs.find(tab => tab.value === formData.value.type)
    if (!currentTab)
      return true

    if (currentTab.value === 'ANN' && !hasPermission)
      return true

    // Check title field
    if (currentTab.fields.title) {
      const titleLength = formData.value.title.length
      if (titleLength < (currentTab.fields.title.minLength ?? 0))
        return true
    }

    // Check tags field
    if (currentTab.fields.tags) {
      const tagsLength = formData.value.tags.length
      if (tagsLength < (currentTab.fields.tags.minLength ?? 0))
        return true
    }

    // Check content field
    if (currentTab.fields.content) {
      const contentLength = formData.value.text.length
      if (contentLength < (currentTab.fields.content.minLength ?? 0))
        return true
    }

    return false
  })

  // Actions
  function switchTab(): void {
    currentTabIndex.value = nextTabIndex.value
    if (formData.value.type === tabList.value[currentTabIndex.value])
      return switchTab()
    inSwitchTabTransition.value = true
    setTimeout(
      () => (formData.value.type = tabList.value[currentTabIndex.value]),
      TRANSITION_DURATION / 2,
    )
  }

  function initFormData(): void {
    formData.value = FORM_DEFAULT_DATA
  }

  function openForm(): void {
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

    // Actions
    switchTab,
    initFormData,
    openForm,
    closeForm,
  }
}
