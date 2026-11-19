import { onMounted, shallowRef } from 'vue'

export function useProjectAgeDays() {
  const days = shallowRef('')
  onMounted(() => {
    days.value = String(Math.floor((Date.now() - Date.UTC(2020, 5, 1)) / 86_400_000))
  })
  return days
}
