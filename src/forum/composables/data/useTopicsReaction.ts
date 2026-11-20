import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useForumReaction, useForumReactionState } from './useForumReaction.ts'

export type { TopicReaction } from '@/src/forum/services/forumReaction.ts'

export function useTopicsReaction(
  topicId: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean> = true,
  options: { refetchOnMount?: 'always' | boolean } = {},
) {
  return useForumReaction(() => ({ topicId: toValue(topicId) }), enabled, options)
}

export function useTopicReactionState(topicId: MaybeRefOrGetter<string>) {
  return useForumReactionState(() => ({ topicId: toValue(topicId) }))
}
