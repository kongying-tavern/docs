import { watchOnce } from '@vueuse/core'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, watch, watchEffect } from 'vue'
import { replaceTitle } from '@/composables/replaceTitle'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { data as forumDocumentLinks } from '~/_data/forumDocumentLinks.data'
import { useForumTopicQuery } from '~/composables/forum/useForumQueries'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'
import { handleError } from '~/composables/handleError'
import { useForumRoute } from '~/composables/useForumRoute'
import { renderForumTopic } from '~/services/forum/forumContentRenderer'

export function useTopicPageState() {
  const topicTypeMap = getTopicTypeMap()
  const { localeIndex } = useData()
  const { route, topicHref } = useForumRoute()
  const topicId = computed(() => route.value?.name === 'topic' ? route.value.topicId : '')
  const { go } = useRouter()
  const { message } = useLocalized()

  const {
    data: topic,
    isLoading: loading,
    error,
    refetch,
  } = useForumTopicQuery(topicId)

  watch(error, (err) => {
    if (err?.message.includes('404 Not Found')) {
      go(withBase(`${getLangPath(localeIndex.value)}404.html`))
    }
  })

  const renderedContent = computed(() => {
    if (!topic?.value?.content.text)
      return ''
    return renderForumTopic(topic.value.content.text, {
      topicHref: id => topicHref(id, null),
      documentLinks: forumDocumentLinks,
    })
  })

  function backToPreviousPage() {
    window.history.back()
  }

  watchEffect(() => {
    if (loading.value)
      return
    const title = topic.value?.type === 'BUG'
      ? `${topic.value.content.text.substring(0, 6)}...`
      : topic.value?.title || ''
    const type = topicTypeMap.get(topic.value?.type || '')
    replaceTitle(type ? `${type} - ${title}` : title)
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
