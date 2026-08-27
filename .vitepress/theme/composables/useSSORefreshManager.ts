import type { WatchStopHandle } from 'vue'
import type { SSOLocaleAuth } from '../stores/useUserAuth'
import type { useSSOAuth } from './useSSOAuth'
import type { useTokenManager } from './useTokenManager'
import { computed, ref, watch } from 'vue'
import { createAuthError } from '../utils/auth-errors'
import { log, LogGroup } from '../utils/auth-logger'

const SSO_REFRESH_THRESHOLD_MS = 5 * 60 * 1000
const SSO_MIN_REFRESH_INTERVAL_MS = 30 * 1000
const MAX_SSO_REFRESH_RETRIES = 3
const SSO_RETRY_DELAY_MS = 60 * 1000
/** setTimeout 上限（约 24.8 天），溢出会立即触发 */
const MAX_TIMER_DELAY_MS = 2 ** 31 - 2

export function useSSORefreshManager(
  tokenManager: ReturnType<typeof useTokenManager>,
  ssoAuth: ReturnType<typeof useSSOAuth>,
) {
  const ssoRefreshTimers = ref<Record<string, ReturnType<typeof setTimeout> | null>>({})
  const isRefreshingSSO = ref<Record<string, boolean>>({})
  const lastSSORefreshAttempt = ref<Record<string, number>>({})
  const ssoRefreshRetryCount = ref<Record<string, number>>({})
  const isManagerActive = ref(false)
  const watcherStopHandles: WatchStopHandle[] = []

  const shouldRefreshSSOToken = computed(() => {
    return (platform: keyof SSOLocaleAuth): boolean => {
      if (!isManagerActive.value)
        return false

      if (isRefreshingSSO.value[platform])
        return false

      if (!tokenManager.validateToken())
        return false

      const now = Date.now()
      const lastAttempt = lastSSORefreshAttempt.value[platform] || 0

      if (now - lastAttempt < SSO_MIN_REFRESH_INTERVAL_MS)
        return false

      const retryCount = ssoRefreshRetryCount.value[platform] || 0
      if (retryCount >= MAX_SSO_REFRESH_RETRIES) {
        log.warn(LogGroup.SSO, `${platform} SSO refresh max retries exceeded, skipping`)
        return false
      }

      return tokenManager.getSSOTimeUntilRefresh(platform, SSO_REFRESH_THRESHOLD_MS) <= 0
    }
  })

  function clearSSOTimer(platform: keyof SSOLocaleAuth): void {
    const timer = ssoRefreshTimers.value[platform]
    if (timer) {
      clearTimeout(timer)
      ssoRefreshTimers.value[platform] = null
    }
  }

  function scheduleSSOTokenRefresh(platform: keyof SSOLocaleAuth): void {
    try {
      clearSSOTimer(platform)

      const ssoToken = tokenManager.ssoAuth.value[platform]
      if (!ssoToken?.accessToken || !ssoToken.expiresTime) {
        return
      }

      if (!tokenManager.validateToken()) {
        return
      }

      const timeUntilRefresh = tokenManager.getSSOTimeUntilRefresh(platform, SSO_REFRESH_THRESHOLD_MS)

      if (timeUntilRefresh <= 0) {
        // 最小间隔保护：避免“立即刷新 → watcher → 再次立即刷新”的紧循环
        const lastAttempt = lastSSORefreshAttempt.value[platform] || 0
        const elapsed = Date.now() - lastAttempt
        if (elapsed < SSO_MIN_REFRESH_INTERVAL_MS) {
          ssoRefreshTimers.value[platform] = setTimeout(() => {
            scheduleSSOTokenRefresh(platform)
          }, SSO_MIN_REFRESH_INTERVAL_MS - elapsed)
          return
        }

        log.info(LogGroup.SSO, `${platform} SSO token needs immediate refresh`)
        refreshSSOToken(platform).catch(err =>
          log.warn(LogGroup.SSO, `Immediate SSO refresh failed for ${platform}`, err),
        )
        return
      }

      log.info(LogGroup.SSO, `Scheduling ${platform} SSO token refresh in ${Math.round(timeUntilRefresh / 1000)}s`)

      // 超长延迟截断到上限，触发时重新评估
      const delay = Math.min(timeUntilRefresh, MAX_TIMER_DELAY_MS)
      ssoRefreshTimers.value[platform] = setTimeout(() => {
        if (tokenManager.getSSOTimeUntilRefresh(platform, SSO_REFRESH_THRESHOLD_MS) <= 0) {
          refreshSSOToken(platform).catch(err =>
            log.warn(LogGroup.SSO, `Scheduled SSO refresh failed for ${platform}`, err),
          )
        }
        else {
          scheduleSSOTokenRefresh(platform)
        }
      }, delay)
    }
    catch (error) {
      log.warn(LogGroup.SSO, `Failed to schedule SSO refresh for ${platform}`, error)
    }
  }

  async function refreshSSOToken(platform: keyof SSOLocaleAuth): Promise<void> {
    try {
      if (isRefreshingSSO.value[platform]) {
        return
      }

      if (!tokenManager.validateToken()) {
        log.warn(LogGroup.SSO, `Cannot refresh ${platform} SSO token: main token is invalid`)
        return
      }

      const retryCount = ssoRefreshRetryCount.value[platform] || 0
      if (retryCount >= MAX_SSO_REFRESH_RETRIES) {
        return
      }

      isRefreshingSSO.value[platform] = true
      lastSSORefreshAttempt.value[platform] = Date.now()

      switch (platform) {
        case 'interKnot':
          await ssoAuth.refreshInterKnotToken()
          break
        default:
          throw createAuthError.networkError(new Error(`Unsupported SSO platform: ${platform}`))
      }

      ssoRefreshRetryCount.value[platform] = 0
      log.success(LogGroup.SSO, `${platform} SSO token refresh successful`)

      scheduleSSOTokenRefresh(platform)
    }
    catch (error) {
      log.error(LogGroup.SSO, `${platform} SSO token refresh failed`, error)

      const currentRetryCount = (ssoRefreshRetryCount.value[platform] || 0) + 1
      ssoRefreshRetryCount.value[platform] = currentRetryCount

      if (currentRetryCount < MAX_SSO_REFRESH_RETRIES) {
        setTimeout(() => {
          if (tokenManager.validateToken() && isManagerActive.value) {
            refreshSSOToken(platform).catch(err =>
              log.warn(LogGroup.SSO, `SSO retry failed for ${platform}`, err),
            )
          }
        }, SSO_RETRY_DELAY_MS)
      }
    }
    finally {
      isRefreshingSSO.value[platform] = false
    }
  }

  function checkAndRefreshAllSSOTokens(): void {
    if (!isManagerActive.value)
      return

    try {
      const platforms = Object.keys(tokenManager.ssoAuth.value) as (keyof SSOLocaleAuth)[]

      platforms.forEach((platform) => {
        const ssoToken = tokenManager.ssoAuth.value[platform]
        if (ssoToken?.accessToken) {
          if (shouldRefreshSSOToken.value(platform)) {
            refreshSSOToken(platform).catch(err =>
              log.warn(LogGroup.SSO, `SSO refresh check failed for ${platform}`, err),
            )
          }
          else {
            scheduleSSOTokenRefresh(platform)
          }
        }
      })
    }
    catch (error) {
      log.warn(LogGroup.SSO, 'Failed to check and refresh SSO tokens', error)
    }
  }

  function startSSOAutoRefresh(): void {
    // 幂等：重复调用不会叠加 watcher
    if (isManagerActive.value)
      return

    try {
      log.info(LogGroup.SSO, 'Starting SSO auto refresh manager')
      isManagerActive.value = true

      checkAndRefreshAllSSOTokens()

      watcherStopHandles.push(watch(
        () => tokenManager.ssoAuth.value,
        (newSSOAuth) => {
          if (!isManagerActive.value)
            return

          try {
            Object.keys(newSSOAuth).forEach((platform) => {
              const key = platform as keyof SSOLocaleAuth
              const ssoToken = newSSOAuth[key]
              if (ssoToken?.accessToken && ssoToken?.expiresTime) {
                ssoRefreshRetryCount.value[key] = 0
                scheduleSSOTokenRefresh(key)
              }
            })
          }
          catch (error) {
            log.warn(LogGroup.SSO, 'SSO token change handler failed', error)
          }
        },
        { deep: true },
      ))

      watcherStopHandles.push(watch(
        () => tokenManager.localAuth.value,
        (newAuth) => {
          if (!isManagerActive.value)
            return

          try {
            if (!newAuth?.accessToken) {
              log.info(LogGroup.SSO, 'Main token invalid, stopping SSO auto refresh')
              stopAllSSORefresh()
            }
            else {
              checkAndRefreshAllSSOTokens()
            }
          }
          catch (error) {
            log.warn(LogGroup.SSO, 'Main token change handler failed', error)
          }
        },
      ))
    }
    catch (error) {
      log.error(LogGroup.SSO, 'Failed to start SSO auto refresh', error)
      stopAllSSORefresh()
    }
  }

  function stopSSORefresh(platform: keyof SSOLocaleAuth): void {
    try {
      clearSSOTimer(platform)
      isRefreshingSSO.value[platform] = false
      ssoRefreshRetryCount.value[platform] = 0
    }
    catch (error) {
      log.warn(LogGroup.SSO, `Failed to stop SSO refresh for ${platform}`, error)
    }
  }

  function stopAllSSORefresh(): void {
    try {
      Object.keys(ssoRefreshTimers.value).forEach((platform) => {
        stopSSORefresh(platform as keyof SSOLocaleAuth)
      })
      // 连同 watcher 停止，防重复 start 叠加
      while (watcherStopHandles.length > 0) {
        watcherStopHandles.pop()?.()
      }
      isManagerActive.value = false
      log.info(LogGroup.SSO, 'All SSO auto refresh stopped')
    }
    catch (error) {
      log.warn(LogGroup.SSO, 'Failed to stop all SSO refresh', error)
    }
  }

  function getDebugInfo() {
    return {
      isManagerActive: isManagerActive.value,
      activeTimers: Object.keys(ssoRefreshTimers.value).filter(
        platform => ssoRefreshTimers.value[platform] !== null,
      ),
      refreshingPlatforms: Object.keys(isRefreshingSSO.value).filter(
        platform => isRefreshingSSO.value[platform],
      ),
      retryCount: { ...ssoRefreshRetryCount.value },
      lastAttempt: Object.keys(lastSSORefreshAttempt.value).reduce((acc, platform) => {
        acc[platform] = new Date(lastSSORefreshAttempt.value[platform]).toISOString()
        return acc
      }, {} as Record<string, string>),
    }
  }

  return {
    // 状态
    isRefreshingSSO,
    shouldRefreshSSOToken,
    isManagerActive,

    // 操作
    refreshSSOToken,
    scheduleSSOTokenRefresh,
    startSSOAutoRefresh,
    stopSSORefresh,
    stopAllSSORefresh,
    checkAndRefreshAllSSOTokens,

    // 工具函数
    getDebugInfo,
  }
}
