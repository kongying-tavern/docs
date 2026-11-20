import type ForumAPI from '@/src/forum/api/types.d.ts'
import { useQueryCache } from '@pinia/colada'
import { getLangPath } from '@theme/utils.ts'
import { isString } from 'lodash-es'
import { useData, useRouter, withBase } from 'vitepress'
import { computed } from 'vue'
import { useForumRoute } from '@/src/forum/composables/state/useForumRoute.ts'
import { forumKeys } from '@/src/forum/services/forumQueryContracts.ts'

export function useNavigateToTopic(topic: ForumAPI.Topic | ForumAPI.Post | string) {
  const router = useRouter()
  const queryCache = useQueryCache()
  const { localeIndex } = useData()
  const { topicHref } = useForumRoute()

  const isPost = computed(() => isString(topic) ? false : topic?.type === 'POST')

  function detailHref(hash?: string): string {
    if (!isString(topic) && topic.type === 'POST') {
      const path = `blog/posts/${topic.path}`
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
