import type { INTER_KNOT } from '@/apis/interknot.site/api'
import { useMutation, useQuery } from '@pinia/colada'
import { defineStore } from 'pinia'
import { useRoute } from 'vitepress'
import { computed, ref, watch } from 'vue'
import { reactions } from '@/apis/interknot.site'
import { useUserInfoStore } from './useUserInfo'

export const useReactionStore = defineStore('reaction', () => {
  const userInfo = useUserInfoStore()
  const currentPageReactionState = ref<INTER_KNOT.ReactionResponse['data']['reaction'] | null>(null)

  const route = useRoute()
  const reactionState = ref<INTER_KNOT.ReactionState | null>(null)

  // 获取页面反应 - useQuery
  const {
    data,
    isLoading: loading,
    error,
    refetch: updateReaction,
  } = useQuery({
    key: () => ['reaction', route.path] as const,
    query: () => reactions.getPageReaction({
      url: route.path, // 添加 url 参数
      ...(userInfo.info?.id ? { userId: String(userInfo.info?.id) } : {}),
    }),
    enabled: () => !import.meta.env.SSR,
    staleTime: 1000 * 60 * 5, // 5分钟内不重新请求
  })

  // 设置反应 - useMutation
  const {
    mutate: setReaction,
    data: setReactionResponse,
    isLoading: reactionSubmitLoading,
    error: reactionSubmitError,
  } = useMutation({
    mutation: (params: { state: INTER_KNOT.ReactionState | 'revoke', options: { userId?: string } }) =>
      reactions.setPageReaction(params.state, params.options),
  })

  const revokeReaction = async () => {
    if (reactionState.value === null || currentPageReactionState.value === null)
      return
    if (reactionState.value === 'like')
      currentPageReactionState.value.likeCount = Math.max(currentPageReactionState.value.likeCount - 1, 0)
    if (reactionState.value === 'dislike')
      currentPageReactionState.value.dislikeCount = Math.max(currentPageReactionState.value.dislikeCount - 1, 0)
    reactionState.value = null
    await setReaction({
      state: 'revoke',
      options: { ...(userInfo.info?.id ? { userId: String(userInfo.info?.id) } : {}) },
    })
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
    return await setReaction({
      state,
      options: { ...(userInfo.info?.id ? { userId: String(userInfo.info?.id) } : {}) },
    })
  }

  const toggleReaction = async (defaultState: INTER_KNOT.ReactionState = 'like') => {
    const state = reactionState.value ? (reactionState.value === 'like' ? 'dislike' : 'like') : defaultState
    return await setReactionState(state)
  }

  const isSetReactionSuccess = computed(() => setReactionResponse.value?.statusCode === 200)

  watch(data, (val) => {
    if (val?.data.reaction)
      currentPageReactionState.value = val.data.reaction
    if (val?.data.state) {
      reactionState.value = val.data.state
    }
    else {
      reactionState.value = null
    }
  }, { immediate: true })

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
    updateReaction,
  }
})
