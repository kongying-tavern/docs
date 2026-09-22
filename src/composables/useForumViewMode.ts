import type { MaybeRefOrGetter } from 'vue'
import type { FORUM } from '~/components/forum/types'
import { useLocalStorage } from '@vueuse/core'
import { computed, toValue } from 'vue'
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

/**
 * @param topicType 传入话题类型后，公告（ANN）话题不随视图切换，始终以卡片模式渲染
 */
export function useForumViewMode(topicType?: MaybeRefOrGetter<string | undefined>) {
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

  const isAnnouncement = computed(() => toValue(topicType) === 'ANN')
  const isCardMode = computed(() => isAnnouncement.value || isCardModeValue(viewMode.value))
  const isCompactMode = computed(() => !isAnnouncement.value && isCompactModeValue(viewMode.value))

  const getViewModeIcon = computed(() => getViewModeIconClass(viewMode.value))

  return {
    viewMode,
    isCardMode,
    isCompactMode,
    getViewModeIcon,
  }
}
