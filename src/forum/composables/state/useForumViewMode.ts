import type { MaybeRefOrGetter } from 'vue'
import type { FORUM } from '~/forum/components/types'
import { useLocalStorage } from '@vueuse/core'
import { computed, nextTick, toValue } from 'vue'
import { enableTransitions } from '@/shared'
import { FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from '~/forum/components/shared'

export const FORUM_VIEW_MODES = ['CARD', 'COMPACT'] as const
const DEFAULT_FORUM_VIEW_MODE = 'CARD' as const

/** 显示方式切换时参与几何形变的共享角色：封面图、正文、引用卡、类型徽章 */
const VIEW_CHANGE_ROLES = ['image', 'content', 'quote', 'type'] as const

interface ViewChangeElement {
  element: HTMLElement
  name: string
}

/**
 * 收集视口内话题列表项中参与形变的元素。名称按「角色-话题 id」生成，
 * 保证同屏唯一；离屏条目不命名，由整页交叉淡入淡出兜底。
 */
function findViewChangeElements(): ViewChangeElement[] {
  const items: ViewChangeElement[] = []
  const seen = new Set<string>()
  for (const root of document.querySelectorAll<HTMLElement>('[data-forum-topic]')) {
    if (root.closest('[data-forum-topic]') !== root)
      continue
    const rect = root.getBoundingClientRect()
    if (rect.bottom <= 0 || rect.top >= window.innerHeight)
      continue
    const topicId = root.dataset.forumTopic
    if (!topicId)
      continue
    for (const role of VIEW_CHANGE_ROLES) {
      const element = root.querySelector<HTMLElement>(`[data-forum-shared-topic="${role}"]`)
      if (!element)
        continue
      const name = `forum-view-${role}-${topicId}`
      if (seen.has(name))
        continue
      seen.add(name)
      items.push({ element, name })
    }
  }
  return items
}

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

  /**
   * 切换话题列表显示方式（卡片/紧凑）：视口内的封面图、正文、引用卡带
   * view-transition-name 参与几何形变位移，其余内容交叉淡入淡出；
   * 不支持或开启减弱动态时直接赋值。
   */
  async function setViewMode(value: FORUM.TopicViewMode): Promise<void> {
    if (!FORUM_VIEW_MODES.includes(value) || viewMode.value === value)
      return
    if (typeof document === 'undefined' || !enableTransitions()) {
      viewMode.value = value
      return
    }

    document.documentElement.dataset.forumViewChange = ''
    const sourceElements = findViewChangeElements()
    for (const { element, name } of sourceElements)
      element.style.setProperty('view-transition-name', name)

    const targetElements: HTMLElement[] = []
    const transition = document.startViewTransition(async () => {
      viewMode.value = value
      await nextTick()
      await nextTick()

      for (const { element } of sourceElements)
        element.style.removeProperty('view-transition-name')

      const sourceNames = new Set(sourceElements.map(item => item.name))
      for (const { element, name } of findViewChangeElements()) {
        if (!sourceNames.has(name))
          continue
        element.style.setProperty('view-transition-name', name)
        targetElements.push(element)
      }
    })

    const cleanup = () => {
      for (const { element } of sourceElements)
        element.style.removeProperty('view-transition-name')
      for (const element of targetElements)
        element.style.removeProperty('view-transition-name')
      delete document.documentElement.dataset.forumViewChange
    }
    void transition.finished.then(cleanup, cleanup)
    try {
      await transition.updateCallbackDone
    }
    catch {
      // 更新回调失败时由 finished 分支完成清理
    }
  }

  return {
    viewMode,
    isCardMode,
    isCompactMode,
    getViewModeIcon,
    setViewMode,
  }
}
