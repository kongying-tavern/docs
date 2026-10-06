import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { resolveFeedbackFormVariant, selectFeedbackFormVariant } from '~/forum/services/form/feedbackFormExperiment'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'

export function useFeedbackFormExperiment() {
  const overrides = useLocalStorage<Record<string, boolean>>('forum-feedback-form-overrides', {})
  const userInfo = useUserInfoStore()
  const auth = useUserAuthStore()
  const { hasAnyPermissions } = useRuleChecks()
  const permission = hasAnyPermissions('manage_feedback')
  const canManage = computed(() => auth.isLoggedIn && permission.value)
  const accountId = computed(() => userInfo.info?.id)
  const percentage = Number(import.meta.env.VITE_FEEDBACK_FORM_COMPACT_PERCENT ?? 10)
  const assignedVariant = computed(() => selectFeedbackFormVariant(accountId.value, percentage))
  const override = computed(() => accountId.value === undefined ? undefined : overrides.value?.[String(accountId.value)])
  const variant = computed(() => resolveFeedbackFormVariant(accountId.value, percentage, canManage.value, override.value))
  const enabled = computed({
    get: () => canManage.value && variant.value !== assignedVariant.value,
    set: (value: boolean) => {
      if (!canManage.value || accountId.value === undefined)
        return
      const next = { ...overrides.value }
      if (value)
        next[String(accountId.value)] = assignedVariant.value !== 'compact'
      else
        delete next[String(accountId.value)]
      overrides.value = next
    },
  })
  return { canManage, enabled, variant, assignedVariant }
}
