import type { HttpMethod } from './types'
import { GiteeApiErrorType } from './types'

export class HTTPError extends Error {
  cause?: unknown
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
    super(type)
    this.type = type
    this.message = options?.message || 'An error occurred'
    this.cause = options?.cause
    this.state = options?.state
    this.method = options?.method
    this.endpoint = options?.endpoint
    this.date = new Date().getTime()

    Object.setPrototypeOf(this, HTTPError.prototype)

    this.name = 'GiteeAPIError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HTTPError)
    }
  }

  isExceededRateLimit(): boolean {
    return this.type === GiteeApiErrorType.RateLimitExceeded
  }

  isMissingPaginationParams(): boolean {
    return this.type === GiteeApiErrorType.MissingPaginationParams
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
