import type { Hooks } from 'ky'
import type ForumAPI from '../api'

export enum GiteeApiErrorType {
  RateLimitExceeded = 'Rate Limit Exceeded',
  MissingPaginationParams = 'Missing Pagination Params',
  Unauthorized = 'Unauthorized',
  ApiError = 'Gitee Api Error',
}

export type HttpMethod = 'get' | 'post' | 'patch' | 'delete' | 'put'

export interface ApiCallParams {
  params?: Record<string, any>
  body?: Record<string, any>
  hooks?: Hooks
  useCache?: boolean
}

export type ApiCallResult<T> = Promise<
  [T, undefined] | [T, ForumAPI.PaginationParams]
>

export interface ErrorHandler {
  match: string
  state: number[]
  errorName: GiteeApiErrorType
  getErrorMessage: (text: string) => string
}
