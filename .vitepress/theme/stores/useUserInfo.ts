import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { issues, user } from '../apis/forum/gitee'
import { getUser } from '../apis/forum/gitee/user'
import { useNotificationStore } from './useNotification'
import { useUserAuthStore } from './useUserAuth'

import type ForumAPI from '@/apis/forum/api'

export const useUserInfoStore = defineStore('user-info', () => {
  const notification = useNotificationStore()
  const userAuthStore = useUserAuthStore()

  const info = ref<ForumAPI.User>()
  const teamMembersID = useLocalStorage<
    Partial<{
      updatedAt: number
      list: number[]
    }>
  >('TEAM-MEMBERS-ID', {})

  const refreshUserInfo = async () => {
    if (userAuthStore.isTokenValid && userAuthStore.auth.accessToken) {
      info.value = await getUser(userAuthStore.auth.accessToken)
    }
  }
  const isTeamMember = (id = info.value?.id) =>
    Boolean(teamMembersID.value?.list!.find((val) => id === val))
  const setTeamMembersID = async () => {
    if (
      !teamMembersID.value.updatedAt ||
      Date.now() - teamMembersID.value?.updatedAt! > 1000 * 60 * 60 * 24
    ) {
      return (teamMembersID.value = {
        updatedAt: Date.now(),
        list: await refreshTeamMemberID(),
      })
    }
  }

  const refreshTeamMemberID = async () =>
    (await user.getOrgMembers()).map((val) => Number(val.id))
  const clearUserInfo = () => (info.value = undefined)

  refreshUserInfo()
  setTeamMembersID()

  return {
    // states
    info,

    // getters
    isTeamMember,

    // actions
    refreshUserInfo,
    clearUserInfo,
  }
})
