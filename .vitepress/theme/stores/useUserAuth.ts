import type ForumAPI from '@/apis/forum/api'
import { toCamelCaseObject } from '@/utils'
import { isObject } from 'lodash-es'
import { defineStore } from 'pinia'
import { computed, onBeforeUnmount, readonly, ref } from 'vue'
import { oauth } from '../apis/forum/gitee'
import { useAuthRefresh } from '../composables/useAuthRefresh'
import { useSSOAuth } from '../composables/useSSOAuth'
import { useTokenManager } from '../composables/useTokenManager'
import { AuthError, createAuthError } from '../utils/auth-errors'
import { log, LogGroup } from '../utils/auth-logger'

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

export const useUserAuthStore = defineStore('user-auth', () => {
  // Initialize composables
  const tokenManager = useTokenManager()
  const ssoAuth = useSSOAuth(tokenManager)
  const authRefresh = useAuthRefresh(tokenManager)

  // State
  const loginStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const lastError = ref<AuthError | null>(null)

  // Computed
  const auth = computed<LocalAuth | null>(() => tokenManager.localAuth.value || null)
  const ssoLocalAuth = computed(() => tokenManager.ssoAuth.value)
  const isTokenValid = computed(() => tokenManager.isTokenValid.value)
  const isLoggedIn = computed(() => !!tokenManager.localAuth.value?.accessToken && tokenManager.isTokenValid.value)

  // Actions
  const setAuth = (newAuth: ForumAPI.Auth) => {
    log.info(LogGroup.AUTH, 'Setting authentication data')

    try {
      const { refreshToken, expiresIn, tokenType, accessToken }
        = toCamelCaseObject(newAuth as unknown as Record<string, string>) as unknown as LocalAuth

      if (!accessToken || !expiresIn) {
        throw createAuthError.tokenInvalid()
      }

      tokenManager.setTokens({
        accessToken,
        refreshToken: refreshToken || '',
        expiresIn: Number(expiresIn),
        tokenType: tokenType || 'bearer',
        scope: 'user_info',
        createdAt: Date.now(),
      })

      loginStatus.value = 'success'
      lastError.value = null
      log.success(LogGroup.AUTH, 'Authentication data set successfully')

      // Start auto refresh
      authRefresh.startAutoRefresh()
    }
    catch (error) {
      log.error(LogGroup.AUTH, 'Failed to set authentication data', error)
      lastError.value = error instanceof AuthError ? error : createAuthError.networkError(error as Error)
      loginStatus.value = 'error'
      throw error
    }
  }

  const setSSOAuth = (platform: keyof SSOLocaleAuth, authData: Partial<SSOAuth>) => {
    log.info(LogGroup.SSO, `Setting SSO auth for ${platform}`)

    try {
      tokenManager.setSSOToken(platform, authData)
      log.success(LogGroup.SSO, `SSO auth set for ${platform}`)
    }
    catch (error) {
      log.error(LogGroup.SSO, `Failed to set SSO auth for ${platform}`, error)
      throw error
    }
  }

  const refreshToken = async (): Promise<void> => {
    try {
      loginStatus.value = 'pending'
      await authRefresh.refreshToken()
      loginStatus.value = 'success'
      lastError.value = null
    }
    catch (error) {
      loginStatus.value = 'error'
      lastError.value = error instanceof AuthError ? error : createAuthError.tokenRefreshFailed(error as Error)
      throw error
    }
  }

  const login = async (credentials: Record<string, unknown>): Promise<void> => {
    log.info(LogGroup.AUTH, 'Starting login process')
    loginStatus.value = 'pending'

    try {
      const result = await oauth.getToken(credentials.code as string)

      if (!isObject(result)) {
        throw createAuthError.networkError(new Error('Invalid login response'))
      }

      const camelResult = toCamelCaseObject(result as unknown as Record<string, unknown>)

      if (!camelResult.accessToken || !camelResult.expiresIn) {
        throw createAuthError.tokenInvalid(new Error('Invalid login response format'))
      }

      setAuth(camelResult as unknown as ForumAPI.Auth)
      log.success(LogGroup.AUTH, 'Login successful')
    }
    catch (error) {
      loginStatus.value = 'error'
      lastError.value = error instanceof AuthError ? error : createAuthError.networkError(error as Error)
      log.error(LogGroup.AUTH, 'Login failed', error)
      throw lastError.value
    }
  }

  const logout = (): void => {
    log.info(LogGroup.AUTH, 'Starting logout process')

    try {
      // Stop auto refresh
      authRefresh.stopAutoRefresh()

      // Clear all tokens
      tokenManager.clearAllTokens()

      // Reset state
      loginStatus.value = 'idle'
      lastError.value = null

      log.success(LogGroup.AUTH, 'Logout successful')
    }
    catch (error) {
      log.error(LogGroup.AUTH, 'Logout failed', error)
      throw createAuthError.networkError(error as Error)
    }
  }

  const validateSession = (): boolean => {
    return tokenManager.validateToken()
  }

  // SSO methods delegation
  const loginWithInterKnot = async (credentials: { username: string, password: string }) => {
    return ssoAuth.loginWithInterKnot(credentials)
  }

  const logoutFromInterKnot = async () => {
    return ssoAuth.logoutFromInterKnot()
  }

  const refreshInterKnotToken = async () => {
    return ssoAuth.refreshInterKnotToken()
  }

  // Debug helpers
  const getDebugInfo = () => {
    return {
      ...tokenManager.getTokenDebugInfo(),
      loginStatus: loginStatus.value,
      lastError: lastError.value?.message,
      ssoTokens: Object.keys(tokenManager.ssoAuth.value).reduce((acc, key) => {
        acc[key] = !!tokenManager.ssoAuth.value[key as keyof SSOLocaleAuth]?.accessToken
        return acc
      }, {} as Record<string, boolean>),
    }
  }

  // Initialize auto refresh if token exists
  if (tokenManager.localAuth.value?.accessToken) {
    authRefresh.startAutoRefresh()
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    authRefresh.cleanup()
  })

  return {
    // State
    auth,
    ssoAuth: ssoLocalAuth,
    loginStatus: readonly(loginStatus),
    lastError: readonly(lastError),

    // Computed
    isTokenValid,
    isLoggedIn,

    // Actions
    setAuth,
    setSSOAuth,
    refreshToken,
    login,
    logout,
    validateSession,

    // SSO Actions
    loginWithInterKnot,
    logoutFromInterKnot,
    refreshInterKnotToken,
    isInterKnotTokenValid: () => ssoAuth.isInterKnotTokenValid(),
    isSSOTokenValid: (platform: string) => {
      if (platform === 'interKnot') {
        return { value: ssoAuth.isInterKnotTokenValid() }
      }
      throw createAuthError.networkError(new Error(`SSO platform ${platform} not supported`))
    },
    refreshSSOAuth: async (platform: string) => {
      if (platform === 'interKnot') {
        return refreshInterKnotToken()
      }
      throw createAuthError.networkError(new Error(`SSO platform ${platform} not supported`))
    },

    // Token management
    ensureTokenRefreshMission: () => authRefresh.startAutoRefresh(),

    // Debug
    getDebugInfo,

    // Internal (for testing)
    _tokenManager: tokenManager,
    _authRefresh: authRefresh,
    _ssoAuth: ssoAuth,
  }
})
