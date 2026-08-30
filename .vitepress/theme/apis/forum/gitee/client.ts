import type { RequestPayload, SearchParamValue } from './types'
import ky from 'ky'
import { getAuthSession } from '../../auth-session'
import { isNodeEnvironment } from '../../utils'
import { GITEE_API_CONFIG } from './config'

// 错误分类不在 ky hooks 中进行：ky v2 的 HTTPError.data 在抛出时已预解析，
// 由 apiCall（index.ts）捕获后统一走 toGiteeAPIError。
export const fetcher = ky.create({
  prefix: `${GITEE_API_CONFIG.BASE_URL}/api/v5`,
  timeout: 5000,
  retry: 1,
})

/** OAuth 端点（oauth/token 等）不在 api/v5 下，使用独立实例 */
export const oauthFetcher = fetcher.extend({
  prefix: GITEE_API_CONFIG.BASE_URL,
})

interface PreparedRequest {
  /** 键值对数组：数组值已展开为重复 key，undefined 已剔除 */
  searchParams: Array<[string, string | number | boolean]>
  json?: Record<string, unknown>
  body?: FormData
}

/** 附加 access_token（Gitee 风格），并将查询参数归一化为 ky 接受的键值对数组 */
export async function prepareRequest(
  endpoint: string,
  { searchParams = {}, json, body }: RequestPayload,
): Promise<PreparedRequest> {
  const accessToken = await resolveAccessToken(endpoint)

  if (accessToken) {
    if (body)
      body = cloneFormDataWithToken(body, accessToken)
    else if (json)
      json = { ...json, access_token: accessToken }
    else
      searchParams = { ...searchParams, access_token: accessToken }
  }

  return {
    searchParams: toSearchParamsArray(searchParams),
    json,
    body,
  }
}

/** 克隆后注入 token，避免突变调用方持有的 FormData（调用方可能复用或重发） */
function cloneFormDataWithToken(source: FormData, accessToken: string): FormData {
  const cloned = new FormData()
  source.forEach((value, key) => cloned.append(key, value))
  cloned.append('access_token', accessToken)
  return cloned
}

/**
 * 浏览器环境下取当前用户的 access_token；OAuth 接口与 Node（构建期）环境返回 undefined。
 * token 过期时会触发刷新（内部有防重入保护）并等待其完成，刷新错误通过 rejection 传播。
 */
async function resolveAccessToken(endpoint: string): Promise<string | undefined> {
  if (isNodeEnvironment() || endpoint.includes('oauth'))
    return undefined

  const session = getAuthSession()
  if (!session)
    return undefined

  if (!session.isTokenValid() && session.getAccessToken())
    session.refreshToken().catch(() => {})

  await session.waitForTokenReady()

  return session.getAccessToken() ?? undefined
}

function toSearchParamsArray(
  params: Record<string, SearchParamValue>,
): PreparedRequest['searchParams'] {
  return Object.entries(params).flatMap(([key, value]) => {
    if (value === undefined)
      return []
    if (Array.isArray(value))
      return value.map((item): [string, string | number] => [key, item])
    return [[key, value]]
  })
}
