import { watchOnce } from '@vueuse/core'
import markdownIt from 'markdown-it'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { useRequest } from 'vue-request'
import { issues } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'
import { handleError } from '~/composables/handleError'
import { sanitizeMarkdown } from '~/composables/sanitizeMarkdown'
import { simpleEventManager } from '~/services/events/SimpleEventManager'
import { useForumTopicStore } from '~/stores/forum/useForumTopicStore'
import { setPageTitle } from '../../utils'

export function useTopicPageState() {
  const topicTypeMap = getTopicTypeMap()
  const forumTopicStore = useForumTopicStore()
  const { params, localeIndex } = useData()
  const { go } = useRouter()
  const { message } = useLocalized()

  // Topic data request - 需要先定义，因为后面的事件处理器会用到
  const { data: topic, run, loading, mutate, error } = useRequest(issues.getTopic, {
    defaultParams: [params.value?.id],
    manual: true,
    onError: (err) => {
      if (err.message.includes('404 Not Found')) {
        return go(withBase(`${getLangPath(localeIndex.value)}404.html`))
      }
    },
  })

  // Setup topic page specific event listeners using new architecture
  function setupTopicPageEvents() {
    // Listen for topic deletion, close, or hide events
    const handleTopicRemoval = ({ id }: { id: string | number }) => {
      // If current topic is removed, navigate back
      if (String(id) === String(params.value?.id)) {
        backToPreviousPage()
      }
    }

    // Listen for comment events to update topic data
    const handleCommentCreated = ({ topicId, comment }: { topicId: string | number, comment: any }) => {
      if (String(topicId) === String(params.value?.id) && topic.value) {
        // Update comment count
        const newCommentCount = (topic.value.commentCount || 0) + 1

        // Update related comments
        const currentRelatedComments = topic.value.relatedComments || []
        const newRelatedComments = [comment, ...currentRelatedComments].slice(0, 3)

        // Update the topic data
        mutate({
          ...topic.value,
          commentCount: newCommentCount,
          relatedComments: newRelatedComments,
        })
      }
    }

    const handleCommentDeleted = ({ topicId, commentId }: { topicId: string | number, commentId: string | number }) => {
      if (String(topicId) === String(params.value?.id) && topic.value) {
        // Update comment count
        const newCommentCount = Math.max((topic.value.commentCount || 0) - 1, 0)

        // Update related comments
        const currentRelatedComments = topic.value.relatedComments || []
        const newRelatedComments = currentRelatedComments.filter(c => c.id !== commentId)

        // Update the topic data
        mutate({
          ...topic.value,
          commentCount: newCommentCount,
          relatedComments: newRelatedComments,
        })
      }
    }

    const unsubscribeTopicDeleted = simpleEventManager.subscribe('topic:deleted', handleTopicRemoval)
    const unsubscribeTopicClosed = simpleEventManager.subscribe('topic:closed', handleTopicRemoval)
    const unsubscribeTopicHidden = simpleEventManager.subscribe('topic:hidden', handleTopicRemoval)
    const unsubscribeCommentCreated = simpleEventManager.subscribe('comment:created', handleCommentCreated)
    const unsubscribeCommentDeleted = simpleEventManager.subscribe('comment:deleted', handleCommentDeleted)

    return () => {
      unsubscribeTopicDeleted()
      unsubscribeTopicClosed()
      unsubscribeTopicHidden()
      unsubscribeCommentCreated()
      unsubscribeCommentDeleted()
    }
  }

  // Pre-fill with cached data if available from topic store
  const targetTopicData = forumTopicStore.topicDetail

  if (targetTopicData && targetTopicData.id === params.value?.id) {
    mutate(targetTopicData)
  }
  else if (!import.meta.env.SSR) {
    run(params.value?.id)
  }

  // Rendered content
  const renderedContent = computed(() => {
    if (!topic?.value?.content.text)
      return ''

    // First sanitize to clean up the raw content
    const cleanedText = sanitizeMarkdown(topic.value.content.text)

    // Configure markdown-it to preserve line breaks
    const md = markdownIt({
      breaks: true, // Convert '\n' in paragraphs into <br>
      linkify: true, // Autoconvert URL-like text to links
    })

    // Render and sanitize again
    return sanitizeMarkdown(md.render(cleanedText))
  })

  // Navigation
  function backToPreviousPage() {
    const referrer = document.referrer
    const currentOrigin = window.location.origin

    // Only redirect to feedback page if clearly external access or no referrer
    if (!referrer || !referrer.startsWith(currentOrigin)) {
      const feedbackPath = withBase(`${getLangPath(localeIndex.value)}feedback/`)
      return go(feedbackPath)
    }

    // For internal navigation, use browser back
    window.history.back()
  }

  // Setup lifecycle events
  let cleanupFunction: (() => void) | null = null

  onMounted(() => {
    cleanupFunction = setupTopicPageEvents()
    // Setup store event listeners
    forumTopicStore.setupEventListeners()
  })

  onUnmounted(() => {
    if (cleanupFunction) {
      cleanupFunction()
      cleanupFunction = null
    }
    forumTopicStore.cleanup()
  })

  // Side effects
  watchEffect(() => {
    if (loading.value)
      return
    setPageTitle(
      topic.value?.type === 'BUG'
        ? `${topic.value.content.text.substring(0, 6)}...`
        : topic.value?.title || '',
      topicTypeMap.get(topic.value?.type || ''),
    )
  })

  watchOnce(error, () => {
    handleError(error.value, message, {
      errorMessage: message.value.forum.loadError + error?.value?.message,
    })
  })

  return {
    topic,
    loading,
    renderedContent,
    params,
    message,
    backToPreviousPage,
  }
}
