import { useUserInfoStore } from '@/stores/useUserInfo'
import { computed } from 'vue'

export const hasPermission = (id: string | number) =>
  computed(() => {
    const userInfo = useUserInfoStore()
    return userInfo.isTeamMember().value || userInfo?.info?.id === id
  })
