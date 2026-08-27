import type { useTokenManager } from './useTokenManager'
import { isHTTPError } from 'ky'
import { ref, watch } from 'vue'
import { toCamelCaseObject } from '@/utils'
import { oauth } from '../apis/forum/gitee'
import { AuthError, createAuthError } from '../utils/auth-errors'
import { log, LogGroup } from '../utils/auth-logger'

const TOKEN_REFRESH_BASE_RETRY_INTERVAL_MS = 5000
const TOKEN_REFRESH_MAX_RETRIES = 3
const TOKEN_REFRESH_BACKGROUND_RETRY_MS = 60 * 1000
/** 后台重试最大轮数，避免持久故障下无限刷接口 */
const MAX_BACKGROUND_RETRY_ROUNDS = 5
/** setTimeout 上限（约 24.8 天），超出会溢出为立即执行 */
const MAX_TIMER_DELAY_MS = 2 ** 31 - 2
const CROSS_TAB_LOCK_NAME = 'gitee-token-refresh'

interface LockManagerLike {
  request: (name: string, callback: () => Promise<void>) => Promise<void>
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export function useAuthRefresh(tokenManager: ReturnType<typeof useTokenManager>) {
  // Refresh timer management
  let refreshTimer: ReturnType<typeof setTimeout> | null = null
  let backgroundRetryTimer: ReturnType<typeof setTimeout> | null = null
  const retryCount = ref(0)
  let backgroundRetryRounds = 0
  let isAutoRefreshActive = false
  let stopAuthWatcher: (() => void) | null = null
  let listenersAttached = false

  /** refresh_token 被服务端拒绝（400/401/403）视为致命；网络抖动/5xx 可重试 */
  function isFatalRefreshError(error: unknown): boolean {
    const original = error instanceof AuthError && error.originalError
      ? error.originalError
      : error
    return isHTTPError(original) && [400, 401, 403].includes(original.response.status)
  }

  function stopRefreshTimer(): void {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }

  function stopBackgroundRetry(): void {
    if (backgroundRetryTimer) {
      clearTimeout(backgroundRetryTimer)
      backgroundRetryTimer = null
    }
    backgroundRetryRounds = 0
  }

  function scheduleTokenRefresh(): void {
    stopRefreshTimer()

    if (!tokenManager.localAuth.value?.accessToken) {
      log.warn(LogGroup.REFRESH, 'No access token available for refresh scheduling')
      return
    }

    const timeUntilRefresh = tokenManager.getTimeUntilRefresh(tokenManager.localAuth.value.expiresTime)

    if (timeUntilRefresh <= 0) {
      log.info(LogGroup.REFRESH, 'Token needs immediate refresh')
      refreshToken().catch(err =>
        log.warn(LogGroup.REFRESH, 'Immediate token refresh failed', err),
      )
      return
    }

    log.info(LogGroup.REFRESH, `Scheduling token refresh in ${Math.round(timeUntilRefresh / 1000)}s`)

    // 超长延迟按 setTimeout 上限截断；触发时重新评估，兼容超长寿命 token 与系统时钟调整
    const delay = Math.min(timeUntilRefresh, MAX_TIMER_DELAY_MS)
    refreshTimer = setTimeout(() => {
      const current = tokenManager.localAuth.value
      if (!current?.expiresTime || tokenManager.getTimeUntilRefresh(current.expiresTime) > 0) {
        scheduleTokenRefresh()
        return
      }
      refreshToken().catch(err =>
        log.warn(LogGroup.REFRESH, 'Scheduled token refresh failed', err),
      )
    }, delay)
  }

  /** 兜底路径：低频后台重试，online/visibilitychange 可提前唤醒 */
  function scheduleBackgroundRetry(): void {
    stopBackgroundRetry()
    backgroundRetryRounds++

    if (backgroundRetryRounds > MAX_BACKGROUND_RETRY_ROUNDS) {
      log.warn(LogGroup.REFRESH, 'Background retry rounds exhausted, waiting for network/visibility events')
      return
    }

    log.info(LogGroup.REFRESH, `Scheduling background token refresh in ${TOKEN_REFRESH_BACKGROUND_RETRY_MS / 1000}s (round ${backgroundRetryRounds})`)
    backgroundRetryTimer = setTimeout(() => {
      refreshToken().catch(err =>
        log.warn(LogGroup.REFRESH, 'Background token refresh failed', err),
      )
    }, TOKEN_REFRESH_BACKGROUND_RETRY_MS)
  }

  function handleNetworkRecovery(): void {
    if (!tokenManager.localAuth.value?.accessToken || tokenManager.isTokenValid.value)
      return
    if (tokenManager.isTokenRefreshing.value)
      return

    log.info(LogGroup.REFRESH, 'Network/visibility recovered, retrying token refresh')
    backgroundRetryRounds = 0
    refreshToken().catch(err =>
      log.warn(LogGroup.REFRESH, 'Recovery token refresh failed', err),
    )
  }

  const handleOnline = () => handleNetworkRecovery()
  const handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible')
      handleNetworkRecovery()
  }

