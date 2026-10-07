import type ForumAPI from '~/forum/api/types'
import { isArray } from 'lodash-es'
import BlogRepoMember from '../../_data/blogMemberList.json' with { type: 'json' }
import TeamMember from '../../_data/teamMemberList.json' with { type: 'json' }

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
    const foundAuthor = [...TeamMember.data, ...BlogRepoMember.data].find(member =>
      member.id === authorId || member.login === authorId || member.username === authorId,
    )
    if (foundAuthor) {
      postAuthors.push(foundAuthor)
    }
  }

  return postAuthors
}
