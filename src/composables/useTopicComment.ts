import type ForumAPI from '@/apis/forum/api'
import { issues } from '@/apis/forum/gitee'
import { useLoadMore } from '@/hooks/useLoadMore'
import { useLocalized } from '@/hooks/useLocalized'
import { computed, ref, watch, type Ref } from 'vue'
import { executeWithAuth } from './executeWithAuth'
import { createGlobalState } from '@vueuse/core'

export const useTopicComments = createGlobalState(() => {
  const comments = ref<ForumAPI.Comment[]>([])
  const commentCount = ref<number | null>(null)
  const isLoaded = ref(false)
  const {
    data,
    loadMore: loadMoreComment,
    noMore: noMoreComment,
    loading: commentLoading,
    total: totalComment,
    current: currentCommentPage,
    canLoadMore: canLoadMoreComment,
    error: commentLoadError,
    runAsync: refreshComment,
  } = useLoadMore(issues.getTopicComments, {
    manual: true,
  })

  const { message } = useLocalized()

  const userSubmittedComment = ref<ForumAPI.Comment[]>([])
  const allCommentCount = computed(() =>
    isLoaded.value
      ? comments.value.length
      : commentCount.value
        ? commentCount.value
        : 0 + userSubmittedComment.value.length,
  )
  const noComment = computed(() => commentCount.value === 0)

  const initComments = async (
    topicId: string,
    repo: 'Feedback' | 'Blog',
    topicCommentCount: number | null,
  ) => {
    if (import.meta.env.SSR || topicCommentCount === 0) return null
    commentCount.value = topicCommentCount
    await refreshComment(
      repo,
      { current: 1, pageSize: 20, sort: 'created', filter: null },
      topicId,
    )
    isLoaded.value = true
  }

  const submitComment = (submittedComment: Ref<ForumAPI.Comment>) => {
    if (!submittedComment.value) return
    userSubmittedComment.value.push(submittedComment.value)
  }

  const deleteComment = async (
    repo: string,
    id: string | number,
  ): Promise<boolean> => {
    comments.value = comments.value.filter((comment) => comment.id !== id)
    userSubmittedComment.value = userSubmittedComment.value.filter(
      (comment) => comment.id !== id,
    )

    return await executeWithAuth(
      issues.deleteIssueComment,
      [repo, id],
      message.value.forum.topic.menu.deleteComment.success,
      message.value.forum.topic.menu.deleteComment.fail,
      message,
    )
  }

  const loadStateMessage = computed(() => {
    if (commentLoadError.value) return message.value.forum.loadError
    if (!noMoreComment && comments.value.length !== 0)
      return message.value.forum.comment.loadMoreComment
    if ((comments.value.length === 0 && !commentLoading.value) || noComment)
      return message.value.forum.comment.noComment
    return message.value.forum.comment.noMoreComment
  })

  watch(
    commentLoading,
    () => {
      comments.value = data.value
    },
    {
      immediate: true,
    },
  )

  return {
    comments,
    noMoreComment,
    commentLoading,
    totalComment,
    currentCommentPage,
    canLoadMoreComment,
    userSubmittedComment,
    allCommentCount,
    noComment,

    submitComment,
    deleteComment,
    initComments,
    loadMoreComment,

    loadStateMessage,
  }
})
