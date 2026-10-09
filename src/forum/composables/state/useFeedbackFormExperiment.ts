import { computed } from 'vue'
import { useGrayscaleOverride } from '~/forum/composables/state/useGrayscaleOverride'
import { resolveFeedbackFormVariant, selectFeedbackFormVariant } from '~/forum/services/form/feedbackFormExperiment'

export function useFeedbackFormExperiment() {
  const { canManage, accountId, override, setOverride } = useGrayscaleOverride('forum-feedback-form-overrides')
  const percentage = Number(import.meta.env.VITE_FEEDBACK_FORM_COMPACT_PERCENT ?? 10)
  const assignedVariant = computed(() => selectFeedbackFormVariant(accountId.value, percentage))
  const variant = computed(() => resolveFeedbackFormVariant(accountId.value, percentage, canManage.value, override.value))
  const enabled = computed({
    get: () => canManage.value && variant.value !== assignedVariant.value,
    set: (value: boolean) => setOverride(value ? assignedVariant.value !== 'compact' : undefined),
  })
  return { canManage, enabled, variant, assignedVariant }
}
