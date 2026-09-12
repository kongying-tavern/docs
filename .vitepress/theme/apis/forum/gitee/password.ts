import type ForumAPI from '../api'
import { catchError } from '@/apis/utils'
import { oauthFetcher } from './client'
import { GITEE_API_CONFIG, GITEE_AUTH_SCOPES } from './config'
import { normalizeAuth } from './utils'

export async function getToken(
  username: string,
  password: string,
  scope: readonly string[] = GITEE_AUTH_SCOPES,
): Promise<[undefined, ForumAPI.Auth] | [Error, undefined]> {
  const [error, data] = await catchError(
    oauthFetcher
      .post('oauth/token', {
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: GITEE_API_CONFIG.CLIENT_ID,
          client_secret: GITEE_API_CONFIG.CLIENT_SECRET,
          scope: scope.join(' '),
          username,
          password,
        }),
      })
      .json<GITEE.Auth>(),
  )

  if (error)
    return [new Error(`Can not get token: ${error.message}`), undefined]

  return [undefined, normalizeAuth(data)]
}
