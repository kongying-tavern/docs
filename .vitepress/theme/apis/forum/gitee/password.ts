import { catchError } from '@/apis/utils'
import { fetcher } from '.'
import { GITEE_API_CONFIG } from './config'
import { normalizeAuth } from './utils'
import type ForumAPI from '../api'

export const getToken = async (
  username: string,
  password: string,
  scope: string[] = ['user_info', 'issues', 'notes'],
): Promise<ForumAPI.Auth> => {
  const [error, data] = await catchError(
    fetcher
      .post<Promise<GITEE.Auth>>('oauth/token', {
        headers: {
          ContentType: 'application/x-www-forum-urlencoded',
        },
        json: {
          grant_type: 'password',
          client_id: GITEE_API_CONFIG.CLIENT_ID,
          client_secret: GITEE_API_CONFIG.CLIENT_SECRET,
          scope: scope.join(','),
          username,
          password,
        },
      })
      .json(),
  )

  if (error) return Promise.reject(`Can not get token: ${error.message}`)

  return normalizeAuth(await data)
}
