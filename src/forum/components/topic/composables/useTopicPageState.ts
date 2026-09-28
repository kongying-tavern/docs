import { useData, useRouter, withBase } from 'vitepress'
import { computed, watch, watchEffect } from 'vue'
import { replaceTitle } from '@/composables/replaceTitle'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { data as forumDocumentLinks } from '~/_data/forumDocumentLinks.data'
import { useForumTopicQuery } from '~/forum/composables/data/useForumQueries'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { renderForumTopic } from '~/forum/services/forumContentRenderer'
import { getTopicTypeMap } from '~/forum/services/getTopicTypeMap'
import { handleError } from '~/forum/services/handleError'

export function useTopicPageState() {
  const topicTypeMap = getTopicTypeMap()
  const { localeIndex } = useData()
  const { route, topicHref, leaveTopic } = useForumRoute()
  const topicId = computed(() => route.value?.name === 'topic' ? route.value.topicId : '')
  const { go } = useRouter()
  const { message } = useLocalized()

  const {
    data: topic,
    isLoading: loading,
    error,
    refetch,
  } = useForumTopicQuery(topicId)

  // 唯一错误出口：404 跳转，其余错误弹提示；重试再失败也会再次进入本回调
  watch(error, (err) => {
    if (!err)
      return
    if (err.message.includes('404 Not Found')) {
      go(withBase(`${getLangPath(localeIndex.value)}404.html`))
      return
    }
    handleError(err, message, {
      errorMessage: message.value.forum.loadError + err.message,
    })
  })

  const renderedContent = computed(() => {
    if (!topic?.value?.content.text)
      return ''
    return renderForumTopic(topic.value.content.text, {
      topicHref: id => topicHref(id, null),
      documentLinks: forumDocumentLinks,
    })
  })

  watchEffect(() => {
    if (loading.value)
      return
    const title = topic.value?.type === 'BUG'
      ? `${topic.value.content.text.substring(0, 6)}...`
      : topic.value?.title || ''
    const type = topicTypeMap.get(topic.value?.type || '')
    replaceTitle(type ? `${type} - ${title}` : title)
  })

  return {
    topic,
    loading,
    error,
    retry: refetch,
    renderedContent,
    topicId,
    backToPreviousPage: leaveTopic,
  }
}
