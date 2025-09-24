import type { useTokenManager } from './useTokenManager'
import { toCamelCaseObject } from '@/utils'
import { isObject } from 'lodash-es'
import { oauth as interKnotOauth } from '../apis/inter-knot.site/'
import { createAuthError } from '../utils/auth-errors'
import { log, LogGroup } from '../utils/auth-logger'

export function useSSOAuth(tokenManager: ReturnType<typeof useTokenManager>) {
  async function refreshInterKnotToken(): Promise<void> {
    try {
      log.info(LogGroup.SSO, 'Starting Inter-knot token refresh')

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
        log.success(LogGroup.SSO, 'Inter-knot token refreshed successfully')
      }
      else {
        throw createAuthError.ssoRefreshFailed(undefined, 'Inter-knot')
      }
    }
    catch (error) {
      log.error(LogGroup.SSO, 'Inter-knot token refresh failed', error)
      throw createAuthError.ssoRefreshFailed(error as Error, 'Inter-knot')
    }
  }

  async function loginWithInterKnot(_credentials: { username: string, password: string }): Promise<void> {
    log.warn(LogGroup.SSO, 'Inter-knot direct login is not implemented yet')
    throw createAuthError.networkError(new Error('Inter-knot direct login is not implemented yet'))
  }

  async function logoutFromInterKnot(): Promise<void> {
    try {
      log.info(LogGroup.SSO, 'Starting Inter-knot logout')

      // Clear local SSO token first
      tokenManager.clearSSOTokens()

      // Attempt to logout from server (optional, don't fail if this fails)
      try {
        await interKnotOauth.logout()
        log.success(LogGroup.SSO, 'Inter-knot logout successful')
      }
      catch (error) {
        log.warn(LogGroup.SSO, 'Inter-knot server logout failed, but local tokens cleared', error)
      }
    }
    catch (error) {
      log.error(LogGroup.SSO, 'Inter-knot logout failed', error)
      throw createAuthError.networkError(error as Error)
    }
  }

  function validateSSOResponse(response: unknown): boolean {
    if (!isObject(response)) {
      log.warn(LogGroup.SSO, 'SSO response is not an object', response)
      return false
    }

    const camelCaseResponse = toCamelCaseObject(response as unknown as Record<string, unknown>)

    // Check for common SSO response fields
    const hasAccessToken = 'accessToken' in camelCaseResponse && typeof camelCaseResponse.accessToken === 'string'
    const hasExpiresIn = 'expiresIn' in camelCaseResponse && typeof camelCaseResponse.expiresIn === 'number'

    if (!hasAccessToken || !hasExpiresIn) {
      log.warn(LogGroup.SSO, 'SSO response missing required fields', {
        hasAccessToken,
        hasExpiresIn,
        response: camelCaseResponse,
      })
      return false
    }

    return true
  }

  function isInterKnotTokenValid(): boolean {
    return tokenManager.validateSSOToken('interKnot')
  }

  return {
    // Inter-knot specific methods
    refreshInterKnotToken,
    loginWithInterKnot,
    logoutFromInterKnot,
    isInterKnotTokenValid,

    // General SSO utilities
    validateSSOResponse,
  }
}
