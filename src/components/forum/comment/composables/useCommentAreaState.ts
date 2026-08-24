import type ForumAPI from '@/apis/forum/api'
import { useInfiniteScroll, useMediaQuery } from '@vueuse/core'
import { computed, readonly, ref } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumCommentsQuery } from '~/composables/forum/useForumQueries'

export function useCommentAreaState(props: {
  repo: ForumAPI.Repo
  topicId: string
  topicAuthorId: string | number
  commentCount?: number
}) {
  const { message } = useLocalized()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const enabled = computed(() => props.commentCount !== null && props.commentCount !== undefined && props.commentCount !== -1)
  const comments = useForumCommentsQuery({
    topicId: () => props.topicId,
    repo: () => props.repo,
    enabled,
  })

  const replyCommentID = ref<number | string | null>(null)
  const commentInputBoxIsVisible = ref(true)
  const isClosedComment = computed(() => props.commentCount === -1)
  const currentCommentPage = computed(() => comments.data.value?.pages.length ?? 0)
  const loadStateMessage = computed(() => {
    if (comments.error.value)
      return message.value.forum.loadError
    if (comments.canLoadMore.value)
      return message.value.forum.comment.loadMoreComment
    if (comments.rows.value.length === 0)
      return message.value.forum.comment.noComment
    return message.value.forum.comment.noMoreComment
  })

  function toggleCommentReply(id: number | string): void {
    replyCommentID.value = replyCommentID.value === id ? null : id
  }

  function handleCommentSubmit(): void {
    replyCommentID.value = null
  }

  async function initialize(): Promise<void> {
    replyCommentID.value = null
    commentInputBoxIsVisible.value = true
    if (import.meta.env.SSR || !enabled.value)
      return
    useInfiniteScroll(window, async () => {
      await comments.loadMore()
    }, {
      distance: 10,
      interval: 1500,
      canLoadMore: () => comments.canLoadMore.value,
    })
  }

  function cleanup(): void {
    replyCommentID.value = null
    commentInputBoxIsVisible.value = true
  }

  return {
    replyCommentID: readonly(replyCommentID),
    commentInputBoxIsVisible: readonly(commentInputBoxIsVisible),
    isMobile,
    canLoadMoreComment: comments.canLoadMore,
    renderComments: comments.rows,
    allCommentCount: comments.total,
    currentCommentPage,
    loadStateMessage,
    commentLoading: comments.isLoading,
    isClosedComment,
    isReplyingTo: (id: number | string) => replyCommentID.value === id,
    toggleCommentReply,
    handleCommentSubmit,
    initialize,
    cleanup,
    setCommentInputBoxVisible: (visible: boolean) => {
      commentInputBoxIsVisible.value = visible
    },
  }
}
