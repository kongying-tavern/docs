import type ForumAPI from '@/apis/forum/api'

import { defineStore } from 'pinia'
import { ref } from 'vue'

import { getUser } from '../apis/forum/gitee/user'
import { useUserAuthStore } from './useUserAuth'

export const useUserInfoStore = defineStore('user-info', () => {
  const userAuthStore = useUserAuthStore()

  const info = ref<ForumAPI.User>()

  const refreshUserInfo = async () => {
    if (userAuthStore.isTokenValid && userAuthStore.auth.accessToken) {
      info.value = await getUser(userAuthStore.auth.accessToken)
    }
  }

  const clearUserInfo = () => (info.value = undefined)

  refreshUserInfo()

  return {
    // states
    info,

    // actions
    refreshUserInfo,
    clearUserInfo,
  }
})
