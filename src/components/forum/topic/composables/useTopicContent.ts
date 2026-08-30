import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useForumViewMode } from '~/composables/useForumViewMode'
import { useTextCollapse } from '~/composables/useTextCollapse'

export function useTopicContent(topic: ForumAPI.Topic | ForumAPI.Post) {
  const { isCardMode, isCompactMode } = useForumViewMode()

  const renderedText = computed(() => topic.content.text)
  const isPost = computed(() => topic.type === 'POST')
  const isAnn = computed(() => topic.type === 'ANN')

  const { isExpanded, hasOverflow, collapseText, toggleExpand } = useTextCollapse(renderedText)

  const shouldShowTitle = computed(() => {
    if (isCompactMode.value)
      return false
    return topic.type !== 'BUG'
  })

  const displayTitle = computed(() => {
    if (isCompactMode.value) {
      return topic.type === 'BUG'
        ? renderedText.value
        : (topic.title.length < 10 ? renderedText.value : topic.title)
    }
    return topic.title
  })

  const displayContent = computed(() => {
    if (topic.type === 'BUG')
      return renderedText.value
    return isAnn.value ? renderedText.value : collapseText.value
  })

  return {
    renderedText,
    isPost,
    isAnn,
    isCardMode,
    isCompactMode,

    isExpanded,
    hasOverflow,
    toggleExpand,

    shouldShowTitle,
    displayTitle,
    displayContent,
  }
}
