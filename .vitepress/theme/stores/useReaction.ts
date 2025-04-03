import type { INTER_KNOT } from '@/apis/inter-knot.site/api'
import { reactions } from '@/apis/inter-knot.site'
import { defineStore } from 'pinia'
import { useRoute } from 'vitepress'
import { computed, ref, watch } from 'vue'
import { useRequest } from 'vue-request'
import { useUserInfoStore } from './useUserInfo'

export const useReactionStore = defineStore('reaction', () => {
  const userInfo = useUserInfoStore()
  const currentPageReactionState = ref<INTER_KNOT.ReactionResponse['data']['reaction'] | null>(null)
  const { data, runAsync: updateReaction, loading, error, cancel, mutate } = useRequest<INTER_KNOT.ReactionResponse | null>(reactions.getPageReaction, {
    manual: true,
  })
  const { runAsync: setReaction, data: setReactionResponse, loading: reactionSubmitLoading, error: reactionSubmitError } = useRequest<INTER_KNOT.ReactionResponse | null>(reactions.setPageReaction, {
    manual: true,
  })

  const route = useRoute()

  const reactionState = ref<INTER_KNOT.ReactionState | null>(null)

  const revokeReaction = async () => {
    if (reactionState.value === null || currentPageReactionState.value === null)
      return
    if (reactionState.value === 'like')
      currentPageReactionState.value.likeCount = Math.max(currentPageReactionState.value.likeCount - 1, 0)
    if (reactionState.value === 'dislike')
      currentPageReactionState.value.dislikeCount = Math.max(currentPageReactionState.value.dislikeCount - 1, 0)
    reactionState.value = null
    await setReaction('revoke', { ...(userInfo.info?.id ? { userId: userInfo.info?.id } : {}) })
  }

  const setReactionState = async (state: INTER_KNOT.ReactionState, revoke = true) => {
    if (revoke && reactionState.value === state) {
      await revokeReaction()
      return
    }

    if (!currentPageReactionState.value)
      return
    if (state === 'like') {
      currentPageReactionState.value.likeCount = currentPageReactionState.value.likeCount + 1
      if (reactionState.value !== null)
        currentPageReactionState.value.dislikeCount = Math.max(currentPageReactionState.value.dislikeCount - 1, 0)
    }
    if (state === 'dislike') {
      currentPageReactionState.value.dislikeCount = currentPageReactionState.value.dislikeCount + 1
      if (reactionState.value !== null)
        currentPageReactionState.value.likeCount = Math.max(currentPageReactionState.value.likeCount - 1, 0)
    }

    reactionState.value = state
    return await setReaction(state, { ...(userInfo.info?.id ? { userId: userInfo.info?.id } : {}) })
  }

  const toggleReaction = async (defaultState: INTER_KNOT.ReactionState = 'like') => {
    const state = reactionState.value ? (reactionState.value === 'like' ? 'dislike' : 'like') : defaultState
    return await setReactionState(state)
  }

  const isSetReactionSuccess = computed(() => setReactionResponse.value?.statusCode === 200)

  watch(
    () => route.path,
    async () => {
      if (import.meta.env.SSR)
        return
      if (loading.value)
        cancel()
      mutate(null)
      await updateReaction({ ...(userInfo.info?.id ? { userId: userInfo.info?.id } : {}) })
    },
    {
      immediate: true,
    },
  )

  watch(data, (val) => {
    if (val?.data.reaction)
      currentPageReactionState.value = val.data.reaction
    if (val?.data.state) {
      reactionState.value = val.data.state
    }
    else {
      reactionState.value = null
    }
  })

  return {
    data,
    loading,
    error,
    reactionState,
    currentPageReactionState,
    reactionSubmitLoading,
    reactionSubmitError,
    setReactionResponse,
    isSetReactionSuccess,
    revokeReaction,
    toggleReaction,
    setReactionState,
  }
})
