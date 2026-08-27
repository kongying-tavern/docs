import type { MaybeRefOrGetter } from 'vue'
import type { INTER_KNOT } from '@/apis/interknot.site/api'
import type { TopicReaction } from '~/services/forum/forumReaction'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { computed, reactive, toValue } from 'vue'
import { toast } from 'vue-sonner'
import { reactions } from '@/apis/interknot.site'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { forumKeys } from '~/services/forum/forumQueryContracts'
import {
  coordinateReactionMutation,
  normalizeReactionResponse,
  reactionCacheIdentity,
  reactionEnvironmentForOrigin,
  resolveReactionViewer,
  topicReactionResource,
} from '~/services/forum/forumReaction'

export type { TopicReaction } from '~/services/forum/forumReaction'

const pendingReactionKeys = reactive(new Set<string>())

export function useTopicsReaction(
  topicId: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const userAuth = useUserAuthStore()
  const userInfo = useUserInfoStore()
  const queryCache = useQueryCache()
  const { message } = useLocalized()
  const resourceUrl = computed(() => topicReactionResource(
    toValue(topicId),
    reactionEnvironmentForOrigin(import.meta.env.SSR ? 'http://reaction.invalid' : location.origin),
  ))
  const viewer = computed(() => resolveReactionViewer(userAuth.isLoggedIn, userInfo.info?.id))
  const userId = computed(() => viewer.value.userId)
  const viewerIdentity = computed(() => viewer.value.identity)
  const queryKey = computed(() => forumKeys.reaction(resourceUrl.value, viewerIdentity.value))
  const pendingKey = computed(() => reactionCacheIdentity(resourceUrl.value, viewerIdentity.value))

  const query = useQuery<TopicReaction>({
    key: () => queryKey.value,
    enabled: () => !import.meta.env.SSR && viewer.value.ready && Boolean(toValue(topicId)) && toValue(enabled),
    staleTime: 60_000,
    query: async () => {
      const response = await reactions.getPageReaction({
        url: resourceUrl.value,
        ...(userId.value ? { userId: userId.value } : {}),
      })
      if (!response || response.statusCode !== 200)
        throw new Error('Reaction response was empty.')
      return normalizeReactionResponse(response, resourceUrl.value)
    },
  })

  const mutation = useMutation({
    mutation: (input: { action: INTER_KNOT.ReactionState | 'revoke', url: string, userId?: string }) =>
      reactions.setPageReaction(input.action, {
        url: input.url,
        ...(input.userId ? { userId: input.userId } : {}),
      }),
  })

  async function setReactionState(requested: INTER_KNOT.ReactionState): Promise<boolean> {
    const key = queryKey.value
    const resource = resourceUrl.value
    const mutationUserId = userId.value
    queryCache.cancelQueries({ key, exact: true })
    const current = queryCache.getQueryData<TopicReaction>(key)
    if (!current)
      return false

    try {
      return await coordinateReactionMutation({
        pending: pendingReactionKeys,
        key: reactionCacheIdentity(resource, viewerIdentity.value),
        current,
        requested,
        update: value => queryCache.setQueryData(key, value),
        write: async (action) => {
          const response = await mutation.mutateAsync({
            action,
            url: resource,
            userId: mutationUserId,
          })
          if (response?.statusCode !== 200)
            throw new Error('Reaction request was not acknowledged.')
        },
      })
    }
    catch {
      toast.info(message.value.forum.errors.operationFailedRetry)
      return false
    }
  }

  return {
    ...query,
    resourceUrl,
    viewerIdentity,
    viewerReady: computed(() => viewer.value.ready),
    setReactionState,
    reactionSubmitLoading: computed(() => pendingReactionKeys.has(pendingKey.value)),
  }
}
