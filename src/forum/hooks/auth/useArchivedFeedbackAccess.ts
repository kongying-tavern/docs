import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { useUserAuthStore } from '@/src/forum/stores/auth/useUserAuth.ts'
import { useUserInfoStore } from '@/src/forum/stores/auth/useUserInfo.ts'
import { useRuleChecks } from './useRuleChecks.ts'

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
