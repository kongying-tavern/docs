import { fetcher, GITEE_CLIENT_ID, GITEE_CLIENT_SECRET } from '.'
import { catchError } from '../../utils'
import type ForumAPI from '../api'
import { normalizeAuth } from './utils'

export const getToken = async (code: string): Promise<ForumAPI.Auth> => {
  const [error, data] = await catchError(
    fetcher
      .post<Promise<GITEE.Auth>>('oauth/token', {
        searchParams: {
          code,
          grant_type: 'authorization_code',
          client_id: GITEE_CLIENT_ID,
          redirect_uri: location.origin + location.pathname,
        },
        json: {
          client_secret: GITEE_CLIENT_SECRET,
        },
      })
      .json(),
  )

  history.pushState({}, '', location.href.replace(location.search, ''))

  if (error) throw new Error(`Can not get token: ${error.message}`)
  return normalizeAuth(await data)
}

export const refreshToken = async (
  refreshToken: string,
): Promise<ForumAPI.Auth> => {
  const [error, data] = await catchError(
    fetcher
      .post<Promise<GITEE.Auth>>('oauth/token', {
        searchParams: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: GITEE_CLIENT_ID,
          redirect_uri: location.origin + location.pathname,
        },
        json: {
          client_secret: GITEE_CLIENT_SECRET,
        },
      })
      .json(),
  )

  if (error) throw new Error(`Refresh Token fail: ${error.message}`)

  return normalizeAuth(await data)
}

export const redirectAuth = () =>
  (location.href = `https://gitee.com/oauth/authorize?client_id=${GITEE_CLIENT_ID}&redirect_uri=${location.origin + location.pathname}&response_type=code`)