  function attachRecoveryListeners(): void {
    if (listenersAttached || typeof window === 'undefined')
      return
    listenersAttached = true
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  function detachRecoveryListeners(): void {
    if (!listenersAttached || typeof window === 'undefined')
      return
    listenersAttached = false
    window.removeEventListener('online', handleOnline)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  function handleSessionExpired(): void {
    retryCount.value = 0
    stopRefreshTimer()
    stopBackgroundRetry()
    tokenManager.clearTokens()

    if (!import.meta.env.SSR && typeof location !== 'undefined')
      location.hash = 'login-alert'
  }

  /** 经 Web Locks 互斥执行一次真实刷新 */
  async function executeRefreshOnce(): Promise<void> {
    const authBefore = tokenManager.localAuth.value
    if (!authBefore?.refreshToken)
      throw createAuthError.tokenRefreshFailed()

    const doRefresh = async (): Promise<void> => {
      // 等待锁期间其他标签页可能已完成刷新
      const current = tokenManager.localAuth.value
      if (
        current?.expiresTime
        && current.expiresTime !== authBefore.expiresTime
        && tokenManager.isTokenValid.value
      ) {
        log.info(LogGroup.REFRESH, 'Token already refreshed by another tab, skipping')
        return
      }

      const refreshTokenValue = current?.refreshToken ?? authBefore.refreshToken
      const response = await oauth.refreshToken(refreshTokenValue)

      if (!response.success)
        throw response.error

      const camelResponse = toCamelCaseObject(response.data as unknown as Record<string, unknown>)

      if (!validateRefreshResponse(camelResponse))
        throw createAuthError.tokenRefreshFailed()

      tokenManager.setTokens({
        accessToken: camelResponse.accessToken as string,
        expiresIn: camelResponse.expiresIn as number,
        refreshToken: camelResponse.refreshToken as string,
        scope: camelResponse.scope as string,
        tokenType: camelResponse.tokenType as string,
        createdAt: Date.now(),
      })
    }

    const locks = typeof navigator !== 'undefined'
      ? (navigator as unknown as { locks?: LockManagerLike }).locks
      : undefined

    if (locks)
      await locks.request(CROSS_TAB_LOCK_NAME, doRefresh)
    else
      await doRefresh()
  }

  /** 快速重试递增后退，耗尽后转后台低频重试；致命错误终结会话 */
  async function refreshWithRetry(): Promise<void> {
    for (;;) {
      try {
        await executeRefreshOnce()

        retryCount.value = 0
        backgroundRetryRounds = 0
        log.success(LogGroup.REFRESH, 'Token refresh successful')

        scheduleTokenRefresh()
        return
      }
      catch (error) {
        if (isFatalRefreshError(error)) {
          log.error(LogGroup.REFRESH, 'Refresh token rejected by server, session terminated', error)
          throw createAuthError.tokenInvalid(error instanceof Error ? error : new Error(String(error)))
        }

        retryCount.value++

        if (retryCount.value > TOKEN_REFRESH_MAX_RETRIES) {
          // 可恢复错误：保留会话，转入后台重试
          log.error(LogGroup.REFRESH, 'Token refresh fast retries exhausted, switching to background retry', error)
          scheduleBackgroundRetry()
          throw createAuthError.tokenRefreshFailed(error instanceof Error ? error : new Error(String(error)))
        }

        const retryInterval = TOKEN_REFRESH_BASE_RETRY_INTERVAL_MS * 2 ** (retryCount.value - 1)
        log.info(LogGroup.REFRESH, `Retrying token refresh in ${retryInterval}ms`, {
          attempt: retryCount.value,
          maxRetries: TOKEN_REFRESH_MAX_RETRIES,
        })

        await sleep(retryInterval)

        // 退避期间其他标签页可能已刷新成功
        if (tokenManager.isTokenValid.value) {
          retryCount.value = 0
          scheduleTokenRefresh()
          return
        }
        if (!tokenManager.localAuth.value?.refreshToken)
          throw createAuthError.tokenRefreshFailed()
      }
    }
  }

  async function refreshToken(): Promise<void> {
    // 已有刷新进行中则等待并复用其结果（单飞）
    if (tokenManager.isTokenRefreshing.value) {
      log.info(LogGroup.REFRESH, 'Token refresh already in progress, joining')
      return tokenManager.waitForRefreshComplete()
    }

    if (!tokenManager.localAuth.value?.refreshToken) {
      log.error(LogGroup.REFRESH, 'No refresh token available')
      throw createAuthError.tokenRefreshFailed()
    }

    tokenManager.isTokenRefreshing.value = true
    tokenManager.lastRefreshAttempt.value = Date.now()
    tokenManager.startRefreshTracking()

    try {
      await refreshWithRetry()
      tokenManager.completeRefreshTracking(true)
    }
    catch (error) {
      // 先 settle 等待者再清会话，保证 waitForTokenReady 拿到带类型的错误
      tokenManager.completeRefreshTracking(false, error)
      if (error instanceof AuthError && error.requiresReauth())
        handleSessionExpired()
      throw error
    }
    finally {
      tokenManager.isTokenRefreshing.value = false
    }
  }

  function validateRefreshResponse(response: Record<string, unknown>): boolean {
    const requiredFields = ['accessToken', 'expiresIn', 'refreshToken']

    for (const field of requiredFields) {
      if (!(field in response) || response[field] == null) {
        // 不打印响应原文，避免泄露 token
        log.warn(LogGroup.REFRESH, `Missing required field: ${field}`, { fields: Object.keys(response) })
        return false
      }
    }

    if (typeof response.accessToken !== 'string') {
      log.warn(LogGroup.REFRESH, 'accessToken is not a string')
      return false
    }

    if (typeof response.expiresIn !== 'number' || response.expiresIn <= 0) {
      log.warn(LogGroup.REFRESH, 'expiresIn is not a positive number')
      return false
    }

    if (typeof response.refreshToken !== 'string') {
      log.warn(LogGroup.REFRESH, 'refreshToken is not a string')
      return false
    }

    return true
  }

  function startAutoRefresh(): void {
    // 幂等：重复调用不会叠加 watcher
    if (isAutoRefreshActive)
      return
    isAutoRefreshActive = true

    attachRecoveryListeners()

    if (tokenManager.localAuth.value?.accessToken)
      scheduleTokenRefresh()

    stopAuthWatcher = watch(
      () => tokenManager.localAuth.value,
      (newAuth) => {
        if (newAuth?.accessToken && newAuth?.expiresTime) {
          scheduleTokenRefresh()
        }
        else {
          stopRefreshTimer()
          stopBackgroundRetry()
        }
      },
    )
  }

  function stopAutoRefresh(): void {
    stopAuthWatcher?.()
    stopAuthWatcher = null
    isAutoRefreshActive = false
    stopRefreshTimer()
    stopBackgroundRetry()
    detachRecoveryListeners()
    retryCount.value = 0
  }

  return {
    // State
    retryCount,

    // Actions
    refreshToken,
    scheduleTokenRefresh,
    startAutoRefresh,
    stopAutoRefresh,
  }
}
