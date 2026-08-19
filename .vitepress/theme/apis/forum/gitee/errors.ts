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

/** ky v2 的 HTTPError.data 是预解析的响应体：JSON 响应为对象，其余为文本 */
function extractErrorMessage(data: unknown): string | null {
  if (typeof data === 'string')
    return data

  if (isPlainObject(data)) {
    const { message } = data as { message?: unknown }
    if (typeof message === 'string')
      return message
  }

  return null
}

/** 按 Gitee 错误响应的特征（状态码 + 错误文本）归类错误类型 */
function classifyHttpError(error: KyHTTPError): ErrorClassification | undefined {
  const errorText = extractErrorMessage(error.data)
  if (!errorText)
    return undefined

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
  const classified = isHTTPError(error) ? classifyHttpError(error) : undefined

  return new GiteeAPIError(classified?.type ?? GiteeApiErrorType.ApiError, {
    cause,
    method: context.method,
    endpoint: context.endpoint,
    state: isHTTPError(error) ? error.response.status : undefined,
    message: classified?.message ?? cause.message,
  })
}
