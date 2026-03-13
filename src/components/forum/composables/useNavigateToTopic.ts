import type ForumAPI from '@/apis/forum/api'
import { isString } from 'lodash-es'
import { useData, useRouter, withBase } from 'vitepress'
import { computed } from 'vue'
import { getLangPath } from '@/utils'
import { forumEvents } from '~/services/events/SimpleEventManager'

export function useNavigateToTopic(topic: ForumAPI.Topic | ForumAPI.Post | string) {
  const router = useRouter()
  const { localeIndex } = useData()

  const isPost = computed(() => isString(topic) ? false : topic?.type === 'POST')

  async function toPostDetailPage(hash?: string): Promise<void> {
    const path = isPost.value
      ? `blog/posts/${(topic as ForumAPI.Post).path}`
      : `feedback/topic/${isString(topic) ? topic : topic.id}`

    const fullPath = withBase(`${getLangPath(localeIndex.value)}${path}${hash ? `#${hash}` : ''}`)

    // Emit navigation event
    forumEvents.navigateToTopic(isString(topic) ? topic : topic.id)

    return await router.go(fullPath)
  }

  return {
    isPost,
    toPostDetailPage,
  }
}
