import { useUserInfoStore } from '@/stores/useUserInfo'
import { computed } from 'vue'

export const useRuleChecks = (id: string | number) => {
  const userInfo = useUserInfoStore()

  return {
    isTeamMemberOrInDevEnv: computed(() => {
      return import.meta.env.DEV || userInfo.isTeamMember()
    }),
    isAuthor: computed(() => {
      return userInfo?.info?.id === id
    }),
    isAuthorOrTeamMember: computed(() => {
      return userInfo.isTeamMember() || userInfo?.info?.id === id
    }),
    isTeamNember: computed(() => {
      return userInfo.isTeamMember()
    }),
  }
}
