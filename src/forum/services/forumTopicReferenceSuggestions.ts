import type ForumAPI from '~/forum/api/types'
import { TOPIC_ID_REGEX } from './forumTopicQuote'

const HASH_PREFIX_REGEX = /^#/

/** Prefer exact IDs and prefixes; references do not search the body of a topic. */
export function getTopicReferenceSuggestions(topics: readonly ForumAPI.Topic[], query: string): ForumAPI.Topic[] {
  const normalized = query.trim().replace(HASH_PREFIX_REGEX, '').toUpperCase()
  return Array.from(new Map(topics.map(topic => [String(topic.id).toUpperCase(), topic])).values(), topic => ({
    topic,
    rank: !normalized
      ? 0
      : String(topic.id).toUpperCase() === normalized
        ? 0
        : String(topic.id).toUpperCase().startsWith(normalized)
          ? 1
          : topic.title.toUpperCase().includes(normalized) ? 2 : -1,
  }))
    .filter(item => item.rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
    .map(item => item.topic)
}

export function normalizeTopicReferenceId(query: string): string | undefined {
  const id = query.trim().replace(HASH_PREFIX_REGEX, '').toUpperCase()
  return TOPIC_ID_REGEX.test(id) ? id : undefined
}
