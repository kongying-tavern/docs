import type { BeforeErrorHook } from 'ky'
import type { ErrorHandler } from './types'
import { isHTTPError } from 'ky'
import { GiteeApiErrorType } from './types'
import { extractErrorMessage } from './utils'

const errorHandlers: ErrorHandler[] = [
  {
    match: 'Rate Limit Exceeded',
    state: [401, 403],
    errorName: GiteeApiErrorType.RateLimitExceeded,
    getErrorMessage: () => 'Rate limit exceeded',
  },
  {
    match: '401 Unauthorized',
    state: [401],
    errorName: GiteeApiErrorType.Unauthorized,
    getErrorMessage: (text: string) => text.trim(),
  },
]

const handleApiErrors: BeforeErrorHook = async ({ error }) => {
  // ky v2 fires beforeError for every error type; only HTTP errors carry a
  // parsed body (error.data) and a response to inspect.
  if (!isHTTPError(error))
    return error

  const errorText = extractErrorMessage(error.data)
  if (!errorText)
    return error

  const [errorType, errorMessage = ''] = errorText.split(':')
  const handler = errorHandlers.find(
    h => h.state.includes(error.response.status) && errorType.includes(h.match),
  )

  if (handler) {
    error.message = handler.getErrorMessage(errorMessage)
    // ky v2 types HTTPError.name as the literal 'HTTPError'; the property is
    // still writable at runtime and carries the error type for the wrapper
    // in index.ts, so cast to the base Error to reassign it.
    ;(error as Error).name = handler.errorName
  }

  return error
}

export const beforeErrorHooks: BeforeErrorHook[] = [handleApiErrors]
