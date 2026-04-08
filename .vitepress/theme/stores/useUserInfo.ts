import type ForumAPI from '@/apis/forum/api'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { defineStore } from 'pinia'
import { onMounted, ref, watch } from 'vue'

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
  const isInitialized = ref(false)

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

  // 监听 token 有效状态变化，自动获取用户信息
  watch(
    () => userAuthStore.isTokenValid,
    async (isValid) => {
      if (isValid && !isInitialized.value) {
        isInitialized.value = true
        await refreshUserInfo()
      }
    },
    { immediate: true },
  )

  // 组件挂载时再次检查（处理 SSR hydration 后的情况）
  onMounted(async () => {
    if (userAuthStore.isTokenValid && !info.value) {
      await refreshUserInfo()
    }
  })

  return {
    // states
    info,
    fingerprint,
    isInitialized,

    // actions
    refreshUserInfo,
    refreshFingerprint,
    clearUserInfo,
  }
})
