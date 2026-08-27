import type ForumAPI from '@/apis/forum/api'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { createGlobalState } from '@vueuse/core'
import { computed } from 'vue'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import {
  emptyForumPersonalState,
  recordParticipation as recordParticipationState,
  removeFollowedTopic,
  summarizePersonalTopic,
  toggleFollowedTopic,
} from '~/services/forum/forumPersonalState'
import { loadForumPersonalState, updateForumPersonalState } from '~/services/forum/forumPersonalStateRepository'
import { forumKeys } from '~/services/forum/forumQueryContracts'

export const useForumPersonalState = createGlobalState(() => {
  const auth = useUserAuthStore()
  const userInfo = useUserInfoStore()
  const queryCache = useQueryCache()
  const userId = computed(() => String(userInfo.info?.id ?? ''))
  const enabled = computed(() => auth.isTokenValid && Boolean(userId.value))

  const query = useQuery({
    key: () => forumKeys.personalState(userId.value),
    enabled: () => enabled.value,
    query: () => loadForumPersonalState(userId.value),
    staleTime: 5 * 60_000,
  })

  const mutation = useMutation({
    mutation: (input: { topic: ForumAPI.Topic, kind: 'follow' | 'participation' } | { topicId: string | number, kind: 'unfollow' }) =>
      updateForumPersonalState(userId.value, (state) => {
        if (input.kind === 'unfollow')
          return removeFollowedTopic(state, input.topicId)

        const topic = summarizePersonalTopic(input.topic)
        return input.kind === 'follow'
          ? toggleFollowedTopic(state, topic)
          : recordParticipationState(state, topic)
      }),
  })

  const state = computed(() => query.data.value ?? emptyForumPersonalState())

  async function mutate(topic: ForumAPI.Topic, kind: 'follow' | 'participation'): Promise<void> {
    if (!enabled.value) {
      location.hash = 'login-alert'
      return
    }
    const next = await mutation.mutateAsync({ topic, kind })
    queryCache.setQueryData(forumKeys.personalState(userId.value), next)
  }

  async function unfollow(topicId: string | number): Promise<void> {
    if (!enabled.value)
      return
    const next = await mutation.mutateAsync({ topicId, kind: 'unfollow' })
    queryCache.setQueryData(forumKeys.personalState(userId.value), next)
  }

  return {
    state,
    loading: query.isLoading,
    error: query.error,
    saving: mutation.isLoading,
    isFollowing: (topicId: string | number) => state.value.followedTopics.some(item => item.topicId === String(topicId)),
    toggleFollow: (topic: ForumAPI.Topic) => mutate(topic, 'follow'),
    unfollow,
    recordParticipation: (topic: ForumAPI.Topic) => mutate(topic, 'participation'),
    refetch: query.refetch,
  }
})
