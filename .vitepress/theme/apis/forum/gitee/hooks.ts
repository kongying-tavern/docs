import type { BeforeErrorHook, BeforeRequestHook } from 'ky'
import { GiteeApiErrorType } from './types'

const handleRateLimitExceeded: BeforeErrorHook = async (error) => {
  const { response } = error
  if (response.status === 403 || response.status === 401) {
    const errorMessage = await response.text()
    if (errorMessage.includes('Rate Limit Exceeded')) {
      error.name = GiteeApiErrorType.RateLimitExceeded
      error.message = `Rate limit exceeded`
      return error
    }
  }

  return error
}

export const beforeErrorHooks: BeforeErrorHook[] = [handleRateLimitExceeded]
