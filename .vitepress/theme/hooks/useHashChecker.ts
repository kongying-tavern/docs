import { isArray } from 'lodash-es'
import { computed, onBeforeUnmount, ref } from 'vue'

interface UseHashCheckerOptions {
  immediate?: boolean
  redirectHash?: string | null
  clearHash?: boolean
}

export function useHashChecker(
  targetHash: string | string[],
  callback?: (hash: string) => boolean | void,
  options: UseHashCheckerOptions = {},
) {
  const defaultOptions: UseHashCheckerOptions = {
    immediate: true,
    clearHash: true,
    redirectHash: null,
  }

  const { immediate, redirectHash, clearHash } = {
    ...defaultOptions,
    ...options,
  }

  const currentHash = computed(() => {
    if (import.meta.env.SSR)
      return ''
    return window.location.hash.slice(1)
  })

  const isMatch = ref(false)
  const callbackState = ref(false)
  let matchedHash = null

  const checkHash = () => {
    // 直接读取当前hash，不依赖computed
    const actualCurrentHash = import.meta.env.SSR ? '' : window.location.hash.slice(1)

    if (isArray(targetHash)) {
      isMatch.value = targetHash.includes(actualCurrentHash)
    }
    else {
      isMatch.value = actualCurrentHash === targetHash
    }

    if (!isMatch.value)
      return

    matchedHash = actualCurrentHash

    if (clearHash && !import.meta.env.SSR)
      history.replaceState(null, '', window.location.href.split('#')[0])
    if (callback)
      callbackState.value = Boolean(callback(matchedHash))
    if ((callback === undefined || callbackState.value) && redirectHash)
      location.hash = redirectHash
  }

  const handleHashChangeEvent = () => {
    if (import.meta.env.SSR)
      return

    window.addEventListener('hashchange', checkHash)

    onBeforeUnmount(() => {
      window.removeEventListener('hashchange', checkHash)
    })
  }

  if (immediate) {
    checkHash()

    handleHashChangeEvent()
  }

  return {
    currentHash,
    isMatch,
    handleHashChangeEvent,
    callbackState,
  }
}
