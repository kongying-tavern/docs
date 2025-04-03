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
  // 查找作者的评论
  const authorComment = relatedComments.find(
    comment => comment.user.id === issue.user.id,
  )
  // 查找官方团队的评论
  const officialComment = relatedComments.find((comment) => {
    const { hasAnyRoles } = useRuleChecks(comment.user.id)
    return hasAnyRoles('teamMember', 'feedbackMember').value
  })

  if (authorComment)
    comments.push(normalizeComment(authorComment))
  if (officialComment)
    comments.push(normalizeComment(officialComment))

  // 根据 comment.id 去重
  const uniqueComments = Array.from(
    new Map(comments.map(comment => [comment.id, comment])).values(),
  )

  return uniqueComments.length > 0 ? uniqueComments : null
}
