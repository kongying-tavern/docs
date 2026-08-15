import type { useTokenManager } from './useTokenManager'
import { oauth as interKnotOauth } from '../apis/interknot.site'
import { createAuthError } from '../utils/auth-errors'
import { log, LogGroup } from '../utils/auth-logger'

export function useSSOAuth(tokenManager: ReturnType<typeof useTokenManager>) {
  async function refreshInterKnotToken(): Promise<void> {
    try {
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
    catch (error) {
      log.error(LogGroup.SSO, 'interknot token refresh failed', error)
      throw createAuthError.ssoRefreshFailed(error as Error, 'interknot')
    }
  }

  function isInterKnotTokenValid(): boolean {
    return tokenManager.validateSSOToken('interKnot')
  }

  return {
    refreshInterKnotToken,
    isInterKnotTokenValid,
  }
}
