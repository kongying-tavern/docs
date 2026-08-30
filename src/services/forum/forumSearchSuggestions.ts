import type ForumAPI from '@/apis/forum/api'

interface ForumSearchSuggestion {
  topic: ForumAPI.Topic
  excerpt: string
}

const WHITESPACE_REGEX = /\s+/g

function excerptAround(text: string, query: string) {
  const normalized = text.replace(WHITESPACE_REGEX, ' ').trim()
  const match = normalized.toLocaleLowerCase().indexOf(query)
  const start = Math.max(0, match < 0 ? 0 : match - 18)
  const end = Math.min(normalized.length, start + 72)

  return `${start > 0 ? '…' : ''}${normalized.slice(start, end)}${end < normalized.length ? '…' : ''}`
}

export function getForumSearchSuggestions(topics: ForumAPI.Topic[], value: string): ForumSearchSuggestion[] {
  const query = value.trim().toLocaleLowerCase()
  if (!query)
    return []

  return topics
    .map((topic) => {
      const idMatches = String(topic.id).toLocaleLowerCase().includes(query)
      const titleMatches = topic.title.toLocaleLowerCase().includes(query)
      const contentMatches = topic.content.text.toLocaleLowerCase().includes(query)
      return {
        topic,
        excerpt: excerptAround(topic.content.text, query),
        rank: idMatches ? 0 : titleMatches ? 1 : contentMatches ? 2 : -1,
      }
    })
    .filter(suggestion => suggestion.rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
}
