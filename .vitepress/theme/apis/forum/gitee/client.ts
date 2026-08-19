import type { SearchParamValue } from './types'
import ky from 'ky'
import { isPlainObject } from 'lodash-es'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { isNodeEnvironment } from '../../utils'
import { GITEE_API_CONFIG } from './config'

/**
 * Gitee API v5 客户端。
 *
 * 错误分类不在 ky hooks 中进行，而是在 `apiCall`（index.ts）捕获错误后
 * 统一通过 `toGiteeAPIError` 处理 —— ky v2 的 `HTTPError.data` 在抛出时
 * 已预解析响应体，无需借助 `beforeError` hook。
 */
export const fetcher = ky.create({
  prefix: `${GITEE_API_CONFIG.BASE_URL}/api/v5`,
  timeout: 5000,
  retry: 1,
})

/** OAuth 端点（oauth/token 等）不在 api/v5 下，使用独立实例 */
export const oauthFetcher = fetcher.extend({
  prefix: GITEE_API_CONFIG.BASE_URL,
})

interface AuthPayload {
  searchParams: Record<string, SearchParamValue>
  json?: Record<string, unknown>
  body?: FormData
}

/**
 * 浏览器环境下为非 OAuth 接口附加当前用户的 access_token
 * （Gitee 风格：放在查询参数或表单字段中，而非 Authorization 头）。
 * 会触发并等待进行中的 token 刷新；Node（构建期）环境下不附加。
 */
async function withAccessToken(endpoint: string, payload: AuthPayload): Promise<AuthPayload> {
  if (isNodeEnvironment() || endpoint.includes('oauth'))
    return payload

  const userAuth = useUserAuthStore()

  // 如果 token 已过期但无刷新进行中，触发刷新
  // refreshToken() 内部有 isTokenRefreshing 防重入保护
  // 错误通过 waitForTokenReady() 的 rejection 传播
  if (!userAuth.isTokenValid && userAuth.auth?.accessToken) {
    userAuth.refreshToken().catch(() => {})
  }

  // 等待进行中的 token 刷新完成
  await userAuth.waitForTokenReady()

  const accessToken = userAuth.auth?.accessToken
  if (!accessToken)
    return payload

  const { searchParams, json, body } = payload

  if (body instanceof FormData) {
    body.append('access_token', accessToken)
    return payload
  }

  if (json && isPlainObject(json))
    return { ...payload, json: { ...json, access_token: accessToken } }

  return { ...payload, searchParams: { ...searchParams, access_token: accessToken } }
}

export interface RequestPayload {
  searchParams?: Record<string, SearchParamValue>
  json?: Record<string, unknown>
  body?: FormData
}

/** 完成鉴权附加，并将查询参数归一化为 ky 接受的键值对数组（支持数组值展开为重复 key） */
export async function prepareRequest(
  endpoint: string,
  { searchParams = {}, json, body }: RequestPayload,
): Promise<{ searchParams: Array<[string, string | number | boolean]>, json?: Record<string, unknown>, body?: FormData }> {
  const authed = await withAccessToken(endpoint, { searchParams, json, body })

  return {
    searchParams: toSearchParamsArray(authed.searchParams),
    json: authed.json,
    body: authed.body,
  }
}

function toSearchParamsArray(
  params: Record<string, SearchParamValue>,
): Array<[string, string | number | boolean]> {
  return Object.entries(params).flatMap(([key, value]) => {
    if (value === undefined)
      return []
    if (Array.isArray(value))
      return value.map((item): [string, string | number] => [key, item])
    return [[key, value]]
  })
}
