import type { Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import { catchError } from '@/apis/utils'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { toast } from 'vue-sonner'

type ActionFunction<T extends any[]> = (...args: T) => Promise<boolean | any>

export async function executeWithAuth<T extends any[]>(
  action: ActionFunction<T>,
  argument: T,
  successMsg: string,
  errorMsg: string,
  message: Ref<CustomConfig>,
) {
  const userAuth = useUserAuthStore()

  if (!userAuth.isTokenValid) {
    toast.info(message.value.forum.auth.loginTips)
    return false
  }

  const [error, state] = await catchError<T>(action(...argument))

  console.log(error, state)

  if (state && !error) {
    toast.success(successMsg)
  }
  else {
    toast.error(errorMsg)
  }

  return state
}
