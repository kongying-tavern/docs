import type { LocalAuth, SSOAuth, SSOLocaleAuth } from '../stores/useUserAuth'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { log, LogGroup } from '../utils/auth-logger'

const USERAUTH_KEY = 'USER-AUTH'
const SSO_USERAUTH_KEY = 'SSO-USER-AUTH'

const TOKEN_REFRESH_THRESHOLD_MS = 30000
const MIN_REFRESH_INTERVAL_MS = 10000

/** 计算到期时间 */
const getExpiressTime = (expiressIn: number) => Date.now() + expiressIn * 1000

/** 计算剩余有效时间 */
function getRestTime(expiressTime: number) {
  return new Date(expiressTime).getTime() - Date.now()
}

/** 计算剩余有效时间与设定刷新阈值时间的差 */
function getTimeUntilRefresh(expiressTime: number) {
  return getRestTime(expiressTime) - TOKEN_REFRESH_THRESHOLD_MS
}

export function useTokenManager() {
  // Local storage for auth data with explicit JSON serialization
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

  // Reactive state
  const isTokenRefreshing = ref(false)
  const lastRefreshAttempt = ref<number>(0)

  // Computed properties
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

  const shouldRefreshToken = computed(() => {
    if (!localAuth.value?.accessToken || isTokenRefreshing.value)
      return false

    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshAttempt.value

    // Prevent too frequent refresh attempts
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
      return false
    }

    const timeUntilRefresh = getTimeUntilRefresh(localAuth.value.expiresTime)
    return timeUntilRefresh <= 0
  })

  // Token management functions
  function setTokens(authData: Partial<LocalAuth>): void {
    log.info(LogGroup.TOKEN, 'Setting new tokens', { hasAccessToken: !!authData.accessToken })

    if (authData.accessToken && authData.expiresIn) {
      const expiresTime = getExpiressTime(authData.expiresIn)
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
      const expiresTime = getExpiressTime(authData.expiresIn)
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
    localAuth.value = null
    lastRefreshAttempt.value = 0
    isTokenRefreshing.value = false
  }

  function clearSSOTokens(): void {
    log.info(LogGroup.SSO, 'Clearing SSO tokens')
    ssoAuth.value = { interKnot: {} }
  }

  function clearAllTokens(): void {
    clearTokens()
    clearSSOTokens()
  }

  // Token validation
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

  // Debug helpers
  function getTokenDebugInfo() {
    return {
      hasToken: !!localAuth.value?.accessToken,
      isValid: isTokenValid.value,
      timeUntilExpiry: timeUntilExpiry.value,
      shouldRefresh: shouldRefreshToken.value,
      isRefreshing: isTokenRefreshing.value,
      lastRefreshAttempt: lastRefreshAttempt.value,
    }
  }

  // Watch for token changes to update refresh state
  watch(localAuth, (newAuth) => {
    if (newAuth?.accessToken) {
      // Reset refresh state when new token is set
      isTokenRefreshing.value = false
    }
  })

  return {
    // State
    localAuth,
    ssoAuth,
    isTokenRefreshing,
    lastRefreshAttempt,

    // Computed
    isTokenValid,
    timeUntilExpiry,
    shouldRefreshToken,

    // Actions
    setTokens,
    setSSOToken,
    clearTokens,
    clearSSOTokens,
    clearAllTokens,
    validateToken,
    validateSSOToken,

    // Debug
    getTokenDebugInfo,

    // Internal utilities (for refresh composable)
    getTimeUntilRefresh,
    TOKEN_REFRESH_THRESHOLD_MS,
    MIN_REFRESH_INTERVAL_MS,
  }
}
