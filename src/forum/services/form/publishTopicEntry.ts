type TopicType = 'BUG' | 'FEAT' | 'ANN'

/** A generic entry needs a choice; an explicit entry must respect publishing permissions. */
export function resolvePublishTopicType(hash: string, allowed: readonly TopicType[], quotedType?: TopicType): TopicType | undefined {
  const requested = quotedType ?? hash.split('-').at(-1)
  return allowed.find(type => type === requested)
}
