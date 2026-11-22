import type ForumAPI from '@/src/forum/api/types.d.ts'
import type { ForumPersonalStateRecovery } from '@/src/forum/services/forumPersonalStateRepository.ts'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { createGlobalState } from '@vueuse/core'
import { computed } from 'vue'
import {
  emptyForumPersonalState,
  recordParticipation as recordParticipationState,
  removeFollowedTopic,
  setFollowedTopic,
  summarizePersonalTopic,
} from '@/src/forum/services/forumPersonalState.ts'
import { loadForumPersonalState, recoverForumPersonalState, updateForumPersonalState } from '@/src/forum/services/forumPersonalStateRepository.ts'
import { forumKeys } from '@/src/forum/services/forumQueryContracts.ts'
import { useUserAuthStore } from '@/src/forum/stores/auth/useUserAuth.ts'
import { useUserInfoStore } from '@/src/forum/stores/auth/useUserInfo.ts'

export const useForumPersonalState = createGlobalState(() => {
  const auth = useUserAuthStore()
  const userInfo = useUserInfoStore()
  const queryCache = useQueryCache()
  const userId = computed(() => String(userInfo.info?.id ?? ''))
  const enabled = computed(() => auth.isTokenValid && Boolean(userId.value))

  function operationContext() {
    const id = userId.value
    const generation = auth.getSessionGeneration()
    return {
      userId: id,
      expectedSessionGeneration: generation,
      assertCurrent: () => {
        if (!enabled.value || userId.value !== id || auth.getSessionGeneration() !== generation)
          throw new Error('Forum personal state session changed.')
      },
    }
  }

  type Operation = { topic: ForumAPI.Topic, kind: 'follow', followed: boolean }
    | { topic: ForumAPI.Topic, kind: 'participation' }
    | { topicId: string | number, kind: 'unfollow' }

  const query = useQuery({
    key: () => forumKeys.personalState(userId.value),
    enabled: () => enabled.value,
    query: () => loadForumPersonalState(userId.value, operationContext()),
    staleTime: 5 * 60_000,
  })

  const mutation = useMutation({
    mutation: ({ operation: input, context }: { operation: Operation, context: ReturnType<typeof operationContext> }) =>
      updateForumPersonalState(context.userId, (state) => {
        if (input.kind === 'unfollow')
          return removeFollowedTopic(state, input.topicId)

        const topic = summarizePersonalTopic(input.topic)
        return input.kind === 'follow'
          ? setFollowedTopic(state, topic, input.followed)
          : recordParticipationState(state, topic)
      }, context),
  })

  const state = computed(() => query.data.value ?? emptyForumPersonalState())
  const recovery = useMutation({
    mutation: ({ input, context }: { input: ForumPersonalStateRecovery, context: ReturnType<typeof operationContext> }) =>
      recoverForumPersonalState(context.userId, input, context),
  })

  async function recover(input: ForumPersonalStateRecovery): Promise<string> {
    const context = operationContext()
    context.assertCurrent()
    const result = await recovery.mutateAsync({ input, context })
    context.assertCurrent()
    queryCache.setQueryData(forumKeys.personalState(context.userId), result.state)
    return result.backupGistId
  }

  async function mutate(operation: Operation): Promise<void> {
    if (!enabled.value) {
      if (operation.kind !== 'unfollow')
        location.hash = 'login-alert'
      return
    }
    const context = operationContext()
    const next = await mutation.mutateAsync({ operation, context })
    context.assertCurrent()
    queryCache.setQueryData(forumKeys.personalState(context.userId), next)
  }

  return {
    state,
    loading: query.isLoading,
    error: query.error,
    saving: computed(() => mutation.isLoading.value || recovery.isLoading.value),
    recover,
    isFollowing: (topicId: string | number) => state.value.followedTopics.some(item => item.topicId === String(topicId)),
    toggleFollow: (topic: ForumAPI.Topic) => mutate({ topic, kind: 'follow', followed: !state.value.followedTopics.some(item => item.topicId === String(topic.id)) }),
    unfollow: (topicId: string | number) => mutate({ topicId, kind: 'unfollow' }),
    recordParticipation: (topic: ForumAPI.Topic) => mutate({ topic, kind: 'participation' }),
    refetch: query.refetch,
  }
})
