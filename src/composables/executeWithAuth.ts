import type { Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import { toast } from 'vue-sonner'
import { catchError } from '@/apis/utils'
import { withAuth } from '@/utils/auth-helpers'

type ActionFunction<T extends unknown[], R = unknown> = (...args: T) => Promise<R>

export async function executeWithAuth<T extends unknown[], R>(
  action: ActionFunction<T, R>,
  argument: T,
  successMsg: string,
  errorMsg: string,
  message: Ref<CustomConfig>,
): Promise<R | false> {
  const result = await withAuth.execute(
    async () => {
      const [error, state] = await catchError<R>(action(...argument))

      if (state !== undefined && !error) {
        toast.success(successMsg)
        return state
      }
      else {
        toast.error(errorMsg)
        throw new Error('Operation failed')
      }
    },
    {
      loginMessage: message.value.forum.auth.loginTips,
      errorMessage: errorMsg,
    },
  )

  return result || false
}
