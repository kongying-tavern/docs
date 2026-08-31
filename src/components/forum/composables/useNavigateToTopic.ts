import type ForumAPI from '@/apis/forum/api'
import { useQueryCache } from '@pinia/colada'
import { isString } from 'lodash-es'
import { useData, useRouter, withBase } from 'vitepress'
import { computed } from 'vue'
import { getLangPath } from '@/utils'
import { useForumRoute } from '~/composables/useForumRoute'
import { forumKeys } from '~/services/forum/forumQueryContracts'

export function useNavigateToTopic(topic: ForumAPI.Topic | ForumAPI.Post | string) {
  const router = useRouter()
  const queryCache = useQueryCache()
  const { localeIndex } = useData()
  const { topicHref } = useForumRoute()

  const isPost = computed(() => isString(topic) ? false : topic?.type === 'POST')

  function detailHref(hash?: string): string {
    if (isPost.value) {
      const path = `blog/posts/${(topic as ForumAPI.Post).path}`
      return withBase(`${getLangPath(localeIndex.value)}${path}${hash ? `#${hash}` : ''}`)
    }

    const topicId = String(isString(topic) ? topic : topic.id)
    return topicHref(topicId, hash ?? null)
  }

  function prepareTopicDetail(): void {
    if (!isString(topic) && topic.type !== 'POST')
      queryCache.setQueryData(forumKeys.topic(topic.id), topic)
  }

  async function toPostDetailPage(hash?: string): Promise<void> {
    prepareTopicDetail()
    await router.go(detailHref(hash))
  }

  return {
    isPost,
    detailHref,
    prepareTopicDetail,
    toPostDetailPage,
  }
}
