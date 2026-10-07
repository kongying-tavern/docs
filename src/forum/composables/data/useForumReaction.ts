import type { MaybeRefOrGetter } from 'vue'
import type { INTER_KNOT } from '~/apis/interknot.site/api'
import type { TopicReaction } from '~/forum/services/forumReaction'
import { useMutation, useQuery, useQueryCache, useQueryState } from '@pinia/colada'
import { withBase } from 'vitepress'
import { computed, reactive, ref, toValue } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { reactions } from '~/apis/interknot.site'
import { forumKeys } from '~/forum/services/forumQueryContracts'
import {
  coordinateReactionMutation,
  forumReactionResource,
  normalizeReactionResponse,
  pageReactionResource,
  quoteReactionResource,
  reactionCacheIdentity,
  reactionEnvironmentForOrigin,
  resolveReactionViewer,
} from '~/forum/services/forumReaction'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { OpsEvents, trackOp } from '~/services/telemetry'
import { toast } from '~/services/telemetry/toast'

export type { TopicReaction } from '~/forum/services/forumReaction'

const pendingReactionKeys = reactive(new Set<string>())

export type ForumReactionTarget
  = | { topicId: string, commentId?: string, kind?: never }
    | { topicId: string, kind: 'quote', commentId?: never }
    | { kind: 'page', path: string }

function useForumReactionContext(target: MaybeRefOrGetter<ForumReactionTarget>) {
  const userAuth = useUserAuthStore()
  const userInfo = useUserInfoStore()
  const resourceUrl = computed(() => {
    const current = toValue(target)
    if (current.kind === 'page')
      return pageReactionResource(withBase(current.path))
    const environment = reactionEnvironmentForOrigin(import.meta.env.SSR ? 'http://reaction.invalid' : location.origin)
    return current.kind === 'quote'
      ? quoteReactionResource(current.topicId, environment)
      : forumReactionResource(current.topicId, environment, current.commentId)
  })
  const viewer = computed(() => resolveReactionViewer(userAuth.isLoggedIn, userInfo.info?.id))
  const userId = computed(() => viewer.value.userId)
  const viewerIdentity = computed(() => viewer.value.identity)
  const queryKey = computed(() => forumKeys.reaction(resourceUrl.value, viewerIdentity.value))
  const pendingKey = computed(() => reactionCacheIdentity(resourceUrl.value, viewerIdentity.value))

  return { resourceUrl, viewer, userId, viewerIdentity, queryKey, pendingKey }
}

export function useForumReaction(
  target: MaybeRefOrGetter<ForumReactionTarget>,
  enabled: MaybeRefOrGetter<boolean> = true,
  options: { refetchOnMount?: 'always' | boolean } = {},
) {
  const queryCache = useQueryCache()
  const { message } = useLocalized()
  const { resourceUrl, viewer, userId, viewerIdentity, queryKey, pendingKey } = useForumReactionContext(target)

  const lastResult = ref<'success' | 'error' | null>(null)

  const query = useQuery<TopicReaction>({
    key: () => queryKey.value,
    enabled: () => {
      const current = toValue(target)
      const hasResource = current.kind === 'page' ? current.path.length > 0 : Boolean(current.topicId)
      return !import.meta.env.SSR && viewer.value.ready && hasResource && toValue(enabled)
    },
    staleTime: 60_000,
    refetchOnMount: options.refetchOnMount,
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
      const acked = await coordinateReactionMutation({
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
          // 服务端返回权威计数（含 clickCount），覆盖乐观估算值以免数据漂移
          if (response.data?.reaction)
            queryCache.setQueryData(key, normalizeReactionResponse(response, resource))
        },
      })
      if (acked)
        trackOp(OpsEvents.reactionToggle)
      lastResult.value = acked ? 'success' : null
      return acked
    }
    catch (error) {
      lastResult.value = 'error'
      toast.error(message.value.forum.errors.operationFailedRetry, { error, scene: 'rc' })
      return false
    }
  }

  return {
    ...query,
    resourceUrl,
    viewerIdentity,
    viewerReady: computed(() => viewer.value.ready),
    reactionState: computed(() => query.data.value?.state ?? null),
    lastResult,
    setReactionState,
    reactionSubmitLoading: computed(() => pendingReactionKeys.has(pendingKey.value)),
  }
}

/**
 * 只读访问某个话题 reaction 查询的缓存状态而不触发请求，
 * 供菜单项按 "该话题 reaction 请求已处于错误态" 进行显隐判断。
 */
export function useForumReactionState(target: MaybeRefOrGetter<ForumReactionTarget>) {
  const { queryKey } = useForumReactionContext(target)
  return useQueryState<TopicReaction>(queryKey)
}
