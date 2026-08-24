import type ForumAPI from '@/apis/forum/api'
import { useToggle } from '@vueuse/core'
import { nextTick, readonly, ref } from 'vue'
import { useForumViewMode } from '~/composables/useForumViewMode'
import { updateUrlHash } from '../utils/dom-utils'
import { useNavigateToTopic } from './useNavigateToTopic'

export function useTopicInteraction(topic: ForumAPI.Topic | ForumAPI.Post) {
  const { isPost, detailHref, toPostDetailPage } = useNavigateToTopic(topic)
  const { isCompactMode } = useForumViewMode()

  // State
  const replyTarget = ref('')
  const [inReply, toggleReply] = useToggle()

  // Comment interaction functions
  async function handleToggleCommentInput(user: ForumAPI.User): Promise<void> {
    if (isCompactMode.value) {
      return toPostDetailPage('reply')
    }

    // Toggle reply state
    if (user.username === replyTarget.value || !replyTarget.value || !inReply.value) {
      toggleReply()
    }

    if (inReply.value) {
      replyTarget.value = user.username

      await nextTick(() => {
        const replyHash = `reply-${topic.id}`
        updateUrlHash(replyHash)

        window.scrollTo({
          top: (document.querySelector(`#${replyHash}`)?.getBoundingClientRect().top ?? 0) + window.pageYOffset - 300,
          behavior: 'smooth',
        })
      })
    }
  }

  return {
    // State
    replyTarget: readonly(replyTarget),
    inReply: readonly(inReply),

    // Computed
    isPost,

    // Actions
    detailHref,
    toPostDetailPage,
    handleToggleCommentInput,
    toggleReply,
  }
}
