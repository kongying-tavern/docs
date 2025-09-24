import type ForumAPI from '@/apis/forum/api'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { defineStore } from 'pinia'
import { ref } from 'vue'

import { getAuthorizedUser } from '../apis/forum/gitee/user'
import { useUserAuthStore } from './useUserAuth'

interface FingerprintAgain {
  visitorId: string
  confidence: {
    score: number
    comment?: string
  }
  components: {
    [key: string]:
      { value: unknown, duration: number }
      | { error: object, duration: number }
  }
  version: string
}

export const useUserInfoStore = defineStore('user-info', () => {
  const userAuthStore = useUserAuthStore()

  const info = ref<ForumAPI.User>()

  const fingerprint = ref<FingerprintAgain>()

  const refreshFingerprint = async () => {
    if (import.meta.env.SSR)
      return
    const fp = await FingerprintJS.load()
    fingerprint.value = await fp.get()
  }

  const refreshUserInfo = async () => {
    const accessToken = userAuthStore.auth?.accessToken
    if (userAuthStore.isTokenValid && accessToken) {
      info.value = await getAuthorizedUser(accessToken)
    }
  }

  const clearUserInfo = () => (info.value = undefined)

  refreshUserInfo()

  return {
    // states
    info,
    fingerprint,

    // actions
    refreshUserInfo,
    refreshFingerprint,
    clearUserInfo,
  }
})
