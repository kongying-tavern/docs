import type { MaybeRefOrGetter } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from '~/components/forum/types'
import { computed, toValue } from 'vue'
import { sanitizeMarkdown } from '~/composables/sanitizeMarkdown'
import { useTextCollapse } from '~/composables/useTextCollapse'

export interface UseTopicContentOptions {
  topic: ForumAPI.Topic | ForumAPI.Post
  viewMode: MaybeRefOrGetter<FORUM.TopicViewMode>
}

export function useTopicContent(options: UseTopicContentOptions) {
  const { topic } = options

  // Computed properties
  const renderedText = computed(() => sanitizeMarkdown(topic.content.text))
  const isPost = computed(() => topic.type === 'POST')
  const isAnn = computed(() => topic.type === 'ANN')
  const isCardMode = computed(() => toValue(options.viewMode) === 'Card')
  const isCompactMode = computed(() => toValue(options.viewMode) === 'Compact')

  // Text collapse functionality
  const { isExpanded, hasOverflow, collapseText, toggleExpand } = useTextCollapse(renderedText)

  // Display logic
  const shouldShowTitle = computed(() => {
    if (isCompactMode.value) {
      // In compact mode, never show title (only content)
      return false
    }
    // In card mode, don't show title for BUG type
    return topic.type !== 'BUG'
  })

  const displayTitle = computed(() => {
    if (toValue(options.viewMode) === 'Compact') {
      // In compact mode, display content as title (since title is hidden)
      return topic.type === 'BUG'
        ? renderedText.value
        : (topic.title.length < 10 ? renderedText.value : topic.title)
    }
    return topic.title
  })

  const displayContent = computed(() => {
    // BUG type always shows rendered text (both compact and card mode)
    if (topic.type === 'BUG') {
      return renderedText.value
    }
    // ANN type shows rendered text, others show collapsed text
    return isAnn.value ? renderedText.value : collapseText.value
  })

  return {
    // State
    renderedText,
    isPost,
    isAnn,
    isCardMode,
    isCompactMode,

    // Text collapse
    isExpanded,
    hasOverflow,
    toggleExpand,

    // Display logic
    shouldShowTitle,
    displayTitle,
    displayContent,
  }
}
