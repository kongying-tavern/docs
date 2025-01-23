import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getUser } from '../apis/forum/gitee/user'
import { useUserAuthStore } from './useUserAuth'
import teamMemberList from '~/_data/teamMemberList.json'

import type ForumAPI from '@/apis/forum/api'

export const useUserInfoStore = defineStore('user-info', () => {
  const userAuthStore = useUserAuthStore()

  const info = ref<ForumAPI.User>()

  const refreshUserInfo = async () => {
    if (userAuthStore.isTokenValid && userAuthStore.auth.accessToken) {
      info.value = await getUser(userAuthStore.auth.accessToken)
    }
  }

  const isTeamMember = (id?: string | number) => {
    id ??= info.value?.id
    return teamMemberList.findIndex((val) => id === val) !== -1
  }

  const clearUserInfo = () => (info.value = undefined)

  refreshUserInfo()

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
