import { useMemoize } from '@vueuse/core'
import ky, { type KyResponse, type Hooks } from 'ky'
import { catchError, getHeader, isNodeEnvironment } from '../../utils'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { GITEE_API_CONFIG } from './config'

import * as blog from './blog'
import * as issues from './issues'
import * as labels from './labels'
import * as oauth from './oauth'
import * as user from './user'
import type ForumAPI from '../api'
import { isPlainObject } from 'lodash-es'

class HTTPError extends Error {}

export const fetcher = ky.create({
  prefixUrl: GITEE_API_CONFIG.PREFIX_URL,
  timeout: 5000,
  retry: 1,
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error
        const rateLimitRemaining = Number(
          response.headers.get('x-ratelimit-remaining'),
        )
        const rateLimitLimit = Number(response.headers.get('x-ratelimit-limit'))

        if (rateLimitRemaining === 0) {
          error.name = ApiErrorType.RateLimitExceeded
          error.message = `Rate limit exceeded. Limit: ${rateLimitLimit}, Remaining: ${rateLimitRemaining}`
          return error
        }

        if (response && response.body) {
          error.message = `${await response.text()}`
          error.name = `[GITEE_API_ERROR] - ${response.status}`
        }
        return error
      },
    ],
  },
})

export enum ApiErrorType {
  RateLimitExceeded = 'Rate Limit Exceeded',
  MissingPaginationParams = 'Missing Pagination Params',
  ApiError = 'Gitee Api Error',
}

export type HttpMethod = 'get' | 'post' | 'patch' | 'delete'

export type ApiCallParams = {
  params?: Record<string, any>
  body?: Record<string, any>
  hooks?: Hooks
  useCache?: boolean
}

export type ApiCallResult<T> = Promise<
  [T, undefined] | [T, ForumAPI.PaginationParams]
>

const extractPagination = (
  params?: Record<string, any>,
  body?: Record<string, any>,
): number | null => {
  return (params ? params['page'] : body?.['page']) ?? null
}

const getGiteeApiPaginationParams = (
  response: KyResponse,
): [ForumAPI.PaginationParams, undefined] | [undefined, Error] => {
  const [pagination, error] = getHeader(response, ['Total_count', 'Total_page'])

  if (error) {
    return [
      undefined,
      new HTTPError(
        `${ApiErrorType.MissingPaginationParams}: ${error.message}`,
      ),
    ]
  }

  return [
    {
      total: Number(pagination[0]),
      totalPage: Number(pagination[1]),
    },
    undefined,
  ]
}

const cachedApiCall = useMemoize(
  async <T>(
    method: HttpMethod,
    endpoint: string,
    { params = {}, body, hooks }: ApiCallParams,
  ): ApiCallResult<T> => {
    if (!isNodeEnvironment() && !endpoint.includes('oauth')) {
      const { auth } = useUserAuthStore()

      const accessToken = auth.accessToken

      if (accessToken) {
        if (body) {
          if (body instanceof FormData) body.append('access_token', accessToken)
          else if (isPlainObject(body)) body.access_token = accessToken
          else params.access_token = accessToken
        } else {
          params.access_token = accessToken
        }
      }
    }

    const url = `api/v5/${endpoint}`

    const options = {
      searchParams: params,
      hooks,
      ...(body && (body instanceof FormData ? { body } : { json: body })),
    }

    const [error, response] = await catchError(
      fetcher[method]<Promise<T>>(url, options),
    )

    if (error) {
      return Promise.reject(
        new HTTPError(`${ApiErrorType.ApiError} at ${url}: ${error.message}`),
      )
    }

    //  如果参数包含 page，说明是分页请求，从请求头提取并中返回分页信息
    if (extractPagination(params, body) !== null) {
      const [paginationParams, error] = getGiteeApiPaginationParams(response)

      if (error) return Promise.reject(error)

      return [await response.json(), paginationParams]
    }

    if (method === 'delete') {
      return [{} as T, undefined]
    }

    return [await response.json(), undefined]
  },
  {
    getKey: (
      method: HttpMethod,
      endpoint: string,
      { params, body }: ApiCallParams,
    ) => JSON.stringify({ method, endpoint, params, body }),
  },
)

/**
 * 通用 API 调用函数，支持可选缓存。
 * @param method 请求方法。
 * @param endpoint 请求路径。
 * @param options 请求参数，包括 params、body 和 useCache。
 */
const apiCall = async <T>(
  method: HttpMethod,
  endpoint: string,
  options: ApiCallParams = {},
): ApiCallResult<T> => {
  const { useCache = true, ...rest } = options

  return useCache
    ? (cachedApiCall(method, endpoint, rest) as ApiCallResult<T>)
    : (cachedApiCall.load(method, endpoint, rest) as ApiCallResult<T>)
}

/**
 * 清空所有缓存。
 */
const clearApiCache = () => cachedApiCall.clear()

/**
 * 删除特定请求的缓存。
 * @param method 请求方法。
 * @param endpoint 请求路径。
 * @param options 请求参数，包括 params 和 body。
 */
const deleteApiCache = (
  method: HttpMethod,
  endpoint: string,
  options: Omit<ApiCallParams, 'useCache'>,
) => cachedApiCall.delete(method, endpoint, options)

export {
  oauth,
  user,
  blog,
  issues,
  apiCall,
  labels,
  clearApiCache,
  deleteApiCache,
}
