import { useUserInfoStore } from '@/stores/useUserInfo'
import { computed } from 'vue'

export function isAuthor(id: string | number) {
  const info = useUserInfoStore()

  return computed(() => String(info.info?.id) === String(id))
}
