import type { MaybeRefOrGetter } from 'vue'
import type ForumAPI from '~/forum/api/types'
import { computed, toValue } from 'vue'
import { useForumViewMode } from '~/forum/composables/state/useForumViewMode'
import { useTextCollapse } from '~/forum/composables/state/useTextCollapse'

export function useTopicContent(source: MaybeRefOrGetter<ForumAPI.Topic | ForumAPI.Post>) {
  const topic = computed(() => toValue(source))
  const { isCardMode, isCompactMode } = useForumViewMode(() => topic.value.type)

  const renderedText = computed(() => topic.value.content.text)
  const isPost = computed(() => topic.value.type === 'POST')
  const isAnn = computed(() => topic.value.type === 'ANN')

  const { isExpanded, hasOverflow, toggleExpand } = useTextCollapse(renderedText)

  const shouldShowTitle = computed(() => {
    if (isCompactMode.value)
      return false
    return topic.value.type !== 'BUG'
  })

  const displayTitle = computed(() => {
    if (isCompactMode.value) {
      return topic.value.type === 'BUG'
        ? renderedText.value
        : (topic.value.title.length < 10 ? renderedText.value : topic.value.title)
    }
    return topic.value.title
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
  }
}
