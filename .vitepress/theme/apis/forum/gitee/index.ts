import { useMemoize } from '@vueuse/core'
import ky, { type KyResponse } from 'ky'
import type { Hooks } from 'ky'
import { catchError, getHeader } from '../../utils'

import * as blog from './blog'
import * as issues from './issues'
import * as labels from './labels'
import * as oauth from './oauth'
import * as user from './user'
import type ForumAPI from '../api'

class HTTPError extends Error {}

export const PREFIX_URL = 'https://gitee.com/'
export const GITEE_CLIENT_ID =
  '053290d8af24515ea1ba7aa9d19175698eef3be29ada8a6a3156804093a21c4d'
export const GITEE_CLIENT_SECRET =
  '490930078ce5da2580a193af163c275c670567e70a93fbe0ca39e15faa8f5271'
export const GITEE_OWNER = 'KYJGYSDT'
export const GITEE_REPO = 'Feedback'
export const GITEE_BLOG_REPO = 'blog'
export const TOPIC_TYPE = ['BUG', 'FEAT', 'SUG', 'ANN']
export const STATE_TAGS = new Set([
  'WEB-FEEDBACK',
  'GOOD-ISSUE',
  'FEAT',
  'SUG',
  'BUG',
  'ANN',
  'ZH',
  'EN',
  'JA',
])

export const fetcher = ky.create({
  prefixUrl: PREFIX_URL,
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
    { params, body, hooks }: ApiCallParams,
  ): ApiCallResult<T> => {
    const url = `api/v5/${endpoint}`

    const [error, response] = await catchError(
      fetcher[method]<Promise<T>>(url, {
        searchParams: params,
        hooks,
        ...(method === 'post' && { json: body }),
      }),
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
