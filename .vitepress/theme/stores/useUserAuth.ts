import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { oauth } from '../apis/forum/gitee'
import { toCamelCaseObject } from '@/utils'

import type ForumAPI from '@/apis/forum/api'

export interface LocalAuth {
  accessToken: string
  createdAt: number
  expiresIn: number
  expiresTime: number
  refreshToken: string
  scope: string
  tokenType: string
}

const USERAUTH_KEY = 'USER-AUTH'
/** 刷新的阈值时间 */
const TOKEN_REFRESH_REST_TIME = 1000

/** 计算到期时间 */
const getExpiressTime = (expiressIn: number) => Date.now() + expiressIn * 1000

/** 计算剩余有效时间 */
const getRestTime = (expiressTime: number) =>
  new Date(expiressTime).getTime() - Date.now()

/** 计算剩余有效时间与设定刷新阈值时间的差 */
const differenceTokenTime = (expiressTime: number) =>
  getRestTime(expiressTime) - TOKEN_REFRESH_REST_TIME

export const useUserAuthStore = defineStore('user-auth', () => {
  const auth = useLocalStorage<Partial<LocalAuth>>(USERAUTH_KEY, {})

  const setAuth = (newAuth: ForumAPI.Auth) => {
    const { refreshToken, expiresIn, tokenType, accessToken } =
      toCamelCaseObject(newAuth)
    auth.value = {
      refreshToken,
      expiresIn,
      expiresTime: getExpiressTime(expiresIn),
      accessToken,
      tokenType,
    }
  }

  const isTokenValid = computed(() => {
    if (!auth.value.accessToken) return false
    const { expiresTime = 0 } = auth.value
    return expiresTime > Date.now()
  })

  watch(isTokenValid, (valid) => {
    console.info('token changed', valid)

    if (!valid) clearAuth()
  })

  const refreshAuth = () =>
    new Promise<void>(async (resolve, reject) => {
      const { refreshToken } = auth.value
      if (!refreshToken) {
        logout()
        return reject(new Error('鉴权信息为空'))
      }

      const [error, newAuth] = await oauth.refreshToken(refreshToken)

      if (error || !newAuth) {
        logout()
        return reject(new Error('Token 刷新失败'))
      }

      auth.value = newAuth
      resolve()
    })

  /** 刷新计时器 */
  const intervalRefreshTimer = ref<number>()

  const stopAutoRefresh = () => {
    window.clearTimeout(intervalRefreshTimer.value)
    intervalRefreshTimer.value = undefined
  }

  /** 确认自动刷新 token 任务存在 */
  const ensureTokenRefreshMission = async () => {
    try {
      const { expiresTime = 0 } = auth.value
      const refreshInterval = differenceTokenTime(expiresTime)
      const seconds = (refreshInterval / 1000).toFixed(0)

      if (intervalRefreshTimer.value !== undefined) {
        console.info(
          `已存在定时刷新任务，将在 ${new Date(Date.now() + 1000 * Number(seconds)).toLocaleString()} 刷新`,
        )
        return
      }

      const commitRefresh = async () => {
        stopAutoRefresh()
        if (!auth.value.refreshToken) return
        await refreshAuth()
        ensureTokenRefreshMission()
      }

      if (refreshInterval <= 0) {
        console.info('Token 已过期，立即刷新...')
        await commitRefresh()
        return
      }

      console.info(
        `token 将在 ${new Date(Date.now() + 1000 * Number(seconds)).toLocaleString()} 刷新`,
      )
      intervalRefreshTimer.value = window.setTimeout(async () => {
        await commitRefresh()
      }, refreshInterval)
    } catch (err) {
      stopAutoRefresh()
      auth.value = {}
      console.error(err)
    }
  }

  const accessToken = computed(() => {
    if (!isTokenValid.value) return null

    return auth.value.accessToken
  })

  const clearAuth = () => {
    stopAutoRefresh()
    auth.value = {}
  }

  const logout = () => {
    clearAuth()
  }

  return {
    // states
    auth,

    // getters
    isTokenValid,
    accessToken,

    // actions
    setAuth,
    clearAuth,
    refreshAuth,
    ensureTokenRefreshMission,
    logout,
  }
})
