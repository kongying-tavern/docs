import { computed } from 'vue'
import { useUserInfoStore } from '@/stores/useUserInfo'

export function isAuthor(id: string | number) {
  const info = useUserInfoStore()

  return computed(() => String(info.info?.id) === String(id))
}
