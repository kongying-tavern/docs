import type { Ref } from 'vue'
import type { CustomConfig } from '~/types/locales'
import { withAuth } from '@/utils/auth-helpers'
import { catchError } from '~/services/apiUtils'
import { toast } from '~/services/telemetry/toast'

type ActionFunction<T extends unknown[], R = unknown> = (...args: T) => Promise<R>

export async function executeWithAuth<T extends unknown[], R>(
  action: ActionFunction<T, R>,
  argument: T,
  errorMsg: string,
  message: Ref<CustomConfig>,
): Promise<R | false> {
  const result = await withAuth.execute(
    async () => {
      const [error, state] = await catchError<R>(action(...argument))

      if (state !== undefined && !error) {
        return state
      }
      else {
        toast.error(errorMsg, { error, scene: 'cd' })
        throw new Error('Operation failed')
      }
    },
    {
      loginMessage: message.value.forum.auth.loginTips,
    },
  )

  return result || false
}
