import type { SSOLocaleAuth } from '../stores/useUserAuth'
import type { useSSOAuth } from './useSSOAuth'
import type { useTokenManager } from './useTokenManager'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { createAuthError } from '../utils/auth-errors'
import { log, LogGroup } from '../utils/auth-logger'

const SSO_REFRESH_THRESHOLD_MS = 5 * 60 * 1000
const SSO_MIN_REFRESH_INTERVAL_MS = 30 * 1000
const MAX_SSO_REFRESH_RETRIES = 3
const SSO_RETRY_DELAY_MS = 60 * 1000

export function useSSORefreshManager(
  tokenManager: ReturnType<typeof useTokenManager>,
  ssoAuth: ReturnType<typeof useSSOAuth>,
) {
  const ssoRefreshTimers = ref<Record<string, NodeJS.Timeout | null>>({})
  const isRefreshingSSO = ref<Record<string, boolean>>({})
  const lastSSORefreshAttempt = ref<Record<string, number>>({})
  const ssoRefreshRetryCount = ref<Record<string, number>>({})
  const isManagerActive = ref(false)
  function getSSOTimeUntilRefresh(platform: keyof SSOLocaleAuth): number {
    const ssoToken = tokenManager.ssoAuth.value[platform]
    if (!ssoToken?.expiresTime)
      return -1

    const timeUntilRefresh = ssoToken.expiresTime - Date.now() - SSO_REFRESH_THRESHOLD_MS

    if (timeUntilRefresh < 0 || timeUntilRefresh > 24 * 60 * 60 * 1000) {
      log.warn(LogGroup.SSO, `Invalid SSO refresh time calculated for ${platform}`, {
        expiresTime: ssoToken.expiresTime,
        currentTime: Date.now(),
        timeUntilRefresh,
      })
      return -1
    }

    return timeUntilRefresh
  }
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

      return getSSOTimeUntilRefresh(platform) <= 0
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

      const timeUntilRefresh = getSSOTimeUntilRefresh(platform)

      if (timeUntilRefresh <= 0) {
        log.info(LogGroup.SSO, `${platform} SSO token needs immediate refresh`)
        refreshSSOToken(platform).catch(err =>
          log.warn(LogGroup.SSO, `Immediate SSO refresh failed for ${platform}`, err),
        )
        return
      }

      if (timeUntilRefresh > 0) {
        log.info(LogGroup.SSO, `Scheduling ${platform} SSO token refresh in ${Math.round(timeUntilRefresh / 1000)}s`)

        ssoRefreshTimers.value[platform] = setTimeout(() => {
          refreshSSOToken(platform).catch(err =>
            log.warn(LogGroup.SSO, `Scheduled SSO refresh failed for ${platform}`, err),
          )
        }, timeUntilRefresh)
      }
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

  let cleanup = (): void => {
    try {
      stopAllSSORefresh()
    }
    catch (error) {
      log.warn(LogGroup.SSO, 'SSO refresh manager cleanup failed', error)
    }
  }

  function startSSOAutoRefresh(): void {
    try {
      if (isManagerActive.value) {
        return
      }

      log.info(LogGroup.SSO, 'Starting SSO auto refresh manager')
      isManagerActive.value = true

      checkAndRefreshAllSSOTokens()

      const stopSSOWatcher = watch(
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
      )

      const stopMainTokenWatcher = watch(
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
      )

      const originalCleanupFn = cleanup

      cleanup = () => {
        try {
          stopSSOWatcher()
        }
        catch (error) {
          log.warn(LogGroup.SSO, 'SSO watcher cleanup failed', error)
        }

        try {
          stopMainTokenWatcher()
        }
        catch (error) {
          log.warn(LogGroup.SSO, 'Main token watcher cleanup failed', error)
        }

        try {
          originalCleanupFn()
        }
        catch (error) {
          log.warn(LogGroup.SSO, 'Original cleanup failed', error)
        }
      }
    }
    catch (error) {
      log.error(LogGroup.SSO, 'Failed to start SSO auto refresh', error)
      isManagerActive.value = false
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
      isManagerActive.value = false
      log.info(LogGroup.SSO, 'All SSO auto refresh stopped')
    }
    catch (error) {
      log.warn(LogGroup.SSO, 'Failed to stop all SSO refresh', error)
    }
  }

  onBeforeUnmount(() => {
    cleanup()
  })
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
    cleanup,

    // 工具函数
    getSSOTimeUntilRefresh,
    getDebugInfo,
  }
}
