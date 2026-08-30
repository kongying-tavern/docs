import type ForumAPI from '@/apis/forum/api'
import { useToggle } from '@vueuse/core'
import { nextTick, readonly, ref } from 'vue'
import { useForumViewMode } from '~/composables/useForumViewMode'
import { updateUrlHash } from '../utils/dom-utils'
import { useNavigateToTopic } from './useNavigateToTopic'

export function useTopicInteraction(topic: ForumAPI.Topic | ForumAPI.Post) {
  const { isPost, detailHref, toPostDetailPage } = useNavigateToTopic(topic)
  const { isCompactMode } = useForumViewMode()

  const replyTarget = ref('')
  const [inReply, toggleReply] = useToggle()

  async function handleToggleCommentInput(user: ForumAPI.User): Promise<void> {
    if (isCompactMode.value) {
      return toPostDetailPage('reply')
    }

    if (user.username === replyTarget.value || !replyTarget.value || !inReply.value) {
      toggleReply()
    }

    if (inReply.value) {
      replyTarget.value = user.username

      await nextTick(() => {
        updateUrlHash(`reply-${topic.id}`)
      })
    }
  }

  return {
    replyTarget: readonly(replyTarget),
    inReply: readonly(inReply),

    isPost,

    detailHref,
    toPostDetailPage,
    handleToggleCommentInput,
    toggleReply,
  }
}
