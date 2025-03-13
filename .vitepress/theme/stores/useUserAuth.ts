/* eslint-disable no-console */
import type ForumAPI from '@/apis/forum/api'
import { toCamelCaseObject } from '@/utils'
import { useLocalStorage } from '@vueuse/core'

import { isObject } from 'lodash-es'

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { oauth } from '../apis/forum/gitee'
import { oauth as interKnotOauth } from '../apis/inter-knot.site/'

export interface LocalAuth {
  accessToken: string
  createdAt: number
  expiresIn: number
  expiresTime: number
  refreshToken: string
  scope: string
  tokenType: string
}

export interface SSOAuth {
  accessToken?: string
  createdAt?: number
  expiresIn?: number
  expiresTime?: number
}

export interface SSOLocaleAuth {
  interKnot: SSOAuth
}

const USERAUTH_KEY = 'USER-AUTH'
const SSO_USERAUTH_KEY = 'SSO-USER-AUTH'

/** 刷新的阈值时间 */
const TOKEN_REFRESH_REST_TIME = 1000

/** 计算到期时间 */
const getExpiressTime = (expiressIn: number) => Date.now() + expiressIn * 1000

/** 计算剩余有效时间 */
function getRestTime(expiressTime: number) {
  return new Date(expiressTime).getTime() - Date.now()
}

/** 计算剩余有效时间与设定刷新阈值时间的差 */
function differenceTokenTime(expiressTime: number) {
  return getRestTime(expiressTime) - TOKEN_REFRESH_REST_TIME
}

const DEFAULT_SSO_AUTH: SSOLocaleAuth = {
  interKnot: {},
}

export const useUserAuthStore = defineStore('user-auth', () => {
  const auth = useLocalStorage<Partial<LocalAuth>>(USERAUTH_KEY, {})
  const ssoAuth = useLocalStorage<SSOLocaleAuth>(SSO_USERAUTH_KEY, DEFAULT_SSO_AUTH)

  const setAuth = (newAuth: ForumAPI.Auth) => {
    const { refreshToken, expiresIn, tokenType, accessToken }
      = toCamelCaseObject(newAuth as unknown as Record<string, string>) as unknown as LocalAuth
    auth.value = {
      refreshToken,
      expiresIn,
      expiresTime: getExpiressTime(expiresIn),
      accessToken,
      tokenType,
    }
  }

  const setSSOAuth = (target: keyof SSOLocaleAuth, newAuth: SSOAuth) => {
    if (!isObject(ssoAuth.value[target]))
      throw new Error('SSO 鉴权平台不存在')

    ssoAuth.value[target] = newAuth
  }

  /** 刷新计时器 */
  const intervalRefreshTimer = ref<number>()

  const stopAutoRefresh = () => {
    window.clearTimeout(intervalRefreshTimer.value)
    intervalRefreshTimer.value = undefined
  }

  const isTokenValid = computed(() => {
    if (!auth.value.accessToken)
      return false
    const { expiresTime = 0 } = auth.value
    return expiresTime > Date.now()
  })

  const isSSOTokenValid = (target: keyof SSOLocaleAuth) => {
    return computed(() => {
      if (!ssoAuth.value[target])
        return false
      const { expiresTime = 0 } = ssoAuth.value[target]
      return expiresTime > Date.now()
    })
  }

  const deregisterSSO = async (target: keyof SSOLocaleAuth) => {
    if (!isSSOTokenValid(target) || !ssoAuth.value[target])
      return
    switch (target) {
      case 'interKnot':
        console.log(ssoAuth.value[target].accessToken)
        await interKnotOauth.logout(ssoAuth.value[target].accessToken)
        break
      default:
        break
    }
  }

  const clearAuth = () => {
    stopAutoRefresh()
    auth.value = {}
  }

  const clearSSOAuth = async (target: keyof SSOLocaleAuth) => {
    ssoAuth.value[target] = {}
  }

  const clearAllSSOAuth = async () => {
    await Promise.all(
      Object.keys(ssoAuth.value).map(async (target) => {
        await deregisterSSO(target as keyof SSOLocaleAuth)
      }),
    )
    ssoAuth.value = DEFAULT_SSO_AUTH
  }

  const logout = async () => {
    clearAuth()
    await clearAllSSOAuth()
  }

  const refreshSSOAuth = async (target: keyof SSOLocaleAuth) => {
    return new Promise<void>((resolve, reject) => {
      const refresh = async () => {
        if (!isObject(ssoAuth.value[target]))
          return reject(new Error('SSO 鉴权平台不存在'))

        const { accessToken: mainAccessToken } = auth.value

        if (!mainAccessToken || !isTokenValid.value)
          return reject(new Error('中心鉴权信息为空或过期'))

        let result: [Error, null] | [null, SSOAuth]
        switch (target) {
          case 'interKnot':
            result = await interKnotOauth.refreshToken(mainAccessToken)
            break
          default:
            return reject(new Error('SSO 鉴权平台不存在'))
        }

        if (result[0]) {
          console.error(result[0])
          return reject(result[0])
        }

        ssoAuth.value[target] = result[1]
        resolve()
      }
      refresh()
    })
  }

  const refreshAllSSOAuth = async () => {
    await Promise.all(
      Object.keys(ssoAuth.value).map(target => refreshSSOAuth(target as keyof SSOLocaleAuth)),
    )
  }

  const refreshAuth = () =>
    new Promise<void>((resolve, reject) => {
      const refresh = async () => {
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
        refreshAllSSOAuth()
        resolve()
      }
      refresh()
    })

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
        if (!auth.value.refreshToken)
          return
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
    }
    catch (err) {
      stopAutoRefresh()
      auth.value = {}
      console.error(err)
    }
  }

  const accessToken = computed(() => {
    if (!isTokenValid.value)
      return null

    return auth.value.accessToken
  })

  watch(isTokenValid, async (valid) => {
    if (!valid)
      return

    console.info('[Token]: token changed', valid)
    await refreshAllSSOAuth()
  }, {
    immediate: true,
  })

  Object.keys(ssoAuth.value).forEach((target) => {
    watch(isSSOTokenValid(target as keyof SSOLocaleAuth), async (valid) => {
      console.info(`[SSO]: ${target} token changed`, valid)
      if (!valid) {
        await clearSSOAuth(target as keyof SSOLocaleAuth)
        if (isTokenValid.value)
          await refreshSSOAuth(target as keyof SSOLocaleAuth)
      }
    })
  })

  return {
    // states
    auth,
    ssoAuth,
    // getters
    isTokenValid,
    accessToken,
    isSSOTokenValid,

    // actions
    setAuth,
    setSSOAuth,
    clearAuth,
    refreshAuth,
    refreshSSOAuth,
    ensureTokenRefreshMission,
    logout,
    refreshAllSSOAuth,
  }
})
