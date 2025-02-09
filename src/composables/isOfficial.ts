import { useRuleChecks } from '~/composables/useRuleChecks'

export const isOfficial = (id: string | number) => {
  const { hasAnyRoles } = useRuleChecks(id)

  return hasAnyRoles('feedbackMember', 'teamMember')
}
