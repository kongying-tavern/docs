import type { useTokenManager } from './useTokenManager'
import { toCamelCaseObject } from '@/utils'
import { ref, watch } from 'vue'
import { oauth } from '../apis/forum/gitee'
import { createAuthError } from '../utils/auth-errors'
import { log, LogGroup } from '../utils/auth-logger'

const TOKEN_REFRESH_BASE_RETRY_INTERVAL_MS = 5000

export function useAuthRefresh(tokenManager: ReturnType<typeof useTokenManager>) {
  // Refresh timer management
  let refreshTimer: NodeJS.Timeout | null = null
  const retryCount = ref(0)
  const maxRetries = 3

  function scheduleTokenRefresh(): void {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }

    if (!tokenManager.localAuth.value?.accessToken) {
      log.warn(LogGroup.REFRESH, 'No access token available for refresh scheduling')
      return
    }

    const timeUntilRefresh = tokenManager.getTimeUntilRefresh(tokenManager.localAuth.value.expiresTime)

    if (timeUntilRefresh <= 0) {
      log.info(LogGroup.REFRESH, 'Token needs immediate refresh')
      refreshToken()
      return
    }

    log.info(LogGroup.REFRESH, `Scheduling token refresh in ${Math.round(timeUntilRefresh / 1000)}s`)

    refreshTimer = setTimeout(() => {
      refreshToken()
    }, timeUntilRefresh)
  }

  async function refreshToken(): Promise<void> {
    if (tokenManager.isTokenRefreshing.value) {
      log.info(LogGroup.REFRESH, 'Token refresh already in progress, skipping')
      return
    }

    if (!tokenManager.localAuth.value?.refreshToken) {
      log.error(LogGroup.REFRESH, 'No refresh token available')
      throw createAuthError.tokenRefreshFailed()
    }

    tokenManager.isTokenRefreshing.value = true
    tokenManager.lastRefreshAttempt.value = Date.now()

    try {
      log.info(LogGroup.REFRESH, 'Starting token refresh', {
        attempt: retryCount.value + 1,
        maxRetries,
      })

      const response = await oauth.refreshToken(tokenManager.localAuth.value.refreshToken)

      if (!response.success) {
        throw response.error
      }

      const authData = response.data
      const camelResponse = toCamelCaseObject(authData as unknown as Record<string, unknown>)

      if (!validateRefreshResponse(camelResponse)) {
        throw createAuthError.tokenRefreshFailed()
      }

      // Update tokens
      tokenManager.setTokens({
        accessToken: camelResponse.accessToken as string,
        expiresIn: camelResponse.expiresIn as number,
        refreshToken: camelResponse.refreshToken as string,
        scope: camelResponse.scope as string,
        tokenType: camelResponse.tokenType as string,
        createdAt: Date.now(),
      })

      // Reset retry count on success
      retryCount.value = 0

      log.success(LogGroup.REFRESH, 'Token refresh successful')

      // Schedule next refresh
      scheduleTokenRefresh()
    }
    catch (error) {
      log.error(LogGroup.REFRESH, 'Token refresh failed', error)

      retryCount.value++

      if (retryCount.value < maxRetries) {
        // Exponential backoff: 5s, 10s, 20s
        const retryInterval = TOKEN_REFRESH_BASE_RETRY_INTERVAL_MS * 2 ** (retryCount.value - 1)

        log.info(LogGroup.REFRESH, `Retrying token refresh in ${retryInterval}ms`, {
          attempt: retryCount.value,
          maxRetries,
        })

        setTimeout(() => {
          refreshToken()
        }, retryInterval)
      }
      else {
        log.error(LogGroup.REFRESH, 'Max refresh retries exceeded, clearing tokens')
        tokenManager.clearTokens()
        retryCount.value = 0

        throw createAuthError.tokenRefreshFailed(error instanceof Error ? error : new Error(String(error)))
      }
    }
    finally {
      tokenManager.isTokenRefreshing.value = false
    }
  }

  function validateRefreshResponse(response: Record<string, unknown>): boolean {
    const requiredFields = ['accessToken', 'expiresIn', 'refreshToken']

    for (const field of requiredFields) {
      if (!(field in response) || response[field] == null) {
        log.warn(LogGroup.REFRESH, `Missing required field: ${field}`, response)
        return false
      }
    }

    // Validate types
    if (typeof response.accessToken !== 'string') {
      log.warn(LogGroup.REFRESH, 'accessToken is not a string', response.accessToken)
      return false
    }

    if (typeof response.expiresIn !== 'number' || response.expiresIn <= 0) {
      log.warn(LogGroup.REFRESH, 'expiresIn is not a positive number', response.expiresIn)
      return false
    }

    if (typeof response.refreshToken !== 'string') {
      log.warn(LogGroup.REFRESH, 'refreshToken is not a string', response.refreshToken)
      return false
    }

    return true
  }

  function stopRefreshTimer(): void {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
      log.info(LogGroup.REFRESH, 'Refresh timer stopped')
    }
  }

  function startAutoRefresh(): void {
    if (tokenManager.localAuth.value?.accessToken) {
      scheduleTokenRefresh()
    }

    // Watch for token changes to reschedule refresh
    watch(
      () => tokenManager.localAuth.value,
      (newAuth) => {
        if (newAuth?.accessToken && newAuth?.expiresTime) {
          scheduleTokenRefresh()
        }
        else {
          stopRefreshTimer()
        }
      },
      { immediate: true },
    )
  }

  function stopAutoRefresh(): void {
    stopRefreshTimer()
    retryCount.value = 0
  }

  // Cleanup on unmount
  function cleanup(): void {
    stopAutoRefresh()
  }

  return {
    // State
    retryCount,

    // Actions
    refreshToken,
    scheduleTokenRefresh,
    startAutoRefresh,
    stopAutoRefresh,
    cleanup,

    // Utilities
    validateRefreshResponse,
  }
}
