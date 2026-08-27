import type { Ref } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import { useToggle } from '@vueuse/core'
import { nextTick, readonly, ref } from 'vue'
import { useForumViewMode } from '~/composables/useForumViewMode'
import { useTopicComments } from '~/composables/useTopicComment'
import { forumEvents } from '~/services/events/SimpleEventManager'
import { updateUrlHash } from '../utils/dom-utils'
import { useNavigateToTopic } from './useNavigateToTopic'

export function useTopicInteraction(topic: ForumAPI.Topic | ForumAPI.Post) {
  const { submitComment } = useTopicComments()
  const { isPost, toPostDetailPage } = useNavigateToTopic(topic)
  const { isCompactMode } = useForumViewMode()

  // State
  const replyTarget = ref('')
  const userSubmittedComment = ref<ForumAPI.Comment[]>([])
  const [inReply, toggleReply] = useToggle()

  // Comment interaction functions
  function handleCommentSubmit(submittedComment: Ref<ForumAPI.Comment>): void {
    submitComment(submittedComment)
    userSubmittedComment.value.push(submittedComment.value)

    // Emit comment created event
    forumEvents.commentCreated(
      submittedComment.value.id,
      topic.id,
      submittedComment.value,
    )
  }

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

  // Content interaction functions
  function handleTopicClick(): void {
    if (topic.type !== 'ANN') {
      toPostDetailPage()
    }
  }

  return {
    // State
    replyTarget: readonly(replyTarget),
    userSubmittedComment: readonly(userSubmittedComment),
    inReply: readonly(inReply),

    // Computed
    isPost,

    // Actions
    toPostDetailPage,
    handleCommentSubmit,
    handleToggleCommentInput,
    handleTopicClick,
    toggleReply,
  }
}
