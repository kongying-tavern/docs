import type { FORUM } from '~/components/forum/types'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from '~/components/forum/shared'

// 导出常量供外部使用
export const FORUM_VIEW_MODES = ['CARD', 'COMPACT'] as const
export const DEFAULT_FORUM_VIEW_MODE = 'CARD' as const
export const COMPACT_MODE = 'COMPACT' as const

export function isCardModeValue(mode: FORUM.TopicViewMode): boolean {
  return mode === DEFAULT_FORUM_VIEW_MODE
}

export function isCompactModeValue(mode: FORUM.TopicViewMode): boolean {
  return mode === COMPACT_MODE
}

export function getViewModeIconClass(mode: FORUM.TopicViewMode): string {
  return isCardModeValue(mode) ? 'i-custom-card' : 'i-custom-compact'
}

export function getViewModeDisplayLabel(mode: FORUM.TopicViewMode): string {
  return isCardModeValue(mode) ? 'Card' : 'Compact'
}

export function useForumViewMode() {
  const VALID_MODES = FORUM_VIEW_MODES
  const DEFAULT_MODE = DEFAULT_FORUM_VIEW_MODE

  const rawViewMode = useLocalStorage<FORUM.TopicViewMode>(
    FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY,
    DEFAULT_MODE,
    {
      mergeDefaults: true,
    },
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

  const isCardMode = computed(() => isCardModeValue(viewMode.value))
  const isCompactMode = computed(() => isCompactModeValue(viewMode.value))

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

  const getViewModeLabel = computed(() => viewMode.value)

  const getViewModeIcon = computed(() => getViewModeIconClass(viewMode.value))

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
