import type { Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import { GiteeAPIError } from '~/services/forum/gitee'
import { toast } from '~/services/telemetry/toast'

export function handleError(
  error: Error | undefined,
  message: Ref<CustomConfig>,
  options?: {
    errorMessage: string
  },
) {
  if (error instanceof GiteeAPIError) {
    if (error.isExceededRateLimit()) {
      return toast.error(message.value.forum.loadError, {
        error,
        scene: 'ld',
        description: message.value.forum.exceededRateLimitWarning,
        action: {
          label: message.value.forum.auth.login,
          onClick: () => (location.hash = 'login-alert'),
        },
      })
    }

    if (error.isUnauthorized()) {
      return toast.error(message.value.forum.loadError, {
        error,
        scene: 'ld',
        description: `${message.value.forum.auth.loginTips} (${error.message})`,
        action: {
          label: message.value.forum.auth.login,
          onClick: () => (location.hash = 'login-alert'),
        },
      })
    }
  }

  return toast.error(options?.errorMessage || message.value.forum.loadError, { error, scene: 'ld' })
}
