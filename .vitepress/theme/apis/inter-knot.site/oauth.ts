import type { AuthResult } from '../../utils/auth-errors'
import type { INTER_KNOT } from './api'
import type { SSOAuth } from '@/stores/useUserAuth'
import { fetcher } from '.'
import { createAuthError } from '../../utils/auth-errors'
import { catchError } from '../utils'
import { generateRandomString, normalizeSSOAuth, signToken } from './utils'

export async function refreshToken(accessToken: string): Promise<AuthResult<SSOAuth>> {
  const nonce = generateRandomString(16)
  const signedToken = await signToken(accessToken, nonce)

  const [error, auth] = await catchError<INTER_KNOT.AuthResponse>(fetcher.post('sso/refresh-token', { json: { token: accessToken, provider: 'gitee', signature: signedToken, nonce } }).json())

  if (error) {
    return {
      success: false,
      error: createAuthError.ssoRefreshFailed(error, 'inter-knot'),
    }
  }

  return {
    success: true,
    data: normalizeSSOAuth(auth),
  }
}

export async function logout(accessToken?: string): Promise<AuthResult<INTER_KNOT.LogoutResponse>> {
  const [error, data] = await catchError<INTER_KNOT.LogoutResponse>(fetcher.get('sso/logout', {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  }).json())

  if (error) {
    return {
      success: false,
      error: createAuthError.ssoRefreshFailed(error, 'inter-knot-logout'),
    }
  }

  return {
    success: true,
    data,
  }
}
