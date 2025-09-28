import type { Ref } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import { useInfiniteScroll, useMediaQuery } from '@vueuse/core'
import { computed, readonly, ref } from 'vue'
import { useTopicComments } from '~/composables/useTopicComment'

export function useCommentAreaState(props: {
  repo: ForumAPI.Repo
  topicId: string
  topicAuthorId: string | number
  commentCount?: number
}) {
  // Composables
  const isMobile = useMediaQuery('(max-width: 768px)')
  const {
    userSubmittedComment,
    comments,
    loadMoreComment,
    canLoadMoreComment,
    loadStateMessage,
    submitComment,
    commentLoading,
    allCommentCount,
    currentCommentPage,
    initComments,
  } = useTopicComments()

  const noComment = computed(() => props.commentCount === null || props.commentCount === undefined)

  // State
  const replyCommentID = ref<number | string | null>(null)
  const commentInputBoxIsVisible = ref(true)

  // Computed
  const renderComments = computed(() => [
    ...userSubmittedComment.value,
    ...comments.value,
  ])

  const isClosedComment = computed(() => props.commentCount === -1)

  // Reply management
  const isReplyingTo = (id: number | string) => replyCommentID.value === id

  function toggleCommentReply(id: number | string): void {
    replyCommentID.value = replyCommentID.value === id ? null : id
  }

  // Comment submission
  function handleCommentSubmit(submittedComment: Ref<ForumAPI.Comment>): void {
    submitComment(submittedComment)
  }

  async function initialize(): Promise<void> {
    if (import.meta.env.SSR || noComment.value)
      return

    replyCommentID.value = null
    commentInputBoxIsVisible.value = true

    await initComments(props.topicId, props.repo, props.commentCount ?? null)

    if (!noComment.value) {
      useInfiniteScroll(
        window,
        () => {
          loadMoreComment()
        },
        {
          distance: 10,
          interval: 1500,
          canLoadMore: () => canLoadMoreComment.value,
        },
      )
    }
  }

  function cleanup(): void {
    replyCommentID.value = null
    commentInputBoxIsVisible.value = true
    userSubmittedComment.value = []
  }

  return {
    // State
    replyCommentID: readonly(replyCommentID),
    commentInputBoxIsVisible: readonly(commentInputBoxIsVisible),
    isMobile,

    // Data
    renderComments,
    allCommentCount,
    currentCommentPage,
    loadStateMessage,
    commentLoading,
    isClosedComment,

    // Actions
    isReplyingTo,
    toggleCommentReply,
    handleCommentSubmit,
    initialize,
    cleanup,

    // Refs for external use
    setCommentInputBoxVisible: (visible: boolean) => {
      commentInputBoxIsVisible.value = visible
    },
  }
}
