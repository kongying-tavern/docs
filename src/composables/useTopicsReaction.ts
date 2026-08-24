import type { INTER_KNOT } from '@/apis/interknot.site/api'
import { useMutation } from '@pinia/colada'
import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { reactions } from '@/apis/interknot.site'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useForumRoute } from '~/composables/useForumRoute'

export interface TopicReaction {
  id: string
  data: INTER_KNOT.ReactionResponse['data']['reaction']
  state: INTER_KNOT.ReactionState | null
}

export const useTopicsReaction = createGlobalState(() => {
  const topicReactions = ref<TopicReaction[]>([])
  const userInfo = useUserInfoStore()
  const { message } = useLocalized()
  const { topicHref } = useForumRoute()

  const mutation = useMutation<
    INTER_KNOT.ReactionResponse | null,
    { state: INTER_KNOT.ReactionState | 'revoke', options: { url: string, userId?: string } }
  >({
    mutation: ({ state, options }) => reactions.setPageReaction(state, options),
  })

  function getTopicUrl(topicId: string) {
    return new URL(topicHref(topicId, null), location.origin).href
  }

  function findTopicReaction(topicId: string) {
    return topicReactions.value.find(item => item.id === topicId) ?? null
  }

  async function getTopicReaction(topicId: string, force = false): Promise<TopicReaction | null> {
    const cached = findTopicReaction(topicId)
    if (cached && !force)
      return cached

    const response = await reactions.getPageReaction({
      url: getTopicUrl(topicId),
      ...(userInfo.info?.id ? { userId: String(userInfo.info.id) } : {}),
    })
    if (!response)
      return null

    const next: TopicReaction = {
      id: topicId,
      data: response.data.reaction,
      state: response.data.state,
    }
    const index = topicReactions.value.findIndex(item => item.id === topicId)
    if (index === -1)
      topicReactions.value.push(next)
    else
      topicReactions.value[index] = next
    return topicReactions.value[index === -1 ? topicReactions.value.length - 1 : index]
  }

  async function setReactionState(state: INTER_KNOT.ReactionState, topicId: string): Promise<TopicReaction | null> {
    const reaction = await getTopicReaction(topicId)
    if (!reaction) {
      toast.error(message.value.forum.errors.noResponse)
      return null
    }

    const previous = {
      state: reaction.state,
      likeCount: reaction.data.likeCount,
      dislikeCount: reaction.data.dislikeCount,
    }
    const nextState = reaction.state === state ? 'revoke' : state

    if (previous.state === 'like')
      reaction.data.likeCount = Math.max(reaction.data.likeCount - 1, 0)
    if (previous.state === 'dislike')
      reaction.data.dislikeCount = Math.max(reaction.data.dislikeCount - 1, 0)
    if (nextState === 'like')
      reaction.data.likeCount += 1
    if (nextState === 'dislike')
      reaction.data.dislikeCount += 1
    reaction.state = nextState === 'revoke' ? null : nextState

    try {
      const response = await mutation.mutateAsync({
        state: nextState,
        options: {
          url: getTopicUrl(topicId),
          ...(userInfo.info?.id ? { userId: String(userInfo.info.id) } : {}),
        },
      })
      if (!response)
        throw new Error('Reaction response was empty.')
      reaction.data = response.data.reaction
      reaction.state = response.data.state
      return reaction
    }
    catch {
      reaction.state = previous.state
      reaction.data.likeCount = previous.likeCount
      reaction.data.dislikeCount = previous.dislikeCount
      toast.info(message.value.forum.errors.operationFailedRetry)
      return null
    }
  }

  return {
    getTopicReaction,
    setReactionState,
    reactionSubmitLoading: mutation.isLoading,
    reactionSubmitError: mutation.error,
  }
})
