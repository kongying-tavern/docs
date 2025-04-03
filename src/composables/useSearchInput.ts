import { useDebounce } from '@vueuse/core'
import { nextTick, onMounted, ref, watch } from 'vue'

export function useSearchInput() {
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
    }
    else {
      newUrl.searchParams.set('q', searchString)
    }

    nextTick(() => window.history.replaceState({}, '', newUrl))
  })

  onMounted(() => {
    if (import.meta.env.SSR)
      return
    const searchParams = new URLSearchParams(window.location.search)

    if (searchParams.has('q')) {
      const query = searchParams.get('q')
      if (query) {
        searchQuery.value = query
      }
    }

    if (searchParams.has('focus'))
      searchInput.value.focus()
  })

  return {
    searchInput,
    searchQuery,
    searchQueryDebounced,
  }
}

export function getDefaultThrottle() {
  if (typeof window === 'undefined')
    return 50
  // https://stackoverflow.com/questions/7944460/detect-safari-browser
  // eslint-disable-next-line ts/ban-ts-comment
  // @ts-expect-error
  const isSafari = Boolean(window.GestureEvent)
  if (!isSafari) {
    return 50
  }
  try {
    const match = navigator.userAgent?.match(/version\/([\d.]+) safari/i)
    return Number.parseFloat(match![1]!) >= 17 ? 120 : 320
  }
  catch {
    return 320
  }
}

export function createEnterEvent() {
  return new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    bubbles: true,
    cancelable: true,
  })
}
