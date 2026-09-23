import type { KyResponse } from 'ky'
import type ForumAPI from '../api'

export enum GiteeApiErrorType {
  RateLimitExceeded = 'Rate Limit Exceeded',
  Unauthorized = 'Unauthorized',
  ApiError = 'Gitee Api Error',
}

export type HttpMethod = 'get' | 'post' | 'patch' | 'delete' | 'put'

/**
 * 查询参数值。
 * - 数组会展开为重复 key（如 `labels=A&labels=B`）
 * - `undefined` 会被忽略，便于在调用处直接书写可选参数
 */
export type SearchParamValue = string | number | boolean | Array<string | number> | undefined

export interface RequestPayload {
  searchParams?: Record<string, SearchParamValue>
  /** JSON 请求体；与 `body` 互斥，`body` 优先 */
  json?: Record<string, unknown>
  /** 表单请求体（FormData） */
  body?: FormData
}

export interface ApiCallOptions extends RequestPayload {
  /** 缓存本次请求的响应（会话级；失败响应不会被缓存） */
  cache?: boolean
  /** 透传给 ky；置为 false 时非 2xx 响应不抛错，由调用方检查 `response.status` */
  throwHttpErrors?: boolean
}

export interface ApiResult<T> {
  data: T
  /** 仅当请求携带 `page` 参数时从响应头解析；解析不到则为 undefined */
  pagination?: ForumAPI.PaginationParams
  /** 原始响应，用于读取状态码与响应头 */
  response: KyResponse<T>
}
