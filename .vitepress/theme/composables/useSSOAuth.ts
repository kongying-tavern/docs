import type { useTokenManager } from './useTokenManager'
import { oauth as interKnotOauth } from '../apis/interknot.site'
import { createAuthError } from '../utils/auth-errors'
import { log, LogGroup } from '../utils/auth-logger'

export function useSSOAuth(tokenManager: ReturnType<typeof useTokenManager>) {
  // 单飞：并发刷新共享同一次请求
  let interKnotRefreshPromise: Promise<void> | null = null

  async function doRefreshInterKnotToken(): Promise<void> {
    log.info(LogGroup.SSO, 'Starting interknot token refresh')

    const currentAccessToken = tokenManager.localAuth.value?.accessToken
    if (!currentAccessToken) {
      throw createAuthError.tokenMissing()
    }

    const result = await interKnotOauth.refreshToken(currentAccessToken)

    if (!result.success) {
      throw result.error
    }

    const ssoData = result.data
    if (ssoData?.accessToken && ssoData?.expiresIn) {
      const authData = {
        accessToken: ssoData.accessToken,
        expiresIn: ssoData.expiresIn,
        createdAt: Date.now(),
      }

      tokenManager.setSSOToken('interKnot', authData)
      log.success(LogGroup.SSO, 'interknot token refreshed successfully')
    }
    else {
      throw createAuthError.ssoRefreshFailed(undefined, 'interknot')
    }
  }

  async function refreshInterKnotToken(): Promise<void> {
    if (interKnotRefreshPromise)
      return interKnotRefreshPromise

    interKnotRefreshPromise = doRefreshInterKnotToken()

    try {
      await interKnotRefreshPromise
    }
    catch (error) {
      log.error(LogGroup.SSO, 'interknot token refresh failed', error)
      throw createAuthError.ssoRefreshFailed(error as Error, 'interknot')
    }
    finally {
      interKnotRefreshPromise = null
    }
  }

  async function logoutFromInterKnot(): Promise<void> {
    try {
      log.info(LogGroup.SSO, 'Starting interknot logout')

      // 先取到 SSO token 用于服务端吊销，再清本地
      const ssoToken = tokenManager.ssoAuth.value.interKnot?.accessToken
      tokenManager.clearSSOTokens()

      // Attempt to logout from server (optional, don't fail if this fails)
      try {
        if (ssoToken)
          await interKnotOauth.logout(ssoToken)
        log.success(LogGroup.SSO, 'interknot logout successful')
      }
      catch (error) {
        log.warn(LogGroup.SSO, 'interknot server logout failed, but local tokens cleared', error)
      }
    }
    catch (error) {
      log.error(LogGroup.SSO, 'interknot logout failed', error)
      throw createAuthError.networkError(error as Error)
    }
  }

  function isInterKnotTokenValid(): boolean {
    return tokenManager.validateSSOToken('interKnot')
  }

  return {
    refreshInterKnotToken,
    logoutFromInterKnot,
    isInterKnotTokenValid,
  }
}
