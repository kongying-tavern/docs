import type { AfterResponseHook, BeforeRequestHook, BeforeRetryHook } from 'ky'
import ky, { isHTTPError } from 'ky'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { getAuthSession } from '~/services/authSession'
import { reportRequestFailure } from '~/services/telemetry/request'
import * as oauth from './oauth'
import * as reactions from './reactions'
import * as upload from './upload'
import { isAccessTokenRejectionStatus } from './utils'

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

/**
 * 本地过期账本可能落后于服务端实际状态（hub 重启、会话被顶掉、时钟偏差等），
 * 此时请求会携带一个“本地认为有效、服务端已判死”的 token。hub 对这种错误返回 HTTP 500
 * 而非 401（body 为 { statusCode: 500, message/statusMessage: "Expired user access token" }），
 * 旧逻辑只认 401，导致死 token 反复原样重试、永远不刷新。这里把服务端判定当作权威：
 * 401 或该 500 包裹错误都视为“随请求携带的 SSO token 已失效”。
 *
 * 判定统一走 isAccessTokenRejectionStatus(status, parsedBody)：ky v2 在抛出 HTTPError
 * 前已把响应体预解析进 error.data 并消费掉原始流（见 gitee/client.ts 的注释），
 * 重试钩子里不可再 clone().json() 重读，否则恒定抛 "Body has already been consumed"。
 */

/**
 * 服务端驱动的 SSO 刷新最小间隔：同一失败请求的多段重试在窗口内直接透传，
 * 避免连环重试对 sso/refresh-token 造成重复调用。
 */
const SERVER_SSO_REFRESH_MIN_INTERVAL_MS = 10_000
let lastServerDrivenSSORefreshAt = 0

/**
 * 401 或 hub 的 "Expired user access token"（500）时刷新 SSO token，并让本次重试携带新 token。
 * 不再依赖本地账本判断——本地账本正是可能出错的一方。
 */
const refreshSSOTokenOnRejection: BeforeRetryHook = async ({ request, options, error }) => {
  if (import.meta.env.SSR)
    return

  if (options.context.ssoSession)
    return

  if (!isHTTPError(error) || !isAccessTokenRejectionStatus(error.response.status, error.data))
    return

  const session = getAuthSession()
  // 主 token 失效时无法重取 SSO token，保持原样重试，由上层会话逻辑兜底
  if (!session?.isTokenValid())
    return

  const now = Date.now()
  if (now - lastServerDrivenSSORefreshAt < SERVER_SSO_REFRESH_MIN_INTERVAL_MS)
    return
  lastServerDrivenSSORefreshAt = now

  // 先作废本地记录再重取：即使本次刷新失败，后续请求也不会再携带已被判死的 token
  session.invalidateInterKnotToken()
  await session.refreshSSOAuth().catch(() => {
    // 刷新失败时回退时间戳，让窗口内后续被拒请求仍可立即重试刷新
    lastServerDrivenSSORefreshAt = 0
  })

  const accessToken = session.getInterKnotAccessToken()
  if (!accessToken || !session.isInterKnotTokenValid())
    return

  const headers = new Headers(request.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  return new Request(request, { headers })
}

/**
 * 无重试（retry: 0）的请求同样需要服务端反馈：被服务端判为 token 过期时作废本地记录，
 * 让下一次请求（含用户重试点击）先重取 token 再发出。
 */
const invalidateExpiredTokenOnResponse: AfterResponseHook = async ({ options, response }) => {
  if (import.meta.env.SSR)
    return

  if (options.context.ssoSession)
    return

  if (response.status !== 401 && response.status !== 500)
    return

  // afterResponse 阶段响应体尚未被 ky 消费，clone() 重读是安全的
  const parsedBody = await response.clone().json().catch(() => undefined)
  if (!isAccessTokenRejectionStatus(response.status, parsedBody))
    return

  getAuthSession()?.invalidateInterKnotToken()
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
    beforeRetry: [refreshSSOTokenOnRejection],
    beforeError: [(state) => {
      // ky 在重试流程最终失败后只触发一次 beforeError。
      if (!import.meta.env.SSR)
        reportRequestFailure(state.error)
      return state.error
    }],
    afterResponse: [invalidateExpiredTokenOnResponse],
  },
})

export { oauth, reactions, upload }
