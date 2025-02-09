import { computed } from 'vue'
import { useUserInfoStore } from '@/stores/useUserInfo'

export const isAuthor = (id: string | number) => {
  const info = useUserInfoStore()

  return computed(() => String(info.info?.id) === String(id))
}
