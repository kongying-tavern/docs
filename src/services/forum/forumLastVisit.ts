import type ForumAPI from '@/apis/forum/api'

const LAST_VISIT_KEY = 'forum:last-visited-at:v1'
const PREVIOUS_VISIT_KEY = 'forum:previous-visit-at:v1'

type ForumVisitStorage = Pick<Storage, 'getItem' | 'setItem'>

export function beginForumVisit(now = Date.now()): number | null {
  if (typeof window === 'undefined')
    return null

  try {
    return beginForumVisitWithStorage(localStorage, sessionStorage, now)
  }
  catch {
    return null
  }
}

export function beginForumVisitWithStorage(
  persistentStorage: ForumVisitStorage,
  sessionStorage: ForumVisitStorage,
  now: number,
): number | null {
  const sessionValue = sessionStorage.getItem(PREVIOUS_VISIT_KEY)
  if (sessionValue !== null)
    return parseTimestamp(sessionValue)

  const previousVisitAt = parseTimestamp(persistentStorage.getItem(LAST_VISIT_KEY))
  sessionStorage.setItem(PREVIOUS_VISIT_KEY, String(previousVisitAt ?? 0))
  persistentStorage.setItem(LAST_VISIT_KEY, String(now))
  return previousVisitAt
}

export function findLastVisitedDividerIndex(
  topics: readonly ForumAPI.Topic[],
  previousVisitAt: number | null,
  sort: ForumAPI.SortMethod,
): number {
  if (!previousVisitAt || topics.length < 2)
    return -1

  const dateKey = sort === 'updated' ? 'updatedAt' : 'createdAt'
  let hasNewerTopic = false

  for (let index = 0; index < topics.length; index++) {
    const topic = topics[index]
    if (topic.pinned && !hasNewerTopic)
      continue

    const timestamp = Date.parse(topic[dateKey])
    if (!Number.isFinite(timestamp))
      continue
    if (timestamp > previousVisitAt) {
      hasNewerTopic = true
      continue
    }
    if (hasNewerTopic)
      return index
  }

  return -1
}

function parseTimestamp(value: string | null): number | null {
  const timestamp = Number(value)
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null
}
