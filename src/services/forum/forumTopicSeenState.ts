import type ForumAPI from '@/apis/forum/api'

const TOPIC_SEEN_KEY = 'forum:topic-seen-at:v1'
const TOPIC_SEEN_LIMIT = 500

type ForumSeenStorage = Pick<Storage, 'getItem' | 'setItem'>

export function readForumTopicSeenMap(storage: ForumSeenStorage): Map<string, number> {
  try {
    const value = JSON.parse(storage.getItem(TOPIC_SEEN_KEY) ?? '{}') as Record<string, unknown>
    const map = new Map<string, number>()
    for (const [topicId, seenAt] of Object.entries(value)) {
      if (typeof seenAt === 'number' && Number.isFinite(seenAt) && seenAt > 0)
        map.set(topicId, seenAt)
    }
    return map
  }
  catch {
    return new Map()
  }
}

export function markForumTopicSeen(storage: ForumSeenStorage, topicId: string, now = Date.now()): Map<string, number> {
  const map = readForumTopicSeenMap(storage)
  map.set(topicId, now)
  if (map.size > TOPIC_SEEN_LIMIT) {
    const entries = [...map]
    entries.sort((a, b) => a[1] - b[1])
    for (const [id] of entries.slice(0, map.size - TOPIC_SEEN_LIMIT))
      map.delete(id)
  }
  storage.setItem(TOPIC_SEEN_KEY, JSON.stringify(Object.fromEntries(map)))
  return map
}

export function isClosedUnseen(topic: { state?: ForumAPI.TopicState, closedAt?: string }, seenAt: number): boolean {
  if (topic.state !== 'closed')
    return false
  if (!topic.closedAt)
    return true
  const closedAt = Date.parse(topic.closedAt)
  return Number.isNaN(closedAt) ? true : closedAt > seenAt
}
