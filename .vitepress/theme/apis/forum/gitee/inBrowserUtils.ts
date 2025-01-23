import { useUserInfoStore } from '@/stores/useUserInfo'
import type ForumAPI from '../api'
import { normalizeComment } from './utils'

export function extractOfficialAndAuthorComments(
  issue: GITEE.IssueInfo,
  commentList: GITEE.CommentList,
): ForumAPI.Comment[] | null {
  const userInfoStore = useUserInfoStore()

  const comments: ForumAPI.Comment[] = []
  const relatedComments = commentList.filter(
    (comment) => comment.target.issue.id === issue.id,
  )
  // 查找作者的评论
  const authorComment = relatedComments.find(
    (comment) => comment.user.id === issue.user.id,
  )
  // 查找官方团队的评论
  const officialComment = relatedComments.find((comment) =>
    userInfoStore.isTeamMember(comment.user.id),
  )

  if (authorComment) comments.push(normalizeComment(authorComment))
  if (officialComment) comments.push(normalizeComment(officialComment))

  return comments.length > 0 ? comments : null
}
