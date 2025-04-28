import type { INTER_KNOT } from '@/apis/inter-knot.site/api'
import { reactions } from '@/apis/inter-knot.site'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { createGlobalState, useArrayFind, useDebounceFn } from '@vueuse/core'

import { withBase } from 'vitepress'
import { computed, ref } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'

export interface TopicReaction {
  id: string
  data: INTER_KNOT.ReactionResponse['data']['reaction']
  state: INTER_KNOT.ReactionState | null
}

export const useTopicsReaction = createGlobalState(() => {
  const useTopicsReaction = ref<TopicReaction[]>([])
  const userInfo = useUserInfoStore()
  const pendingRequests = ref<Set<string>>(new Set())
  const isUpdating = ref(false)

  const requestTopicReaction = async (
    topicId: string,
  ): Promise<INTER_KNOT.ReactionResponse | null> => {
    const data = await reactions.getPageReaction({
      url: getTopicUrl(topicId),
      ...(userInfo.info?.id ? { userId: String(userInfo.info?.id) } : {}),
    })

    if (!data)
      return null

    const targetTopicReactionIndex = useTopicsReaction.value.findIndex(
      val => val.id === topicId,
    )

    if (targetTopicReactionIndex !== -1) {
      useTopicsReaction.value[targetTopicReactionIndex].data
        = data.data.reaction
      useTopicsReaction.value[targetTopicReactionIndex].state = data.data.state
    }
    else {
      useTopicsReaction.value.push({
        id: topicId,
        data: data.data.reaction,
        state: data.data.state,
      })
    }

    return data
  }

  const {
    runAsync: setReaction,
    data: setReactionResponse,
    loading: reactionSubmitLoading,
    error: reactionSubmitError,
  } = useRequest<INTER_KNOT.ReactionResponse | null>(
    reactions.setPageReaction,
    {
      manual: true,
      onError: () => {
        toast.info('操作失败，请稍后重试')
      },
    },
  )

  const getTopicReaction = async (topicId: string, autoLoad = true) => {
    const result = useArrayFind(useTopicsReaction, val => val.id === topicId)
    if (result.value || !autoLoad)
      return result

    await requestTopicReaction(topicId)

    return result
  }

  const batchUpdateReactions = useDebounceFn(async () => {
    if (pendingRequests.value.size === 0 || isUpdating.value)
      return

    isUpdating.value = true
    const requests = Array.from(pendingRequests.value)
    pendingRequests.value.clear()

    try {
      await Promise.all(
        requests.map(async (topicId) => {
          await requestTopicReaction(getTopicUrl(topicId))
        }),
      )
    }
    finally {
      isUpdating.value = false
    }
  }, 300)

  const refreshTopicReaction = async (topicId: string) => {
    const result = await getTopicReaction(topicId, false)
    if (result.value)
      return result

    pendingRequests.value.add(topicId)
    await batchUpdateReactions()
    return result
  }

  const revokeReaction = async (topicId: string) => {
    const reactionState = await getTopicReaction(topicId)
    if (reactionState.value?.state !== null && !reactionState.value?.data) {
      toast.error('服务器无响应，请稍后重试')
      return
    }
    if (reactionState.value?.state === 'like') {
      reactionState.value.data.likeCount = Math.max(
        reactionState.value.data.likeCount - 1,
        0,
      )
    }
    if (reactionState.value?.state === 'dislike') {
      reactionState.value.data.dislikeCount = Math.max(
        reactionState.value.data.dislikeCount - 1,
        0,
      )
    }
    reactionState.value.state = null
    await setReaction('revoke', {
      url: getTopicUrl(topicId),
      ...(userInfo.info?.id ? { userId: userInfo.info?.id } : {}),
    })
  }

  const setReactionState = async (
    state: INTER_KNOT.ReactionState,
    topicId: string,
    revoke = true,
  ) => {
    const reactionState = await getTopicReaction(topicId)
    if (revoke && reactionState.value?.state === state) {
      await revokeReaction(topicId)
      return
    }
    if (!reactionState.value) {
      toast.error('无响应，请稍后重试')
      return
    }
    if (state === 'like') {
      reactionState.value.data.likeCount
        = reactionState.value.data.likeCount + 1
      if (reactionState.value !== null) {
        reactionState.value.data.dislikeCount = Math.max(
          reactionState.value.data.dislikeCount - 1,
          0,
        )
      }
    }
    if (state === 'dislike') {
      reactionState.value.data.dislikeCount
        = reactionState.value.data.dislikeCount + 1
      if (reactionState.value !== null) {
        reactionState.value.data.likeCount = Math.max(
          reactionState.value.data.likeCount - 1,
          0,
        )
      }
    }

    reactionState.value.state = state
    return await setReaction(state, {
      url: getTopicUrl(topicId),
      ...(userInfo.info?.id ? { userId: userInfo.info?.id } : {}),
    })
  }

  const toggleReaction = async (
    topicId: string,
    defaultState: INTER_KNOT.ReactionState = 'like',
  ) => {
    const reactionState = await getTopicReaction(topicId)
    if (!reactionState.value) {
      return
    }

    const state = reactionState.value?.state
      ? reactionState.value.state === 'like'
        ? 'dislike'
        : 'like'
      : defaultState
    return await setReactionState(state, topicId)
  }

  function getTopicUrl(topicId: string) {
    return `${location.host}${withBase(`/feedback/topic/${topicId}`)}`
  }

  const isSetReactionSuccess = computed(
    () => setReactionResponse.value?.statusCode === 200,
  )

  return {
    isSetReactionSuccess,
    getTopicReaction,
    setReactionState,
    toggleReaction,
    revokeReaction,
    reactionSubmitLoading,
    refreshTopicReaction,
    reactionSubmitError,
  }
})
