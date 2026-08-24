import { watchOnce } from '@vueuse/core'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, watch, watchEffect } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { useForumTopicQuery } from '~/composables/forum/useForumQueries'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'
import { handleError } from '~/composables/handleError'
import { useForumRoute } from '~/composables/useForumRoute'
import { renderForumTopic } from '~/services/forum/forumContentRenderer'
import { setPageTitle } from '../../utils'

export function useTopicPageState() {
  const topicTypeMap = getTopicTypeMap()
  const { localeIndex } = useData()
  const { route } = useForumRoute()
  const topicId = computed(() => route.value?.name === 'topic' ? route.value.topicId : '')
  const { go } = useRouter()
  const { message } = useLocalized()

  // Topic data request
  const {
    data: topic,
    isLoading: loading,
    error,
    refetch,
  } = useForumTopicQuery(topicId)

  // Handle errors via watch
  watch(error, (err) => {
    if (err?.message.includes('404 Not Found')) {
      go(withBase(`${getLangPath(localeIndex.value)}404.html`))
    }
  })

  // Rendered content
  const renderedContent = computed(() => {
    if (!topic?.value?.content.text)
      return ''
    return renderForumTopic(topic.value.content.text)
  })

  // Navigation
  function backToPreviousPage() {
    window.history.back()
  }

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
    if (error.value) {
      handleError(error.value, message, {
        errorMessage: message.value.forum.loadError + error.value?.message,
      })
    }
  })

  return {
    topic,
    loading,
    error,
    retry: refetch,
    renderedContent,
    topicId,
    backToPreviousPage,
  }
}
