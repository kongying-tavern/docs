import { useUserAuthStore } from '@/stores/useUserAuth'
import { toast } from 'vue-sonner'
import type { CustomConfig } from '../../.vitepress/locales/types'
import type { Ref } from 'vue'
import { catchError } from '@/apis/utils'

type ActionFunction<T extends any[]> = (...args: T) => Promise<boolean | any>

export const executeWithAuth = async <T extends any[]>(
  action: ActionFunction<T>,
  argument: T,
  successMsg: string,
  errorMsg: string,
  message: Ref<CustomConfig>,
) => {
  const userAuth = useUserAuthStore()

  if (!userAuth.isTokenValid) {
    toast.info(message.value.forum.auth.loginTips)
    return false
  }

  const [error, state] = await catchError<T>(action(...argument))

  console.log(error, state)

  if (state && !error) {
    toast.success(successMsg)
  } else {
    toast.error(errorMsg)
  }

  return state
}
