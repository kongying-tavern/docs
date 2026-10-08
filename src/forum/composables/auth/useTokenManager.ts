import type { Deferred } from '~/composables/createDeferred'
import type { LocalAuth, SSOAuth, SSOLocaleAuth } from '~/forum/stores/auth/useUserAuth'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import { createDeferred } from '~/composables/createDeferred'
import { log, LogGroup } from '~/forum/composables/auth/auth-logger'

const USERAUTH_KEY = 'USER-AUTH'
const SSO_USERAUTH_KEY = 'SSO-USER-AUTH'

const TOKEN_REFRESH_THRESHOLD_MS = 30000

const getExpiresTime = (expiresIn: number) => Date.now() + expiresIn * 1000

function getRestTime(expiresTime: number) {
  return new Date(expiresTime).getTime() - Date.now()
}

/** 剩余有效期减去刷新阈值，即提前多少开始刷新 */
function getTimeUntilRefresh(expiresTime: number) {
  return getRestTime(expiresTime) - TOKEN_REFRESH_THRESHOLD_MS
}

export function useTokenManager() {
  const localAuth = useLocalStorage<LocalAuth | null>(USERAUTH_KEY, null, {
    serializer: {
      read: (v: string) => {
        try {
          return v === 'null' ? null : JSON.parse(v)
        }
        catch {
          return null
        }
      },
      write: (v: LocalAuth | null) => JSON.stringify(v),
    },
  })
  const ssoAuth = useLocalStorage<SSOLocaleAuth>(SSO_USERAUTH_KEY, {
    interKnot: {},
  }, {
    serializer: {
      read: (v: string) => {
        try {
          return JSON.parse(v)
        }
        catch {
          return { interKnot: {} }
        }
      },
      write: (v: SSOLocaleAuth) => JSON.stringify(v),
    },
  })

  const isTokenRefreshing = ref(false)
  const lastRefreshAttempt = ref<number>(0)

  let refreshDeferred: Deferred<void> | null = null
  let sessionGeneration = 0

  const isTokenValid = computed(() => {
    if (!localAuth.value?.accessToken)
      return false

    const restTime = getRestTime(localAuth.value.expiresTime)
    return restTime > 0
  })

  const timeUntilExpiry = computed(() => {
    if (!localAuth.value?.expiresTime)
      return 0
    return getRestTime(localAuth.value.expiresTime)
  })

  function setTokens(authData: Partial<LocalAuth>): void {
    log.info(LogGroup.TOKEN, 'Setting new tokens', { hasAccessToken: !!authData.accessToken })

    if (authData.accessToken && authData.expiresIn) {
      if (localAuth.value?.accessToken && localAuth.value.accessToken !== authData.accessToken)
        clearSSOTokens()

      const expiresTime = getExpiresTime(authData.expiresIn)
      localAuth.value = {
        accessToken: authData.accessToken,
        createdAt: authData.createdAt || Date.now(),
        expiresIn: authData.expiresIn,
        expiresTime,
        refreshToken: authData.refreshToken || localAuth.value?.refreshToken || '',
        scope: authData.scope || localAuth.value?.scope || '',
        tokenType: authData.tokenType || localAuth.value?.tokenType || 'bearer',
      }

      log.info(LogGroup.TOKEN, 'Token set successfully', {
        expiresIn: authData.expiresIn,
        expiresAt: new Date(expiresTime).toISOString(),
      })
    }
  }

  function setSSOToken(platform: keyof SSOLocaleAuth, authData: Partial<SSOAuth>): void {
    log.info(LogGroup.SSO, `Setting SSO token for ${platform}`, { hasToken: !!authData.accessToken })

    if (authData.accessToken && authData.expiresIn) {
      const expiresTime = getExpiresTime(authData.expiresIn)
      ssoAuth.value[platform] = {
        accessToken: authData.accessToken,
        createdAt: authData.createdAt || Date.now(),
        expiresIn: authData.expiresIn,
        expiresTime,
      }

      log.info(LogGroup.SSO, `SSO token set for ${platform}`, {
        expiresIn: authData.expiresIn,
        expiresAt: new Date(expiresTime).toISOString(),
      })
    }
  }

  function clearTokens(): void {
    log.info(LogGroup.TOKEN, 'Clearing all tokens')
    sessionGeneration++
    localAuth.value = null
    lastRefreshAttempt.value = 0
    isTokenRefreshing.value = false
    if (refreshDeferred) {
      refreshDeferred.reject(new Error('Tokens cleared'))
      refreshDeferred = null
    }
  }

  function clearSSOTokens(): void {
    log.info(LogGroup.SSO, 'Clearing SSO tokens')
    ssoAuth.value = { interKnot: {} }
  }

  /**
   * 服务端判定 SSO token 失效时（如 hub 返回 "Expired user access token"）主动作废本地记录。
   * 本地过期账本可能与服务端实际状态不一致，作废后下一次请求会先重取 token 再发出。
   */
  function invalidateSSOToken(platform: keyof SSOLocaleAuth): void {
    const ssoToken = ssoAuth.value[platform]
    if (!ssoToken?.accessToken) {
      return
    }
    log.warn(LogGroup.SSO, `Server rejected ${platform} SSO token, expiring it locally`)
    ssoAuth.value[platform] = { ...ssoToken, expiresTime: 0 }
  }

  function clearAllTokens(): void {
    clearTokens()
    clearSSOTokens()
  }

  function waitForRefreshComplete(): Promise<void> {
    if (!isTokenRefreshing.value || !refreshDeferred) {
      return Promise.resolve()
    }
    return refreshDeferred.promise
  }

  function startRefreshTracking(): Deferred<void> {
    refreshDeferred = createDeferred<void>()
    // 自动刷新可能没有等待者；仍保留原 Promise 的拒绝供并发调用者接收。
    void refreshDeferred.promise.catch(() => {})
    return refreshDeferred
  }

  function completeRefreshTracking(success: boolean, error?: unknown, task = refreshDeferred): void {
    if (task !== refreshDeferred)
      return
    if (success) {
      refreshDeferred?.resolve()
    }
    else {
      refreshDeferred?.reject(error)
    }
    refreshDeferred = null
    isTokenRefreshing.value = false
  }

  function validateToken(): boolean {
    if (!localAuth.value?.accessToken) {
      log.warn(LogGroup.TOKEN, 'No access token found')
      return false
    }

    if (!isTokenValid.value) {
      log.warn(LogGroup.TOKEN, 'Token is expired', {
        expiresTime: localAuth.value.expiresTime,
        currentTime: Date.now(),
        timeDiff: timeUntilExpiry.value,
      })
      return false
    }

    return true
  }

  function validateSSOToken(platform: keyof SSOLocaleAuth): boolean {
    const ssoToken = ssoAuth.value[platform]
    if (!ssoToken?.accessToken || !ssoToken.expiresTime) {
      return false
    }

    const restTime = getRestTime(ssoToken.expiresTime)
    return restTime > 0
  }

  function getSSOTimeUntilRefresh(platform: keyof SSOLocaleAuth, thresholdMs: number = 30000): number {
    const ssoToken = ssoAuth.value[platform]
    if (!ssoToken?.expiresTime)
      return -1

    return ssoToken.expiresTime - Date.now() - thresholdMs
  }

  function isSSOTokenNearExpiry(platform: keyof SSOLocaleAuth, thresholdMs: number = 30000): boolean {
    return getSSOTimeUntilRefresh(platform, thresholdMs) <= 0
  }

  function getTokenDebugInfo() {
    return {
      hasToken: !!localAuth.value?.accessToken,
      isValid: isTokenValid.value,
      timeUntilExpiry: timeUntilExpiry.value,
      isRefreshing: isTokenRefreshing.value,
      lastRefreshAttempt: lastRefreshAttempt.value,
    }
  }

  function getSSODebugInfo() {
    const platforms = Object.keys(ssoAuth.value) as (keyof SSOLocaleAuth)[]
    return platforms.reduce((acc, platform) => {
      const token = ssoAuth.value[platform]
      acc[platform] = {
        hasToken: !!token?.accessToken,
        isValid: validateSSOToken(platform),
        timeUntilExpiry: token?.expiresTime ? token.expiresTime - Date.now() : -1,
        timeUntilRefresh: getSSOTimeUntilRefresh(platform),
        isNearExpiry: isSSOTokenNearExpiry(platform),
      }
      return acc
    }, {} as Record<keyof SSOLocaleAuth, {
      hasToken: boolean
      isValid: boolean
      timeUntilExpiry: number
      timeUntilRefresh: number
      isNearExpiry: boolean
    }>)
  }

  return {
    // State
    localAuth,
    ssoAuth,
    isTokenRefreshing,
    lastRefreshAttempt,

    // Computed
    isTokenValid,
    timeUntilExpiry,

    // Actions
    setTokens,
    setSSOToken,
    clearTokens,
    clearSSOTokens,
    invalidateSSOToken,
    clearAllTokens,
    validateToken,
    validateSSOToken,

    // Debug
    getTokenDebugInfo,
    getSSODebugInfo,

    // SSO utilities
    getSSOTimeUntilRefresh,

    // Internal utilities (for refresh composable)
    getTimeUntilRefresh,
    TOKEN_REFRESH_THRESHOLD_MS,

    // Promise-based refresh tracking
    waitForRefreshComplete,
    startRefreshTracking,
    completeRefreshTracking,
    getSessionGeneration: () => sessionGeneration,
  }
}
