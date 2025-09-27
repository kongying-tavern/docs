import type { Ref } from 'vue'
import type { FORUM } from '../types'
import type ForumAPI from '@/apis/forum/api'
import { useToggle } from '@vueuse/core'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, nextTick, readonly, ref } from 'vue'
import { getLangPath } from '@/utils'
import { useTopicComments } from '~/composables/useTopicComment'
import { forumEvents } from '~/services/events/SimpleEventManager'

import { updateUrlHash } from '../utils/dom-utils'

export function useTopicInteraction(topic: ForumAPI.Topic | ForumAPI.Post, viewMode: FORUM.TopicViewMode) {
  const router = useRouter()
  const { localeIndex } = useData()
  const { submitComment } = useTopicComments()

  // State
  const replyTarget = ref('')
  const userSubmittedComment = ref<ForumAPI.Comment[]>([])
  const [inReply, toggleReply] = useToggle()

  // Computed properties
  const isPost = computed(() => topic.type === 'POST')
  const isCompactMode = computed(() => viewMode === 'Compact')
  const isCardMode = computed(() => viewMode === 'Card')

  // Navigation functions
  async function toPostDetailPage(hash?: string): Promise<void> {
    const path = isPost.value
      ? `blog/posts/${(topic as ForumAPI.Post).path}`
      : `feedback/topic/${topic.id}`

    const fullPath = withBase(`${getLangPath(localeIndex.value)}${path}${hash ? `#${hash}` : ''}`)

    // Emit navigation event
    forumEvents.navigateToTopic(topic.id)

    return await router.go(fullPath)
  }

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
    isCompactMode,
    isCardMode,

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
