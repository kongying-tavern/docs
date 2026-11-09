import { decodeForumText } from '../forumContentCodec'

type TopicType = 'BUG' | 'FEAT' | 'ANN'

export function buildPublishedTopicTitle(type: TopicType, title: string, text: string): string {
  return `${type}:${title.length === 0 ? `${decodeForumText(text).text.trim().substring(0, 12)}...` : title}`
}

/** A generic entry needs a choice; an explicit entry must respect publishing permissions. */
export function resolvePublishTopicType(hash: string, allowed: readonly TopicType[], quotedType?: TopicType): TopicType | undefined {
  const requested = quotedType ?? hash.split('-').at(-1)
  return allowed.find(type => type === requested)
}
