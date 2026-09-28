import type ForumAPI from '~/forum/api/forum'
import { useEventListener, useInfiniteScroll, useMediaQuery } from '@vueuse/core'
import { computed, onScopeDispose, readonly, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumCommentsQuery } from '~/forum/composables/useForumQueries'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import { resolveCommentTargetState, resolveRestoredCommentPage } from '~/forum/services/commentNavigation'
import { readForumCommentId } from '~/forum/services/forumRoute'

export function useCommentAreaState(props: {
  repo: ForumAPI.Repo
  topicId: string
  topicAuthorId: string | number
  inline?: boolean
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
  const { location: forumLocation, replaceCommentPage, route } = useForumRoute()

  const replyCommentID = ref<number | string | null>(null)
  const commentInputBoxIsVisible = ref(true)
  const isClosedComment = computed(() => props.commentCount === -1)
  const currentCommentPage = computed(() => comments.data.value?.pageParams.at(-1) ?? 0)
  const requestedCommentPage = computed(() => route.value?.name === 'topic' && route.value.topicId === props.topicId
    ? route.value.commentPage
    : 1)
  const browserHref = ref(forumLocation.value?.href ?? '')
  watch(() => forumLocation.value?.href, href => browserHref.value = href ?? '')
  if (!import.meta.env.SSR) {
    const syncBrowserHref = () => browserHref.value = window.location.href
    syncBrowserHref()
    useEventListener(window, 'hashchange', syncBrowserHref)
  }
  const targetCommentId = computed(() => readForumCommentId(browserHref.value))
  const commentPages = computed(() => {
    const pages = new Map<string, number>()
    comments.data.value?.pages.forEach((page, index) => {
      const pageNumber = comments.data.value?.pageParams[index] ?? 1
      page.items.forEach(comment => pages.set(String(comment.id), pageNumber))
    })
    return pages
  })
  const targetCommentState = computed(() => resolveCommentTargetState({
    targetCommentId: targetCommentId.value,
    hasTargetComment: Boolean(
      targetCommentId.value
      && commentPages.value.has(targetCommentId.value)
      && (currentCommentPage.value >= requestedCommentPage.value || !comments.canLoadMore.value),
    ),
    loading: comments.isLoading.value,
    canLoadMore: comments.canLoadMore.value,
    hasError: Boolean(comments.error.value),
  }))
  const targetCommentReady = computed(() => targetCommentState.value === 'ready')
  const loadStateMessage = computed(() => {
    if (comments.error.value)
      return message.value.forum.loadError
    if (targetCommentState.value === 'missing')
      return message.value.forum.comment.targetNotFound
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
    if (page > 0)
      replaceCommentPage(resolveRestoredCommentPage(page, requestedPage, canLoadMore))
  }, { immediate: true })

  if (!import.meta.env.SSR && !props.inline) {
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
    targetCommentState,
    loadStateMessage,
    commentLoading: comments.isLoading,
    commentError: comments.error,
    isClosedComment,
    isReplyingTo: (id: number | string) => replyCommentID.value === id,
    toggleCommentReply,
    handleCommentSubmit,
    retry: comments.refetch,
    loadMoreComment: comments.loadMore,
    setCommentInputBoxVisible: (visible: boolean) => {
      commentInputBoxIsVisible.value = visible
    },
  }
}
