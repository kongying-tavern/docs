import type ForumAPI from '@/apis/forum/api'
import { TOPIC_STATUS_DEFINITIONS } from './forumTopicStatus'

export type ForumSearchState = ForumAPI.TopicDisplayStatus | 'good-issue'
export type ForumSearchFacet = 'tags' | 'state' | 'author'

export interface ForumSearchQuery {
  text: string
  tags: string[]
  states: ForumSearchState[]
  author: string | null
}

const SEARCH_TOKEN_REGEX = /(?:^|\s)(tags|state|author):(\S+)/giu
const MULTIPLE_WHITESPACE_REGEX = /\s+/gu
export const FORUM_SEARCH_STATES: readonly ForumSearchState[] = [
  ...TOPIC_STATUS_DEFINITIONS.map(definition => definition.id),
  'closed',
  'good-issue',
]
const searchStates = new Set<ForumSearchState>(FORUM_SEARCH_STATES)

export function getForumSearchStateGroup(state: ForumSearchState): string {
  if (state === 'closed')
    return 'resolution'
  if (state === 'good-issue')
    return 'maintenance'
  return TOPIC_STATUS_DEFINITIONS.find(definition => definition.id === state)?.group ?? 'maintenance'
}

export function parseForumSearchQuery(value: string): ForumSearchQuery {
  const tags: string[] = []
  const states: ForumSearchState[] = []
  let author: string | null = null
  const text = value.replace(SEARCH_TOKEN_REGEX, (_match, facet: ForumSearchFacet, rawValues: string) => {
    const values = rawValues.split(',').map(value => value.trim()).filter(Boolean)
    if (facet.toLocaleLowerCase() === 'tags')
      tags.push(...values)
    else if (facet.toLocaleLowerCase() === 'state')
      states.push(...values.filter(isForumSearchState))
    else
      author = values[0] ?? null
    return ' '
  }).trim().replace(MULTIPLE_WHITESPACE_REGEX, ' ')

  return {
    text,
    tags: unique(tags),
    states: unique(states),
    author,
  }
}

export function stringifyForumSearchQuery(query: ForumSearchQuery): string {
  return [
    query.tags.length ? `tags:${unique(query.tags).join(',')}` : '',
    query.states.length ? `state:${unique(query.states).join(',')}` : '',
    query.author ? `author:${query.author.trim()}` : '',
    query.text.trim().replace(MULTIPLE_WHITESPACE_REGEX, ' '),
  ].filter(Boolean).join(' ')
}

export function appendForumSearchFacet(
  value: string,
  facet: ForumSearchFacet,
  facetValue: string,
): string {
  const query = parseForumSearchQuery(value)
  if (facet === 'tags')
    query.tags = unique([...query.tags, facetValue])
  else if (facet === 'state')
    query.states = unique([...query.states, facetValue as ForumSearchState])
  else
    query.author = facetValue.trim() || null
  return stringifyForumSearchQuery(query)
}

export function removeForumSearchFacet(value: string, facet: ForumSearchFacet): string {
  const query = parseForumSearchQuery(value)
  if (facet === 'tags')
    query.tags = []
  else if (facet === 'state')
    query.states = []
  else
    query.author = null
  return stringifyForumSearchQuery(query)
}

export function toggleForumSearchFacet(
  value: string,
  facet: ForumSearchFacet,
  facetValue: string,
): string {
  const query = parseForumSearchQuery(value)
  if (facet === 'tags') {
    query.tags = toggleValue(query.tags, facetValue)
  }
  else if (facet === 'state') {
    if (!isForumSearchState(facetValue))
      return stringifyForumSearchQuery(query)
    query.states = toggleValue(query.states, facetValue)
  }
  else {
    const author = facetValue.trim()
    query.author = query.author?.toLocaleLowerCase() === author.toLocaleLowerCase() ? null : author || null
  }
  return stringifyForumSearchQuery(query)
}

function unique<T>(values: readonly T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index)
}

function toggleValue<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value]
}

function isForumSearchState(value: string): value is ForumSearchState {
  return searchStates.has(value as ForumSearchState)
}
