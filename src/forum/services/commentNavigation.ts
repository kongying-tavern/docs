export type CommentTargetState = 'none' | 'loading' | 'ready' | 'missing'

export function resolveCommentTargetState(options: {
  targetCommentId: string | null
  hasTargetComment: boolean
  loading: boolean
  canLoadMore: boolean
  hasError: boolean
}): CommentTargetState {
  if (!options.targetCommentId)
    return 'none'
  if (options.hasTargetComment)
    return 'ready'
  if (options.loading || options.canLoadMore || options.hasError)
    return 'loading'
  return 'missing'
}

export function resolveRestoredCommentPage(
  currentPage: number,
  requestedPage: number,
  canLoadMore: boolean,
): number {
  if (!canLoadMore && currentPage < requestedPage)
    return currentPage
  return Math.max(currentPage, requestedPage)
}
