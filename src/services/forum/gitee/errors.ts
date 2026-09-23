import type { HTTPError as KyHTTPError } from 'ky'
import type { HttpMethod } from './types'
import { isHTTPError } from 'ky'
import { isPlainObject } from 'lodash-es'
import { GiteeApiErrorType } from './types'

export class GiteeAPIError extends Error {
  type?: GiteeApiErrorType
  endpoint?: string
  method?: HttpMethod
  state?: number
  date: number

  constructor(
    type: GiteeApiErrorType,
    options?: {
      cause?: unknown
      endpoint?: string
      method?: HttpMethod
      state?: number
      message?: string
    },
  ) {
    super(options?.message || 'An error occurred', { cause: options?.cause })
    this.name = 'GiteeAPIError'
    this.type = type
    this.state = options?.state
    this.method = options?.method
    this.endpoint = options?.endpoint
    this.date = Date.now()
  }

  isExceededRateLimit(): boolean {
    return this.type === GiteeApiErrorType.RateLimitExceeded
  }

  isUnauthorized(): boolean {
    return this.type === GiteeApiErrorType.Unauthorized
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      type: this.type,
      endpoint: this.endpoint,
      method: this.method,
      date: new Date(this.date).toISOString(),
      cause: this.cause,
      message: this.message,
      stack: this.stack,
    }
  }
}

interface ErrorClassification {
  type: GiteeApiErrorType
  message: string
}

interface ErrorClassifier {
  /** 匹配错误文本 `:` 前的部分 */
  match: string
  /** 匹配的 HTTP 状态码 */
  status: number[]
  type: GiteeApiErrorType
  getMessage: (text: string) => string
}

const errorClassifiers: ErrorClassifier[] = [
  {
    match: 'Rate Limit Exceeded',
    status: [401, 403],
    type: GiteeApiErrorType.RateLimitExceeded,
    getMessage: () => 'Rate limit exceeded',
  },
  {
    match: '401 Unauthorized',
    status: [401],
    type: GiteeApiErrorType.Unauthorized,
    getMessage: (text: string) => text.trim(),
  },
]

/**
 * 错误体按常见规范逐级归一化为文本数组（顺序即优先级）：
 * 文本体 → { message }（GitHub/Gitee）→ { detail }/{ title }（RFC 9457）
 * → { errors } 数组（JSON:API）→ { errors } 字段映射（ASP.NET）
 * → Rails 字段错误映射（base 数组/数字键等变体，Gitee 校验失败时漏出）。
 */
export function extractErrorMessages(data: unknown): string[] {
  if (typeof data === 'string')
    return data.trim() ? [data.trim()] : []

  if (!isPlainObject(data))
    return []

  const record = data as Record<string, unknown>
  for (const key of ['message', 'detail', 'title']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim())
      return [value.trim()]
  }

  if (Array.isArray(record.errors))
    return record.errors.flatMap(item => extractErrorMessages(item))

  if (isPlainObject(record.errors))
    return flattenFieldMessages(record.errors as Record<string, unknown>)

  if (isFieldErrorMap(record))
    return flattenFieldMessages(record)

  return []
}

/** 全部值为字符串或字符串数组（Rails 错误映射的序列化特征） */
function isFieldErrorMap(record: Record<string, unknown>): boolean {
  const keys = Object.keys(record)
  return keys.length > 0 && keys.every((key) => {
    const value = record[key]
    return typeof value === 'string'
      || (Array.isArray(value) && value.every(item => typeof item === 'string'))
  })
}

/** 错误映射按 base（记录级错误）优先、其余按出现顺序展开为文本数组 */
function flattenFieldMessages(record: Record<string, unknown>): string[] {
  const keys = Object.keys(record)
  const ordered = keys.includes('base') ? ['base', ...keys.filter(key => key !== 'base')] : keys
  const messages: string[] = []
  for (const key of ordered) {
    const value = record[key]
    if (typeof value === 'string') {
      if (value.trim())
        messages.push(value.trim())
    }
    else if (Array.isArray(value)) {
      messages.push(...value
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(Boolean))
    }
  }
  return messages
}

/** 真实 IssueInfo 必然携带的资源身份键：命中即视为"已成功创建"而非错误体 */
const RESOURCE_IDENTITY_KEYS: readonly string[] = [
  'number',
  'id',
  'state',
  'html_url',
  'user',
  'assignee',
  'labels',
  'comments',
  'created_at',
  'updated_at',
  'finished_at',
]

/**
 * 2xx 侧"纯错误体"判定：非空、无资源身份键、且为 errors 包装或全字符串/字符串数组映射。
 * 空对象与缺字段但携身份键的成功 issue（Gitee 畸形 2xx 响应）不会误判为失败。
 */
export function isErrorsOnlyPayload(data: unknown): data is Record<string, unknown> {
  if (!isPlainObject(data))
    return false

  const record = data as Record<string, unknown>
  const keys = Object.keys(record)
  if (keys.length === 0 || keys.some(key => RESOURCE_IDENTITY_KEYS.includes(key)))
    return false

  if ('errors' in record)
    return Array.isArray(record.errors) || isPlainObject(record.errors)

  return isFieldErrorMap(record)
}

/** ky v2 的 HTTPError.data 是预解析的响应体：JSON 响应为对象，其余为文本 */
function extractErrorMessage(data: unknown): string | null {
  return extractErrorMessages(data)[0] ?? null
}

/** 按 Gitee 错误响应的特征（状态码 + 错误文本）归类错误类型 */
function classifyHttpError(error: KyHTTPError, errorText: string): ErrorClassification | undefined {
  const [errorType, errorMessage = ''] = errorText.split(':')
  const classifier = errorClassifiers.find(
    c => c.status.includes(error.response.status) && errorType.includes(c.match),
  )

  if (!classifier)
    return undefined

  return { type: classifier.type, message: classifier.getMessage(errorMessage) }
}

/**
 * 将请求过程中抛出的任意错误统一包装为 GiteeAPIError：
 * 可识别的 HTTP 错误按特征归类，其余归为 ApiError，原始错误保留在 cause 中。
 */
export function toGiteeAPIError(
  error: unknown,
  context: { method: HttpMethod, endpoint: string },
): GiteeAPIError {
  const cause = error instanceof Error ? error : new Error(String(error))
  const httpError = isHTTPError(error) ? error : undefined
  const rawText = httpError ? extractErrorMessage(httpError.data) : undefined
  const classified = rawText && httpError ? classifyHttpError(httpError, rawText) : undefined

  return new GiteeAPIError(classified?.type ?? GiteeApiErrorType.ApiError, {
    cause,
    method: context.method,
    endpoint: context.endpoint,
    state: httpError?.response.status,
    message: classified?.message ?? rawText ?? cause.message,
  })
}

/** Gitee 未绑定手机号时创建 issue 的报错原文（固定中文，与界面语言无关） */
const PHONE_BINDING_MESSAGE_PATTERN = /绑定手机号/

export function isPhoneBindingRequiredError(error: unknown): boolean {
  return error instanceof GiteeAPIError
    && PHONE_BINDING_MESSAGE_PATTERN.test(error.message)
}
