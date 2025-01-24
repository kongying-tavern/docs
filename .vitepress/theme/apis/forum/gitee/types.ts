import type { Hooks } from 'ky'
import type ForumAPI from '../api'

export enum GiteeApiErrorType {
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
