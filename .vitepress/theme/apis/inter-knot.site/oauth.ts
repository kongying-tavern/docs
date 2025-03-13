import type { SSOAuth } from '@/stores/useUserAuth'
import type { INTER_KNOT } from './api'
import { fetcher } from '.'
import { catchError } from '../utils'
import { generateRandomString, normalizeSSOAuth, signToken } from './utils'

export async function refreshToken(accessToken: string): Promise<[null, SSOAuth] | [Error, null]> {
  const nonce = generateRandomString(16)
  const signedToken = await signToken(accessToken, nonce)

  const [error, auth] = await catchError<INTER_KNOT.AuthResponse>(fetcher.post('sso/refresh-token', { json: { token: accessToken, provider: 'gitee', signature: signedToken, nonce } }).json())
  if (error)
    return [error, null]
  return [null, normalizeSSOAuth(auth)]
}

export async function logout(accessToken?: string): Promise<[null, INTER_KNOT.LogoutResponse] | [Error, null]> {
  const [error, data] = await catchError<INTER_KNOT.LogoutResponse>(fetcher.get('sso/logout', {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  }).json())
  if (error)
    return [error, null]
  return [null, data]
}
