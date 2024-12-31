import { computed, onBeforeUnmount, ref } from 'vue'

interface UseHashCheckerOptions {
  immediate?: boolean
  redirectHash?: string | null
  clearHash?: boolean
}

export const useHashChecker = (
  targetHash: string,
  callback?: () => boolean | void,
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

  const currentHash = computed(() => window.location.hash.slice(1))
  const isMatch = ref(false)
  const callbackState = ref(false)

  const checkHash = () => {
    if (currentHash.value !== targetHash) return (isMatch.value = false)

    isMatch.value = true

    if (clearHash)
      history.replaceState(null, '', window.location.href.split('#')[0])
    if (callback) callbackState.value = Boolean(callback())
    if ((callback === undefined || callbackState.value) && redirectHash)
      location.hash = redirectHash
  }

  const handleHashChangeEvent = () => {
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
