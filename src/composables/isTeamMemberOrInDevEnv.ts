import { useUserInfoStore } from '@/stores/useUserInfo'
import { computed } from 'vue'

export const isTeamMemberOrInDevEnv = computed(() => {
  const userInfo = useUserInfoStore()
  return import.meta.DEV || userInfo.isTeamMember()
})
