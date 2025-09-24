import { issues } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { watchOnce } from '@vueuse/core'
import markdownIt from 'markdown-it'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { useRequest } from 'vue-request'
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

  // Setup topic page specific event listeners using new architecture
  function setupTopicPageEvents() {
    // Listen for topic deletion, close, or hide events
    const handleTopicRemoval = ({ topicId }: { topicId: string | number }) => {
      // If current topic is removed, navigate back
      if (String(topicId) === String(params.value?.id)) {
        backToPreviousPage()
      }
    }

    const unsubscribeTopicDeleted = simpleEventManager.subscribe('topic:deleted', handleTopicRemoval)
    const unsubscribeTopicClosed = simpleEventManager.subscribe('topic:closed', handleTopicRemoval)
    const unsubscribeTopicHidden = simpleEventManager.subscribe('topic:hidden', handleTopicRemoval)

    return () => {
      unsubscribeTopicDeleted()
      unsubscribeTopicClosed()
      unsubscribeTopicHidden()
    }
  }

  // Topic data request
  const { data: topic, run, loading, mutate, error } = useRequest(issues.getTopic, {
    defaultParams: [params.value?.id],
    manual: true,
    onError: (err) => {
      if (err.message.includes('404 Not Found')) {
        return go(withBase(`${getLangPath(localeIndex.value)}404.html`))
      }
    },
  })

  // Pre-fill with cached data if available from topic store
  const targetTopicData = forumTopicStore.topicDetail

  if (targetTopicData && targetTopicData.id === params.value?.id) {
    mutate(targetTopicData)
  }
  else if (!import.meta.env.SSR) {
    run(params.value?.id)
  }

  // Rendered content
  const renderedContent = computed(() =>
    sanitizeMarkdown(
      markdownIt().render(sanitizeMarkdown(topic?.value?.content.text)),
    ),
  )

  // Navigation
  function backToPreviousPage() {
    if (window.history.state?.idx === 1) {
      return go(withBase(`${getLangPath(localeIndex.value)}feedback/`))
    }
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
