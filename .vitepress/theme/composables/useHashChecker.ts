import { ref, onBeforeUnmount } from 'vue'

interface UseHashCheckerOptions {
  immediate?: boolean
  redirectHash?: string | null
  clearHash?: boolean
}

export const useHashChecker = (
  targetHash: string,
  callback?: () => Boolean | void,
  options: UseHashCheckerOptions = {},
) => {
  const defaultOptions: UseHashCheckerOptions = {
    immediate: true,
    clearHash: true,
    redirectHash: null,
  }

  const { immediate, redirectHash, clearHash } = {
    ...defaultOptions,
    ...options,
  }

  const currentHash = ref<string>(window.location.hash.slice(1))
  const isMatch = ref(false)
  const callbackState = ref(false)

  const updateHash = () => {
    currentHash.value = window.location.hash.slice(1)
    checkHash()
  }

  const checkHash = () => {
    if (currentHash.value !== targetHash) return (isMatch.value = false)

    isMatch.value = true

    if (clearHash)
      history.replaceState(null, '', window.location.href.split('#')[0])
    if (callback) callbackState.value = Boolean(callback())
    if (callbackState.value && redirectHash) location.hash = redirectHash
    if (callback === undefined && redirectHash) location.hash = redirectHash
  }

  const handleHashChangeEvent = () => {
    window.addEventListener('hashchange', updateHash)

    onBeforeUnmount(() => {
      window.removeEventListener('hashchange', updateHash)
    })
  }

  if (immediate) {
    checkHash()

    window.addEventListener('hashchange', updateHash)

    onBeforeUnmount(() => {
      window.removeEventListener('hashchange', updateHash)
    })
  }

  return {
    currentHash,
    isMatch,
    handleHashChangeEvent,
    callbackState,
  }
}
