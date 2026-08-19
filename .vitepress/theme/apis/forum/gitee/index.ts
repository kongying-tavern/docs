import type { KyResponse } from 'ky'
import type { ApiCallOptions, ApiResult, HttpMethod, SearchParamValue } from './types'
import * as blog from './blog'
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

function hasPageParam(
  searchParams?: Record<string, SearchParamValue>,
  json?: Record<string, unknown>,
): boolean {
  return typeof searchParams?.page === 'number' || typeof json?.page === 'number'
}

async function performRequest<T>(
  method: HttpMethod,
  endpoint: string,
  options: Omit<ApiCallOptions, 'cache'>,
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
    pagination: hasPageParam(options.searchParams, json)
      ? extractPaginationParams(response)
      : undefined,
    response,
  }
}

/**
 * 会话级响应缓存：键为请求参数的稳定序列化，缓存进行中的 Promise 与成功结果；
 * 失败的请求会被移除，避免缓存住错误响应。
 */
const responseCache = new Map<string, Promise<ApiResult<unknown>>>()

function buildCacheKey(
  method: HttpMethod,
  endpoint: string,
  options: Omit<ApiCallOptions, 'cache'>,
): string {
  return JSON.stringify({
    method,
    endpoint,
    searchParams: options.searchParams,
    json: options.json,
    throwHttpErrors: options.throwHttpErrors,
  })
}

export async function apiCall<T>(
  method: HttpMethod,
  endpoint: string,
  options: ApiCallOptions = {},
): Promise<ApiResult<T>> {
  const { cache = false, ...requestOptions } = options

  if (!cache)
    return performRequest<T>(method, endpoint, requestOptions)

  const key = buildCacheKey(method, endpoint, requestOptions)
  let pending = responseCache.get(key)

  if (!pending) {
    pending = performRequest(method, endpoint, requestOptions)
    responseCache.set(key, pending)
    pending.catch(() => responseCache.delete(key))
  }

  return pending as Promise<ApiResult<T>>
}

export function clearApiCache(): void {
  responseCache.clear()
}

export function deleteApiCache(
  method: HttpMethod,
  endpoint: string,
  options: Omit<ApiCallOptions, 'cache'>,
): boolean {
  return responseCache.delete(buildCacheKey(method, endpoint, options))
}

export { blog, issues, labels, oauth, password, user }
