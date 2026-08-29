import type { AuthResult } from '../../../utils/auth-errors'
import type ForumAPI from '../api'

import { createAuthError } from '../../../utils/auth-errors'
import { catchError } from '../../utils'
import { oauthFetcher } from './client'
import { GITEE_API_CONFIG } from './config'
import { normalizeAuth } from './utils'

const LAST_OAUTH_REDIRECT_URL_KEY = 'oauth-redirect-url'
const OAUTH_STATE_KEY = 'gitee-oauth-state'

/** 生成防 CSRF 的 OAuth state（16 字节随机数 hex），跳转前存入 sessionStorage */
function generateOAuthState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 校验回调携带的 state，校验后立即移除以防重放。
 * 无预期 state（存储被清理、伪造回调）时失败关闭。
 */
export function validateOAuthState(callbackState: string | null): boolean {
  const storedState = sessionStorage.getItem(OAUTH_STATE_KEY)
  sessionStorage.removeItem(OAUTH_STATE_KEY)
  if (!storedState || !callbackState)
    return false
  return storedState === callbackState
}

export function getRedirectUrl(localeIndex?: string): string {
  const localeStr = localeIndex === 'root' ? '/' : `/${localeIndex}/`
  const expectedUrl = import.meta.env.DEV
    ? `${location.protocol}//${location.host}${localeStr}callback`
    : `https://yuanshen.site/docs${localeStr}callback`

  const lastRedirectUrl = localStorage.getItem(LAST_OAUTH_REDIRECT_URL_KEY)
  if (lastRedirectUrl && lastRedirectUrl === expectedUrl) {
    return lastRedirectUrl
  }

  localStorage.setItem(LAST_OAUTH_REDIRECT_URL_KEY, expectedUrl)
  return expectedUrl
}

/** 请求 oauth/token 端点；按 Gitee 文档以 form body 传参（含 client_secret） */
function requestToken(params: Record<string, string>): Promise<GITEE.Auth> {
  const { redirect_uri, ...rest } = params
  // Gitee 对 redirect_uri 按注册值做字面比对，须与授权阶段保持相同的明文（不百分号转义）
  const body = `${new URLSearchParams({
    ...rest,
    client_secret: GITEE_API_CONFIG.CLIENT_SECRET,
  }).toString()}${redirect_uri ? `&redirect_uri=${encodeURI(redirect_uri)}` : ''}`
  return oauthFetcher
    .post('oauth/token', {
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
): Promise<AuthResult<ForumAPI.Auth>> {
  const [error, data] = await catchError(
    requestToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: GITEE_API_CONFIG.CLIENT_ID,
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
  // 存 redirect_uri 供 callback 使用，不在此清除
  const redirectUri = getRedirectUrl(localeIndex)
  const state = generateOAuthState()
  sessionStorage.setItem(OAUTH_STATE_KEY, state)

  const searchParams = new URLSearchParams({
    client_id: GITEE_API_CONFIG.CLIENT_ID,
    response_type: 'code',
    state,
  })
  // Gitee 按注册值对 redirect_uri 做字面比对，URLSearchParams 的百分号转义会使其无法识别，保持明文
  return (location.href = `${GITEE_API_CONFIG.BASE_URL}/oauth/authorize?${searchParams.toString()}&redirect_uri=${encodeURI(redirectUri)}`)
}
