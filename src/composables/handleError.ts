import type { Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import { GiteeAPIError } from '@/apis/forum/gitee'
import { toast } from 'vue-sonner'

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
        description: message.value.forum.exceededRateLimitWarning,
        position: 'bottom-right',
        action: {
          label: message.value.forum.auth.login,
          onClick: () => (location.hash = 'login-alert'),
        },
      })
    }

    if (error.isUnauthorized()) {
      return toast.error(message.value.forum.loadError, {
        description: `${message.value.forum.auth.loginTips} (${error.message})`,
        position: 'bottom-right',
        action: {
          label: message.value.forum.auth.login,
          onClick: () => (location.hash = 'login-alert'),
        },
      })
    }
  }

  return toast.error(options?.errorMessage || message.value.forum.loadError)
}
