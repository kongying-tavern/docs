import type { ForumSearchQuery } from './forumSearchQuery'
import { parseForumSearchQuery, stringifyForumSearchQuery } from './forumSearchQuery'

/** 编辑框的过滤徽标被清除时，普通关键词仍留在查询中。 */
export function clearStructuredSearchFilters(value: string): string {
  return stringifyForumSearchQuery({ ...parseForumSearchQuery(value), tags: [], states: [], author: null })
}

/** 在关键词输入中输入过滤前缀时，将解析出的条件并入已有查询。 */
export function mergeTypedSearchFacet(
  value: string,
  typed: Pick<ForumSearchQuery, 'tags' | 'states' | 'author'>,
): string {
  const current = parseForumSearchQuery(value)
  return stringifyForumSearchQuery({
    text: '',
    tags: [...new Set([...current.tags, ...typed.tags])],
    states: [...new Set([...current.states, ...typed.states])],
    author: typed.author ?? current.author,
  })
}
