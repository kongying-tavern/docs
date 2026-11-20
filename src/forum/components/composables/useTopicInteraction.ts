import type ForumAPI from '@/src/forum/api/types.d.ts'
import { useToggle } from '@vueuse/core'
import { nextTick, readonly, ref } from 'vue'
import { useForumViewMode } from '@/src/forum/composables/state/useForumViewMode.ts'
import { updateUrlHash } from '../utils/updateUrlHash.ts'
import { useNavigateToTopic } from './useNavigateToTopic.ts'

export function useTopicInteraction(topic: ForumAPI.Topic | ForumAPI.Post) {
  const { isPost, detailHref, prepareTopicDetail, toPostDetailPage } = useNavigateToTopic(topic)
  const { isCompactMode } = useForumViewMode(() => topic.type)

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
    prepareTopicDetail,
    toPostDetailPage,
    handleToggleCommentInput,
    toggleReply,
  }
}
