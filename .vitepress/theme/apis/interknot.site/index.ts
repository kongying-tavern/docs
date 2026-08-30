import type { BeforeRequestHook, BeforeRetryHook } from 'ky'
import ky, { isHTTPError } from 'ky'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { getAuthSession } from '../auth-session'
import * as oauth from './oauth'
import * as reactions from './reactions'
import * as translate from './translate'
import * as upload from './upload'

/**
 * sso 会话管理接口（刷新/注销）的 context 标记，hooks 据此跳过 SSO token 附加与刷新：
 * 刷新请求等待 SSO 刷新完成会形成单飞自等待死锁；注销自带显式 Bearer，也不应被覆盖。
 */
export const SSO_SESSION_CONTEXT = { ssoSession: true } as const

/** 附加设备指纹与 SSO token（仅浏览器环境） */
const attachIdentity: BeforeRequestHook = async ({ request, options }) => {
  if (import.meta.env.SSR)
    return

  const userInfo = useUserInfoStore()
  const session = getAuthSession()

  if (!userInfo.fingerprint)
    await userInfo.refreshFingerprint()

  const visitorId = userInfo.fingerprint?.visitorId
  if (visitorId)
    request.headers.set('Fingerprint', visitorId)

  if (options.context.ssoSession)
    return

  // SSO 已过期但主 token 有效时先完成刷新（内部单飞），让首个请求就携带新 token
  if (session?.isTokenValid() && !session.isInterKnotTokenValid())
    await session.refreshSSOAuth().catch(() => {})

  if (session?.isInterKnotTokenValid() && session.getInterKnotAccessToken())
    request.headers.set('Authorization', `Bearer ${session.getInterKnotAccessToken()}`)
}

/** 401 时刷新 SSO token，并让本次重试携带新 token */
const refreshSSOTokenOnUnauthorized: BeforeRetryHook = async ({ request, options, error }) => {
  if (import.meta.env.SSR)
    return

  if (!isHTTPError(error) || error.response.status !== 401)
    return

  if (options.context.ssoSession)
    return

  const session = getAuthSession()
  if (!session?.isTokenValid() || session.isInterKnotTokenValid())
    return

  await session.refreshSSOAuth()

  const accessToken = session.getInterKnotAccessToken()
  if (!accessToken)
    return

  const headers = new Headers(request.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  return new Request(request, { headers })
}

export const fetcher = ky.create({
  prefix: 'https://hub.interknot.site/api',
  timeout: 10000,
  retry: {
    limit: 2,
    // ky 默认 methods 不含 post、statusCodes 不含 401，SSO 过期刷新依赖重试机制，需显式补上
    methods: ['get', 'put', 'head', 'delete', 'options', 'trace', 'post'],
    statusCodes: [401, 408, 413, 429, 500, 502, 503, 504],
  },
  hooks: {
    beforeRequest: [attachIdentity],
    beforeRetry: [refreshSSOTokenOnUnauthorized],
  },
})

export { oauth, reactions, translate, upload }
