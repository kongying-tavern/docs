import type { BeforeErrorHook } from 'ky'
import type { ErrorHandler } from './types'
import { GiteeApiErrorType } from './types'
import { parseErrorMessage } from './utils'

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

const handleApiErrors: BeforeErrorHook = async (error) => {
  const { response } = error
  if (!response)
    return error

  const errorText = await parseErrorMessage(response)
  if (!errorText)
    return error

  const [errorType, errorMessage = ''] = errorText.split(':')
  const handler = errorHandlers.find(
    h => h.state.includes(response.status) && errorType.includes(h.match),
  )

  if (handler) {
    error.name = handler.errorName
    error.message = handler.getErrorMessage(errorMessage)
  }

  return error
}

export const beforeErrorHooks: BeforeErrorHook[] = [handleApiErrors]
