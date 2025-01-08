import { useUserInfoStore } from '@/stores/useUserInfo'

export const hasPermission = (id: string | number) => {
  const userInfo = useUserInfoStore()
  return userInfo.isTeamMember() || userInfo?.info?.id === id
}
