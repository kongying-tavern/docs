import { replaceTitle } from '@theme/lib/documentTitle.ts'
import { getLangPath } from '@theme/lib/locale.ts'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { data as forumDocumentLinks } from '#data/loader/forumDocumentLinks.data.ts'
import { useForumTopicQuery } from '@/src/forum/hooks/data/useForumQueries.ts'
import { useForumRoute } from '@/src/forum/hooks/state/useForumRoute.ts'
import { decodeTopicBody } from '@/src/forum/services/forumContentCodec.ts'
import { renderForumTopic } from '@/src/forum/services/forumContentRenderer.ts'
import { getTopicTypeMap } from '@/src/forum/services/getTopicTypeMap.ts'
import { handleError } from '@/src/forum/services/handleError.ts'

export function useTopicPageState() {
  const { localeIndex } = useData()
  const { route, topicHref, leaveTopic } = useForumRoute()
  const topicId = computed(() => route.value?.name === 'topic' ? route.value.topicId : '')
  const { go } = useRouter()
  const { t } = useI18n({ useScope: 'global' })
  const topicTypeMap = computed(() => getTopicTypeMap(t))

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
    handleError(err, t, {
      errorMessage: t('forum.loadError') + err.message,
    })
  })

  const renderedContent = computed(() => {
    if (!topic?.value?.content.text)
      return ''
    return renderForumTopic(decodeTopicBody(topic.value.contentRaw).content, {
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
    const type = topicTypeMap.value.get(topic.value?.type || '')
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
