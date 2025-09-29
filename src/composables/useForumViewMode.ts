import type { FORUM } from '~/components/forum/types'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from '~/components/forum/shared'

export function useForumViewMode() {
  const VALID_MODES: FORUM.TopicViewMode[] = ['card', 'compact']
  const DEFAULT_MODE: FORUM.TopicViewMode = 'card'

  const rawViewMode = useLocalStorage<FORUM.TopicViewMode>(
    FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY,
    DEFAULT_MODE,
  )

  // 创建带验证的computed属性
  const viewMode = computed({
    get: () => {
      return VALID_MODES.includes(rawViewMode.value) ? rawViewMode.value : DEFAULT_MODE
    },
    set: (value: FORUM.TopicViewMode) => {
      if (VALID_MODES.includes(value)) {
        rawViewMode.value = value
      }
    },
  })

  // 立即修复无效的初始值
  if (!import.meta.env.SSR && !VALID_MODES.includes(rawViewMode.value)) {
    rawViewMode.value = DEFAULT_MODE
  }

  const isCardMode = computed(() => viewMode.value === 'card')
  const isCompactMode = computed(() => viewMode.value === 'compact')

  const toggleViewMode = (): void => {
    const currentIndex = VALID_MODES.indexOf(viewMode.value)
    const nextIndex = (currentIndex + 1) % VALID_MODES.length
    viewMode.value = VALID_MODES[nextIndex]
  }

  const setViewMode = (mode: FORUM.TopicViewMode): void => {
    if (VALID_MODES.includes(mode)) {
      viewMode.value = mode
    }
  }

  const getViewModeLabel = computed(() => {
    return viewMode.value === 'card' ? 'Card' : 'Compact'
  })

  const getViewModeIcon = computed(() => {
    return viewMode.value === 'card' ? 'i-custom-card' : 'i-custom-compact'
  })

  return {
    viewMode,
    isCardMode,
    isCompactMode,
    toggleViewMode,
    setViewMode,
    getViewModeLabel,
    getViewModeIcon,
  }
}

export function useForumViewModeProvider() {
  return useForumViewMode()
}
