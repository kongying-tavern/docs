import { useDebounce } from '@vueuse/core'
import { nextTick, onMounted, ref, watch } from 'vue'

export const useSearchInput = () => {
  const searchInput = ref()
  const searchQuery = ref<string>('')
  const searchQueryDebounced = useDebounce<string>(
    searchQuery,
    getDefaultThrottle(),
  )

  watch(searchQueryDebounced, (searchString) => {
    const newUrl = new URL(window.location.href)

    if (searchString === '') {
      newUrl.searchParams.delete('q')
    } else {
      newUrl.searchParams.set('q', searchString)
    }

    nextTick(() => window.history.replaceState({}, '', newUrl))
  })

  onMounted(() => {
    const searchParams = new URLSearchParams(window.location.search)

    if (searchParams.has('q')) searchQuery.value = searchParams.get('q') || ''
    if (searchParams.has('focus')) searchInput.value.focus()
  })

  return {
    searchInput,
    searchQuery,
    searchQueryDebounced,
  }
}

export function getDefaultThrottle() {
  if (typeof window === 'undefined') return 50
  // https://stackoverflow.com/questions/7944460/detect-safari-browser
  // @ts-expect-error
  const isSafari = Boolean(window.GestureEvent)
  if (!isSafari) {
    return 50
  }
  try {
    const match = navigator.userAgent?.match(/version\/([\d\.]+) safari/i)
    return parseFloat(match![1]!) >= 17 ? 120 : 320
  } catch {
    return 320
  }
}
