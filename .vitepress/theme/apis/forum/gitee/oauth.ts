import type ForumAPI from '../api'
import { fetcher } from '.'

import { catchError } from '../../utils'
import { GITEE_API_CONFIG } from './config'
import { normalizeAuth } from './utils'

const LAST_OAUTH_REDIRECT_URL_KEY = 'oauth-redirect-url'

export function getRedirectUrl(localeIndex?: string): string {
  const lastRedirectUrl = localStorage.getItem(LAST_OAUTH_REDIRECT_URL_KEY)
  if (lastRedirectUrl)
    return lastRedirectUrl

  const localeStr = localeIndex === 'root' ? '/' : `/${localeIndex}/`
  const result = import.meta.env.DEV
    ? `${location.protocol}//${location.host}${localeStr}callback`
    : `https://yuanshen.site/docs${localeStr}callback`
  localStorage.setItem(LAST_OAUTH_REDIRECT_URL_KEY, result)
  return result
}

export async function getToken(
  code: string,
): Promise<[undefined, ForumAPI.Auth] | [Error, undefined]> {
  const [error, data] = await catchError(
    fetcher
      .post<Promise<GITEE.Auth>>('oauth/token', {
        searchParams: {
          code,
          grant_type: 'authorization_code',
          client_id: GITEE_API_CONFIG.CLIENT_ID,
          redirect_uri: getRedirectUrl(),
        },
        json: {
          client_secret: GITEE_API_CONFIG.CLIENT_SECRET,
        },
      })
      .json(),
  )

  if (error)
    return [new Error(`Can not get token: ${error.message}`), undefined]

  return [undefined, normalizeAuth(await data)]
}

export async function refreshToken(
  refreshToken: string,
): Promise<[undefined, ForumAPI.Auth] | [Error, undefined]> {
  const [error, data] = await catchError(
    fetcher
      .post<Promise<GITEE.Auth>>('oauth/token', {
        searchParams: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: GITEE_API_CONFIG.CLIENT_ID,
          redirect_uri: getRedirectUrl(),
        },
        json: {
          client_secret: GITEE_API_CONFIG.CLIENT_SECRET,
        },
      })
      .json(),
  )

  if (error)
    return [new Error(`Refresh Token fail: ${error.message}`), undefined]

  return [undefined, normalizeAuth(await data)]
}

export function redirectAuth(localeIndex: string) {
  localStorage.removeItem(LAST_OAUTH_REDIRECT_URL_KEY)
  return (location.href = `https://gitee.com/oauth/authorize?client_id=${GITEE_API_CONFIG.CLIENT_ID}&redirect_uri=${getRedirectUrl(localeIndex)}&response_type=code`)
}
