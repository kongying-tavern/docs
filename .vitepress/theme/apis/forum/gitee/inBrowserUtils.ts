import type ForumAPI from '../api'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { normalizeComment } from './utils'

export function extractOfficialAndAuthorComments(
  issue: GITEE.IssueInfo,
  commentList: GITEE.CommentList,
): ForumAPI.Comment[] | null {
  const comments: ForumAPI.Comment[] = []
  const relatedComments = commentList.filter(
    comment => comment.target.issue.id === issue.id,
  )
  const authorComment = relatedComments.find(
    comment => comment.user.id === issue.user.id,
  )
  const { isOfficial } = useRuleChecks()
  const officialComment = relatedComments.find(
    comment => isOfficial(comment.user.id).value,
  )

  if (authorComment)
    comments.push(normalizeComment(authorComment))
  if (officialComment)
    comments.push(normalizeComment(officialComment))

  const uniqueComments = [...new Map(comments.map(comment => [comment.id, comment])).values()]

  return uniqueComments.length > 0 ? uniqueComments : null
}
