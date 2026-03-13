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

        // Emit comment reply event
        forumEvents.commentReply(topic.id, user.username)
      })
    }
  }

  // Content interaction functions
  function handleTopicClick(): void {
    if (topic.type !== 'ANN') {
      toPostDetailPage()
    }
  }

  function handleUserClick(user: ForumAPI.User): void {
    forumEvents.navigateToUser(user.login)
  }

  // Menu actions
  function handleMenuAction(actionId: string, payload?: ForumAPI.TopicType | string[] | null): void {
    switch (actionId) {
      case 'translator':
        // Translator action will be handled by the translator component
        break
      case 'edit':
        forumEvents.topicAction(topic.id, 'edit', payload)
        break
      case 'delete':
        forumEvents.topicAction(topic.id, 'delete', payload)
        break
      case 'pin':
        forumEvents.topicAction(topic.id, 'pin', payload)
        break
      case 'unpin':
        forumEvents.topicAction(topic.id, 'unpin', payload)
        break
      case 'hide':
        forumEvents.topicAction(topic.id, 'hide', payload)
        break
      case 'unhide':
        forumEvents.topicAction(topic.id, 'unhide', payload)
        break
      case 'close':
        forumEvents.topicAction(topic.id, 'close', payload)
        break
      case 'reopen':
        forumEvents.topicAction(topic.id, 'reopen', payload)
        break
      case 'change-type':
        forumEvents.topicAction(topic.id, 'change-type', payload)
        break
      case 'update-tags':
        forumEvents.topicAction(topic.id, 'update-tags', payload)
        break
      default:
        console.warn(`Unknown menu action: ${actionId}`)
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
    handleUserClick,
    handleMenuAction,
    toggleReply,
  }
}
