import type ForumAPI from '@/apis/forum/api'
import { useInfiniteScroll, useMediaQuery } from '@vueuse/core'
import { computed, onScopeDispose, readonly, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumCommentsQuery } from '~/composables/forum/useForumQueries'
import { useForumRoute } from '~/composables/useForumRoute'
import { readForumCommentId } from '~/services/forum/forumRoute'

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
  const { location, replaceCommentPage, route } = useForumRoute()

  const replyCommentID = ref<number | string | null>(null)
  const commentInputBoxIsVisible = ref(true)
  const isClosedComment = computed(() => props.commentCount === -1)
  const currentCommentPage = computed(() => comments.data.value?.pageParams.at(-1) ?? 0)
  const requestedCommentPage = computed(() => route.value?.name === 'topic' && route.value.topicId === props.topicId
    ? route.value.commentPage
    : 1)
  const targetCommentId = computed(() => readForumCommentId(location.value?.href ?? ''))
  const commentPages = computed(() => {
    const pages = new Map<string, number>()
    comments.data.value?.pages.forEach((page, index) => {
      const pageNumber = comments.data.value?.pageParams[index] ?? 1
      page.items.forEach(comment => pages.set(String(comment.id), pageNumber))
    })
    return pages
  })
  const targetCommentReady = computed(() => Boolean(
    targetCommentId.value
    && commentPages.value.has(targetCommentId.value)
    && (currentCommentPage.value >= requestedCommentPage.value || !comments.canLoadMore.value),
  ))
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

  let disposed = false
  let restoringCommentPage: Promise<void> | null = null
  onScopeDispose(() => disposed = true)

  function restoreRequestedCommentPage(): Promise<void> {
    if (restoringCommentPage)
      return restoringCommentPage

    restoringCommentPage = (async () => {
      while (
        currentCommentPage.value < requestedCommentPage.value
        && comments.canLoadMore.value
        && !comments.error.value
      ) {
        if (disposed)
          break
        const previousPage = currentCommentPage.value
        await comments.loadMore()
        if (currentCommentPage.value === previousPage)
          break
      }
    })().finally(() => restoringCommentPage = null)

    return restoringCommentPage
  }

  watch(
    [requestedCommentPage, comments.isLoading],
    ([, loading]) => {
      if (!loading)
        void restoreRequestedCommentPage()
    },
    { immediate: true },
  )

  watch([currentCommentPage, requestedCommentPage, comments.canLoadMore], ([page, requestedPage, canLoadMore]) => {
    if (page > 0) {
      const restoredPage = !canLoadMore && page < requestedPage
        ? page
        : Math.max(page, requestedPage)
      replaceCommentPage(restoredPage)
    }
  }, { immediate: true })

  if (!import.meta.env.SSR) {
    useInfiniteScroll(window, async () => {
      await comments.loadMore()
    }, {
      distance: 10,
      interval: 1500,
      canLoadMore: () => enabled.value && comments.canLoadMore.value,
    })
  }

  return {
    replyCommentID: readonly(replyCommentID),
    commentInputBoxIsVisible: readonly(commentInputBoxIsVisible),
    isMobile,
    canLoadMoreComment: comments.canLoadMore,
    renderComments: comments.rows,
    commentPages,
    allCommentCount: comments.total,
    currentCommentPage,
    targetCommentId,
    targetCommentReady,
    loadStateMessage,
    commentLoading: comments.isLoading,
    commentError: comments.error,
    isClosedComment,
    isReplyingTo: (id: number | string) => replyCommentID.value === id,
    toggleCommentReply,
    handleCommentSubmit,
    retry: comments.refetch,
    setCommentInputBoxVisible: (visible: boolean) => {
      commentInputBoxIsVisible.value = visible
    },
  }
}
