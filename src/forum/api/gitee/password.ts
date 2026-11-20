import type ForumAPI from '../types.d.ts'
import { catchError } from '@/src/services/apiUtils.ts'
import { oauthFetcher } from './client.ts'
import { GITEE_API_CONFIG, GITEE_AUTH_SCOPES } from './gitee-config.ts'
import { normalizeAuth } from './normalize.ts'

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
