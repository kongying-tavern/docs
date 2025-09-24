import { computed, ref } from 'vue'

export interface CreatorManagerConfig {
  pageType: 'home' | 'user' | 'topic'
  staticCreator?: string | null
  dynamicProvider?: () => string | null
}

export function useCreatorManager(config: CreatorManagerConfig) {
  // For home page: no creator management needed
  if (config.pageType === 'home') {
    return {
      creator: null,
      getCurrentCreator: () => null,
      setCreator: () => {},
      clearCreator: () => {},
    }
  }

  // For user pages: manage creator state
  const creatorRef = ref<string | null>(config.staticCreator || null)

  const getCurrentCreator = (): string | null => {
    if (config.dynamicProvider) {
      return config.dynamicProvider()
    }
    return creatorRef.value
  }

  const setCreator = (creator: string | null): void => {
    if (config.pageType !== 'home') {
      creatorRef.value = creator
    }
  }

  const clearCreator = (): void => {
    if (config.pageType !== 'home') {
      creatorRef.value = null
    }
  }

  // Computed creator for reactive access
  const currentCreator = computed(() => getCurrentCreator())

  return {
    creator: creatorRef,
    currentCreator,
    getCurrentCreator,
    setCreator,
    clearCreator,
  }
}

export type CreatorManager = ReturnType<typeof useCreatorManager>
