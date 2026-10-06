import type ForumAPI from '../types'
import { normalizeComment } from './normalize'

export type OfficialUserPredicate = (userId: string | number) => boolean

export function extractOfficialAndAuthorComments(
  issue: { id?: number, number?: string, user?: { id?: number } },
  commentList: GITEE.CommentList,
  isOfficialUser: OfficialUserPredicate,
): ForumAPI.Comment[] | null {
  const comments: ForumAPI.Comment[] = []
  const relatedComments = commentList.filter(
    comment => issue.id != null
      ? comment.target?.issue?.id === issue.id
      : issue.number != null && comment.target?.issue?.number === issue.number,
  )
  const authorComment = relatedComments.find(
    comment => comment.user?.id != null && comment.user.id === issue.user?.id,
  )
  const officialComment = relatedComments.find(
    comment => comment.user?.id != null && isOfficialUser(comment.user.id),
  )

  if (authorComment)
    comments.push(normalizeComment(authorComment))
  if (officialComment)
    comments.push(normalizeComment(officialComment))

  const uniqueComments = [...new Map(comments.map(comment => [comment.id, comment])).values()]

  return uniqueComments.length > 0 ? uniqueComments : null
}
