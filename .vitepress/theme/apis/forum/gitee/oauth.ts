import { fetcher } from '.'
import { catchError } from '../../utils'
import { GITEE_API_CONFIG } from './config'
import { normalizeAuth } from './utils'

import type ForumAPI from '../api'

export function getRedirectUri() {
  if (window.location.search) return location.origin + '/docs/feeback'
  return location.origin + location.pathname
}

export const getToken = async (code: string): Promise<ForumAPI.Auth> => {
  const [error, data] = await catchError(
    fetcher
      .post<Promise<GITEE.Auth>>('oauth/token', {
        searchParams: {
          code,
          grant_type: 'authorization_code',
          client_id: GITEE_API_CONFIG.CLIENT_ID,
          redirect_uri: getRedirectUri(),
        },
        json: {
          client_secret: GITEE_API_CONFIG.CLIENT_SECRET,
        },
      })
      .json(),
  )

  if (error) return Promise.reject(`Can not get token: ${error.message}`)
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
          client_id: GITEE_API_CONFIG.CLIENT_ID,
          redirect_uri: getRedirectUri(),
        },
        json: {
          client_secret: GITEE_API_CONFIG.CLIENT_SECRET,
        },
      })
      .json(),
  )

  if (error) throw new Error(`Refresh Token fail: ${error.message}`)

  return normalizeAuth(await data)
}

export const redirectAuth = () =>
  (location.href = `https://gitee.com/oauth/authorize?client_id=${GITEE_API_CONFIG.CLIENT_ID}&redirect_uri=${getRedirectUri()}&response_type=code`)
