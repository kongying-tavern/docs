import type { AuthResult } from '../../../utils/auth-errors'
import type ForumAPI from '../api'

import { createAuthError } from '../../../utils/auth-errors'
import { catchError } from '../../utils'
import { oauthFetcher } from './client'
import { GITEE_API_CONFIG } from './config'
import { normalizeAuth } from './utils'

const LAST_OAUTH_REDIRECT_URL_KEY = 'oauth-redirect-url'

export function getRedirectUrl(localeIndex?: string): string {
  // Generate URL based on current locale
  const localeStr = localeIndex === 'root' ? '/' : `/${localeIndex}/`
  const expectedUrl = import.meta.env.DEV
    ? `${location.protocol}//${location.host}${localeStr}callback`
    : `https://yuanshen.site/docs${localeStr}callback`

  // Check if cached URL matches current locale, if not regenerate
  const lastRedirectUrl = localStorage.getItem(LAST_OAUTH_REDIRECT_URL_KEY)
  if (lastRedirectUrl && lastRedirectUrl === expectedUrl) {
    return lastRedirectUrl
  }

  // Store new URL for current locale
  localStorage.setItem(LAST_OAUTH_REDIRECT_URL_KEY, expectedUrl)
  return expectedUrl
}

/** 请求 oauth/token 端点；client_secret 通过 JSON body 传递 */
function requestToken(searchParams: Record<string, string>): Promise<GITEE.Auth> {
  return oauthFetcher
    .post('oauth/token', {
      searchParams,
      json: {
        client_secret: GITEE_API_CONFIG.CLIENT_SECRET,
      },
    })
    .json<GITEE.Auth>()
}

export async function getToken(
  code: string,
  localeIndex?: string,
): Promise<AuthResult<ForumAPI.Auth>> {
  const [error, data] = await catchError(
    requestToken({
      code,
      grant_type: 'authorization_code',
      client_id: GITEE_API_CONFIG.CLIENT_ID,
      redirect_uri: getRedirectUrl(localeIndex),
    }),
  )

  if (error) {
    return {
      success: false,
      error: createAuthError.oauthExchangeFailed(error),
    }
  }

  return {
    success: true,
    data: normalizeAuth(data),
  }
}

export async function refreshToken(
  refreshToken: string,
  localeIndex?: string,
): Promise<AuthResult<ForumAPI.Auth>> {
  const [error, data] = await catchError(
    requestToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: GITEE_API_CONFIG.CLIENT_ID,
      redirect_uri: getRedirectUrl(localeIndex),
    }),
  )

  if (error) {
    return {
      success: false,
      error: createAuthError.tokenRefreshFailed(error),
    }
  }

  return {
    success: true,
    data: normalizeAuth(data),
  }
}

export function redirectAuth(localeIndex: string) {
  // 获取redirect_uri，但不立即清除，callback时才清除
  const redirectUri = getRedirectUrl(localeIndex)
  return (location.href = `${GITEE_API_CONFIG.BASE_URL}/oauth/authorize?client_id=${GITEE_API_CONFIG.CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`)
}
