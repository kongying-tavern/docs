import type ForumAPI from '@/apis/forum/api'
import { isString } from 'lodash-es'
import { useData, useRouter, withBase } from 'vitepress'
import { computed } from 'vue'
import { getLangPath } from '@/utils'
import { useForumRoute } from '~/composables/useForumRoute'

export function useNavigateToTopic(topic: ForumAPI.Topic | ForumAPI.Post | string) {
  const router = useRouter()
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

  async function toPostDetailPage(hash?: string): Promise<void> {
    await router.go(detailHref(hash))
  }

  return {
    isPost,
    detailHref,
    toPostDetailPage,
  }
}
