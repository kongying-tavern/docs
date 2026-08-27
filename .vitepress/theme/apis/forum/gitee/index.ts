import type { KyResponse } from 'ky'
import type { ApiCallOptions, ApiResult, HttpMethod } from './types'
import { useMemoize } from '@vueuse/core'
import { fetcher, prepareRequest } from './client'
import { toGiteeAPIError } from './errors'
import * as issues from './issues'
import * as labels from './labels'
import * as oauth from './oauth'
import * as password from './password'
import * as user from './user'
import { extractPaginationParams } from './utils'

export { GiteeAPIError } from './errors'

/** DELETE/PUT 接口无响应体，统一返回空对象 */
const EMPTY_DATA = {} as const

async function parseResponseData<T>(
  response: KyResponse<T>,
  method: HttpMethod,
): Promise<T> {
  // DELETE/PUT 接口以及 204、非 2xx（throwHttpErrors: false 时）响应无需解析 body
  if (method === 'delete' || method === 'put' || response.status === 204 || !response.ok)
    return EMPTY_DATA as T

  return response.json<T>()
}

type RequestOptions = Omit<ApiCallOptions, 'cache'>

async function performRequest<T>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions,
): Promise<ApiResult<T>> {
  const { searchParams, json, body } = await prepareRequest(endpoint, options)

  let response: KyResponse<T>
  try {
    response = await fetcher[method]<T>(endpoint, {
      searchParams,
      ...(body ? { body } : json ? { json } : {}),
      throwHttpErrors: options.throwHttpErrors,
    })
  }
  catch (error) {
    throw toGiteeAPIError(error, { method, endpoint })
  }

  return {
    data: await parseResponseData<T>(response, method),
    pagination: typeof options.searchParams?.page === 'number'
      ? extractPaginationParams(response)
      : undefined,
    response,
  }
}

/** 浅拷贝请求选项并剔除显式携带的 access_token，用于生成缓存键 */
function stripAccessToken(options: RequestOptions): RequestOptions {
  const strip = <T extends Record<string, unknown>>(record: T): T => {
    const { access_token: _token, ...rest } = record
    return rest as T
  }
  return {
    ...options,
    ...(options.searchParams ? { searchParams: strip(options.searchParams) } : {}),
    ...(options.json ? { json: strip(options.json) } : {}),
  }
}

/**
 * 会话级响应缓存。useMemoize 缓存的是请求 Promise（含进行中请求的去重）；
 * 注意 `load`（非缓存路径）也会写入缓存 —— 与原实现保持一致。
 * 缓存键剔除 access_token：token 轮换不应产生新缓存项，也避免 token 出现在键中。
 */
const memoizedRequest = useMemoize(performRequest, {
  getKey: (method, endpoint, options: RequestOptions) =>
    JSON.stringify([method, endpoint, stripAccessToken(options)]),
})

export function apiCall<T>(
  method: HttpMethod,
  endpoint: string,
  options: ApiCallOptions = {},
): Promise<ApiResult<T>> {
  const { cache = false, ...payload } = options

  const key = memoizedRequest.generateKey(method, endpoint, payload)
  const result = cache
    ? memoizedRequest(method, endpoint, payload)
    : memoizedRequest.load(method, endpoint, payload)

  // 失败的请求不留缓存，避免后续请求反复命中同一个 rejected Promise
  result.catch(() => memoizedRequest.cache.delete(key))

  return result as Promise<ApiResult<T>>
}

export function clearApiCache(): void {
  memoizedRequest.clear()
}

export function deleteApiCache(
  method: HttpMethod,
  endpoint: string,
  options: Omit<ApiCallOptions, 'cache'>,
): void {
  memoizedRequest.delete(method, endpoint, options)
}

export { issues, labels, oauth, password, user }
