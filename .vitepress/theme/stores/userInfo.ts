import { defineStore } from 'pinia'
import { useUserAuthStore } from './userAuth'
import { getUser } from '../apis/forum/gitee/user'
import { computed, ref } from 'vue'
import { issues, user } from '../apis/forum/gitee'
import { useNotificationStore } from './useNotification'
import type ForumAPI from '@/apis/forum/api'

export const useUserInfoStore = defineStore('user-info', () => {
  const notification = useNotificationStore()
  const userAuthStore = useUserAuthStore()

  const info = ref<ForumAPI.User>()
  const teamMembersID = ref<number[]>()

  const refreshUserInfo = async () => {
    if (userAuthStore.isTokenValid && userAuthStore.auth.accessToken) {
      info.value = await getUser(userAuthStore.auth.accessToken)
    }
  }
  const isTeamMember = (id = info.value?.id) =>
    Boolean(teamMembersID.value?.find((val) => id === val))

  const getTeamMembersID = async () =>
    (teamMembersID.value = (await user.getOrgMembers()).map((val) =>
      Number(val.id),
    ))
  const clearUserInfo = () => (info.value = undefined)

  refreshUserInfo()
  getTeamMembersID()

  return {
    // states
    info,

    // getters

    // actions
    refreshUserInfo,
    clearUserInfo,
    isTeamMember,
  }
})
