import type ForumAPI from '@/apis/forum/api'
import { isArray } from 'lodash-es'
import BlogRepoMember from '../_data/blogMemberList.json'
import TeamMember from '../_data/teamMemberList.json'

/**
 * 解析作者信息
 */
export function parseAuthors(frontmatter: Record<string, unknown>): ForumAPI.User[] {
  const authorData = frontmatter.authors || frontmatter.author
  if (!authorData)
    return []

  const authorIdentifiers = isArray(authorData) ? authorData : [authorData]
  const postAuthors: ForumAPI.User[] = []

  for (const authorId of authorIdentifiers) {
    const foundAuthor = [...TeamMember, ...BlogRepoMember].find(member =>
      member.id === authorId || member.login === authorId || member.username === authorId,
    )
    if (foundAuthor) {
      postAuthors.push(foundAuthor)
    }
  }

  return postAuthors
}
