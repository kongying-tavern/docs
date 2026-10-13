import type { KyResponse } from 'ky'
import type { ApiCallOptions, ApiResult, HttpMethod } from './types'
import { reportRequestFailure } from '~/services/telemetry/request'
import { fetcher, prepareRequest } from './client'
import { toGiteeAPIError } from './errors'
import * as gists from './gists'
import * as issues from './issues'
import * as labels from './labels'
import { extractPaginationParams } from './normalize'
import * as oauth from './oauth'
import * as password from './password'
import * as user from './user'

export { GiteeAPIError, isPhoneBindingRequiredError } from './errors'

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
    const mappedError = toGiteeAPIError(error, { method, endpoint })
    reportRequestFailure(mappedError)
    throw mappedError
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

const RESPONSE_CACHE_TTL = 60_000
const RESPONSE_CACHE_LIMIT = 128
const responses = new Map<string, { result: ApiResult<unknown>, expires: number }>()
const pending = new Map<string, { promise: Promise<ApiResult<unknown>>, persist: boolean }>()

function requestKey(method: HttpMethod, endpoint: string, options: RequestOptions): string {
  return JSON.stringify([method, endpoint, stripAccessToken(options)])
}

export function apiCall<T>(
  method: HttpMethod,
  endpoint: string,
  options: ApiCallOptions = {},
): Promise<ApiResult<T>> {
  const { cache = false, ...payload } = options

  // Writes are never deduplicated; query data belongs to Colada, not this transport cache.
  if (method !== 'get')
    return performRequest(method, endpoint, payload)
  const key = requestKey(method, endpoint, payload)
  const stored = responses.get(key)
  if (cache && stored && stored.expires > Date.now()) {
    responses.delete(key)
    responses.set(key, stored)
    return Promise.resolve(stored.result as ApiResult<T>)
  }
  responses.delete(key)
  const running = pending.get(key)
  if (running) {
    running.persist ||= cache
    return running.promise as Promise<ApiResult<T>>
  }
  const entry = { promise: performRequest<unknown>(method, endpoint, payload), persist: cache }
  pending.set(key, entry)
  entry.promise.then((result) => {
    // Clearing/invalidation while a request is pending must not resurrect its cache entry.
    if (pending.get(key) !== entry)
      return
    pending.delete(key)
    if (entry.persist && result.response.ok) {
      for (const [cachedKey, value] of responses) {
        if (value.expires <= Date.now())
          responses.delete(cachedKey)
      }
      responses.set(key, { result, expires: Date.now() + RESPONSE_CACHE_TTL })
      if (responses.size > RESPONSE_CACHE_LIMIT)
        responses.delete(responses.keys().next().value!)
    }
  }, () => {
    if (pending.get(key) === entry)
      pending.delete(key)
  })
  return entry.promise as Promise<ApiResult<T>>
}

export function clearApiCache(): void {
  responses.clear()
  pending.clear()
}

export function deleteApiCache(
  method: HttpMethod,
  endpoint: string,
  options: Omit<ApiCallOptions, 'cache'>,
): void {
  const key = requestKey(method, endpoint, options)
  responses.delete(key)
  pending.delete(key)
}

export { gists, issues, labels, oauth, password, user }
