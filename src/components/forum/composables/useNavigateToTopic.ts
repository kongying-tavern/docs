import type ForumAPI from '@/apis/forum/api'
import { isString } from 'lodash-es'
import { useData, useRouter, withBase } from 'vitepress'
import { computed } from 'vue'
import { getLangPath } from '@/utils'
import { useForumRoute } from '~/composables/useForumRoute'
import { forumEvents } from '~/services/events/SimpleEventManager'

export function useNavigateToTopic(topic: ForumAPI.Topic | ForumAPI.Post | string) {
  const router = useRouter()
  const { localeIndex } = useData()
  const { navigate } = useForumRoute()

  const isPost = computed(() => isString(topic) ? false : topic?.type === 'POST')

  async function toPostDetailPage(hash?: string): Promise<void> {
    if (isPost.value) {
      const path = `blog/posts/${(topic as ForumAPI.Post).path}`
      await router.go(withBase(`${getLangPath(localeIndex.value)}${path}${hash ? `#${hash}` : ''}`))
      return
    }

    const topicId = String(isString(topic) ? topic : topic.id)
    forumEvents.navigateToTopic(topicId)

    await navigate({ name: 'topic', locale: localeIndex.value, topicId }, hash ?? null)
  }

  return {
    isPost,
    toPostDetailPage,
  }
}
