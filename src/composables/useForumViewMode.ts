import type { FORUM } from '~/components/forum/types'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from '~/components/forum/shared'

export const FORUM_VIEW_MODES = ['CARD', 'COMPACT'] as const
const DEFAULT_FORUM_VIEW_MODE = 'CARD' as const

function isCardModeValue(mode: FORUM.TopicViewMode): boolean {
  return mode === DEFAULT_FORUM_VIEW_MODE
}

function isCompactModeValue(mode: FORUM.TopicViewMode): boolean {
  return mode === 'COMPACT'
}

// @unocss-include
export function getViewModeIconClass(mode: FORUM.TopicViewMode): string {
  return isCardModeValue(mode) ? 'i-custom-card' : 'i-custom-compact'
}

export function useForumViewMode() {
  const rawViewMode = useLocalStorage<FORUM.TopicViewMode>(
    FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY,
    DEFAULT_FORUM_VIEW_MODE,
    {
      mergeDefaults: true,
    },
  )

  const viewMode = computed({
    get: () => {
      return FORUM_VIEW_MODES.includes(rawViewMode.value) ? rawViewMode.value : DEFAULT_FORUM_VIEW_MODE
    },
    set: (value: FORUM.TopicViewMode) => {
      if (FORUM_VIEW_MODES.includes(value)) {
        rawViewMode.value = value
      }
    },
  })

  if (!import.meta.env.SSR && !FORUM_VIEW_MODES.includes(rawViewMode.value)) {
    rawViewMode.value = DEFAULT_FORUM_VIEW_MODE
  }

  const isCardMode = computed(() => isCardModeValue(viewMode.value))
  const isCompactMode = computed(() => isCompactModeValue(viewMode.value))

  const getViewModeIcon = computed(() => getViewModeIconClass(viewMode.value))

  return {
    viewMode,
    isCardMode,
    isCompactMode,
    getViewModeIcon,
  }
}
