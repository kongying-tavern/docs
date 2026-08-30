import type ForumAPI from '@/apis/forum/api'
import { defineStore } from 'pinia'
import { computed, readonly, ref, watch } from 'vue'
import { toCamelCaseObject } from '@/utils'
import { registerAuthSessionAccessor } from '../apis/auth-session'
import { useAuthRefresh } from '../composables/useAuthRefresh'
import { useSSOAuth } from '../composables/useSSOAuth'
import { useSSORefreshManager } from '../composables/useSSORefreshManager'
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
  const ssoRefreshManager = useSSORefreshManager(tokenManager, ssoAuth)

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
      const { refreshToken, expiresIn, tokenType, accessToken, scope }
        = toCamelCaseObject(newAuth as unknown as Record<string, string>) as unknown as LocalAuth

      if (!accessToken || !expiresIn) {
        throw createAuthError.tokenInvalid()
      }

      tokenManager.setTokens({
        accessToken,
        refreshToken: refreshToken || '',
        expiresIn: Number(expiresIn),
        tokenType: tokenType || 'bearer',
        scope: scope || 'user_info',
        createdAt: Date.now(),
      })

      loginStatus.value = 'success'
      lastError.value = null
      log.success(LogGroup.AUTH, 'Authentication data set successfully')
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

  const logout = (): void => {
    log.info(LogGroup.AUTH, 'Starting logout process')
    try {
      authRefresh.stopAutoRefresh()

      try {
        ssoRefreshManager.stopAllSSORefresh()
      }
      catch (error) {
        log.warn(LogGroup.SSO, 'Failed to stop SSO auto refresh, but logout continues', error)
      }

      tokenManager.clearAllTokens()

      loginStatus.value = 'idle'
      lastError.value = null

      log.success(LogGroup.AUTH, 'Logout successful')
    }
    catch (error) {
      log.error(LogGroup.AUTH, 'Logout failed', error)
      throw createAuthError.networkError(error as Error)
    }
  }

  const logoutFromInterKnot = async () => {
    return ssoAuth.logoutFromInterKnot()
  }

  const refreshInterKnotToken = async () => {
    return ssoAuth.refreshInterKnotToken()
  }

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

  // token 出现（登录/跨标签页同步）时启动自动刷新；两个启动函数均为幂等
  watch(
    () => tokenManager.localAuth.value?.accessToken,
    (accessToken) => {
      if (!accessToken)
        return

      authRefresh.startAutoRefresh()

      try {
        ssoRefreshManager.startSSOAutoRefresh()
      }
      catch (error) {
        log.warn(LogGroup.SSO, 'Failed to initialize SSO auto refresh, but main auth is working', error)
      }
    },
    { immediate: true },
  )

  // 把认证状态注入给 API 层（gitee/interknot client），断开 client ↔ store 的模块环
  registerAuthSessionAccessor({
    isTokenValid: () => isTokenValid.value,
    getAccessToken: () => auth.value?.accessToken ?? null,
    refreshToken: () => refreshToken(),
    waitForTokenReady: () => tokenManager.waitForRefreshComplete(),
    isInterKnotTokenValid: () => ssoAuth.isInterKnotTokenValid(),
    getInterKnotAccessToken: () => tokenManager.ssoAuth.value.interKnot?.accessToken ?? null,
    refreshSSOAuth: () => ssoAuth.refreshInterKnotToken(),
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
    logout,

    // SSO Actions
    logoutFromInterKnot,
    refreshInterKnotToken,
    isInterKnotTokenValid: () => ssoAuth.isInterKnotTokenValid(),
    isSSOTokenValid: (platform: string) => {
      if (platform === 'interKnot') {
        return computed(() => ssoAuth.isInterKnotTokenValid())
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
    waitForTokenReady: tokenManager.waitForRefreshComplete,

    // Debug
    getDebugInfo,

    // SSO Refresh Management
    startSSOAutoRefresh: () => ssoRefreshManager.startSSOAutoRefresh(),
    stopSSOAutoRefresh: () => ssoRefreshManager.stopAllSSORefresh(),
    getSSORefreshDebugInfo: () => ssoRefreshManager.getDebugInfo(),
  }
})
