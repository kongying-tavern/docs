import type { Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import { catchError } from '@/apis/utils'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { toast } from 'vue-sonner'

type ActionFunction<T extends unknown[], R = unknown> = (...args: T) => Promise<R>

export async function executeWithAuth<T extends unknown[], R>(
  action: ActionFunction<T, R>,
  argument: T,
  successMsg: string,
  errorMsg: string,
  message: Ref<CustomConfig>,
): Promise<R | false> {
  const userAuth = useUserAuthStore()

  if (!userAuth.isTokenValid) {
    toast.info(message.value.forum.auth.loginTips)
    return false
  }

  const [error, state] = await catchError<R>(action(...argument))

  if (state !== undefined && !error) {
    toast.success(successMsg)
    return state
  }
  else {
    toast.error(errorMsg)
    return false
  }
}
