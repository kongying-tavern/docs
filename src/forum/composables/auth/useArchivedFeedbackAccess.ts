import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { useRuleChecks } from './useRuleChecks'

export function useArchivedFeedbackAccess(creator: MaybeRefOrGetter<string | null | undefined>) {
  const userAuth = useUserAuthStore()
  const userInfo = useUserInfoStore()
  const { hasAnyRoles } = useRuleChecks()
  const isAdmin = hasAnyRoles('teamMember', 'feedbackMember')

  return computed(() => {
    const login = userInfo.info?.login
    const target = toValue(creator)?.trim()
    return userAuth.isLoggedIn && (isAdmin.value
      || Boolean(login && target && login.toLowerCase() === target.toLowerCase()))
  })
}
