import type { AuthResult } from '../../utils/auth-errors'
import type { INTER_KNOT } from './api'
import type { SSOAuth } from '@/stores/useUserAuth'
import { fetcher, SSO_SESSION_CONTEXT } from '.'
import { createAuthError } from '../../utils/auth-errors'
import { catchError } from '../utils'
import { generateRandomString, normalizeSSOAuth, signToken } from './utils'

export async function refreshToken(accessToken: string): Promise<AuthResult<SSOAuth>> {
  const nonce = generateRandomString(16)
  const signedToken = await signToken(accessToken, nonce)

  const [error, auth] = await catchError(
    fetcher
      .post('sso/refresh-token', {
        // 会话接口跳过 SSO hooks（见 SSO_SESSION_CONTEXT）；重试交由上层刷新策略负责
        context: SSO_SESSION_CONTEXT,
        retry: 0,
        json: {
          token: accessToken,
          provider: 'gitee',
          signature: signedToken,
          nonce,
        },
      })
      .json<INTER_KNOT.AuthResponse>(),
  )

  if (error) {
    return {
      success: false,
      error: createAuthError.ssoRefreshFailed(error, 'interknot'),
    }
  }

  return {
    success: true,
    data: normalizeSSOAuth(auth),
  }
}

export async function logout(accessToken?: string): Promise<AuthResult<INTER_KNOT.LogoutResponse>> {
  const [error, data] = await catchError(
    fetcher
      .get('sso/logout', {
        context: SSO_SESSION_CONTEXT,
        retry: 0,
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      })
      .json<INTER_KNOT.LogoutResponse>(),
  )

  if (error) {
    return {
      success: false,
      error: createAuthError.ssoRefreshFailed(error, 'interknot-logout'),
    }
  }

  return {
    success: true,
    data,
  }
}
