import type { UseInfiniteQueryData } from '@pinia/colada'
import type { TopicUpdateOutcome } from '~/forum/api/gitee/issues'
import type ForumAPI from '~/forum/api/types'
import type { ForumMutationKind, ForumPage, ForumTopicListParams } from '~/forum/services/queryContracts'
import { useMutation, useQueryCache } from '@pinia/colada'
import { issues } from '~/forum/api/gitee'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import {
  forumKeys,
  forumMutationPolicies,
  forumTopicBelongsToList,
  isForumTopicListParams,
  mapTopicInForumPages,
  prependTopicToForumPages,
  removeTopicFromForumPages,
  requiresAuthoritativeRefetch,
} from '~/forum/services/queryContracts'
import { applyOptimisticTopicPatch } from '~/forum/services/topicOptimistic'

type TopicPatch = Parameters<typeof issues.putTopic>[1]
const commentMutationQueues = new Map<string, Promise<unknown>>()

export async function serializeTopicCommentMutation<T>(topicId: string | number, task: () => Promise<T>): Promise<T> {
  const key = String(topicId)
  if (typeof navigator !== 'undefined' && navigator.locks)
    return navigator.locks.request(`forum-topic-comments:${key}`, task)

  const previous = commentMutationQueues.get(key) ?? Promise.resolve()
  const current = previous.catch(() => undefined).then(task)
  commentMutationQueues.set(key, current)
  try {
    return await current
  }
  finally {
    if (commentMutationQueues.get(key) === current)
      commentMutationQueues.delete(key)
  }
}

export function useForumTopicMutations() {
  const cache = useForumMutationCache()
  const { hasAnyRoles } = useRuleChecks()
  const canSkipTopicReformat = hasAnyRoles('teamMember', 'feedbackMember')
  const createTopicMutation = useMutation({ mutation: issues.postTopic })
  const updateTopicMutation = useMutation({
    mutation: (input: { topicId: string | number, patch: TopicPatch, confirmType?: ForumAPI.FeedbackTopicType }) =>
      issues.putTopic(input.topicId, input.patch, { skipReformat: canSkipTopicReformat.value, confirmType: input.confirmType }),
  })
  async function createTopic(input: ForumAPI.FormSubmitData): Promise<ForumAPI.Topic> {
    const topic = await createTopicMutation.mutateAsync(input)
    await cache.invalidate('createTopic', topic.id, topic)
    return topic
  }

  async function updateTopic(
    kind: Extract<ForumMutationKind, 'editTopic' | 'changeTopicMembership' | 'pinTopic' | 'closeTopic' | 'toggleCommentArea'>,
    topicId: string | number,
    patch: TopicPatch,
    currentTopic: ForumAPI.Topic,
    confirmType?: ForumAPI.FeedbackTopicType,
  ): Promise<TopicUpdateOutcome> {
    const snapshot = cache.captureTopicCache(topicId)
    const optimisticTopic = applyOptimisticTopicPatch(currentTopic, patch)
    const restoreToListStart = kind === 'closeTopic' && optimisticTopic.state === 'open'
    cache.reconcileUpdatedTopic(optimisticTopic, restoreToListStart)
    cache.queryCache.setQueryData(forumKeys.topic(topicId), optimisticTopic)

    try {
      const settledOutcome = await updateTopicMutation.mutateAsync({ topicId, patch, confirmType })
      if (settledOutcome.status === 'unknown')
        cache.restoreTopicCache(snapshot)
      else
        cache.reconcileUpdatedTopic(settledOutcome.topic, restoreToListStart && settledOutcome.topic.state === 'open')
      await cache.invalidate(kind, topicId, settledOutcome.status === 'unknown' ? undefined : settledOutcome.topic)
      if (requiresAuthoritativeRefetch(settledOutcome.status))
        await cache.queryCache.invalidateQueries({ key: forumKeys.topic(topicId), exact: true })
      return settledOutcome
    }
    catch (error) {
      cache.restoreTopicCache(snapshot)
      throw error
    }
  }

  return {
    createTopic,
    updateTopic,
    creatingTopic: createTopicMutation.isLoading,
    createdTopic: createTopicMutation.data,
    createTopicError: createTopicMutation.error,
    updatingTopic: updateTopicMutation.isLoading,
  }
}

export function useForumCommentMutations() {
  const cache = useForumMutationCache()
  const createCommentMutation = useMutation({
    mutation: (input: { repo: ForumAPI.Repo, topicId: string, body: string }) =>
      issues.postTopicComment(input.repo, input.topicId, input.body),
  })
  const deleteCommentMutation = useMutation({
    mutation: (input: { repo: ForumAPI.Repo, topicId: string, commentId: string | number }) =>
      issues.deleteTopicComment(input.commentId, input.repo),
  })

  async function createComment(input: { repo: ForumAPI.Repo, topicId: string, body: string }): Promise<ForumAPI.Comment> {
    return serializeTopicCommentMutation(input.topicId, async () => {
      const snapshot = cache.captureTopicCache(input.topicId)
      cache.adjustCachedCommentCount(input.topicId, 1)
      try {
        const comment = await createCommentMutation.mutateAsync(input)
        await cache.invalidate('createComment', input.topicId)
        return comment
      }
      catch (error) {
        cache.restoreTopicCache(snapshot)
        throw error
      }
    })
  }

  async function deleteComment(input: { repo: ForumAPI.Repo, topicId: string, commentId: string | number }): Promise<boolean> {
    return serializeTopicCommentMutation(input.topicId, async () => {
      const snapshot = cache.captureTopicCache(input.topicId)
      cache.adjustCachedCommentCount(input.topicId, -1)
      try {
        const deleted = await deleteCommentMutation.mutateAsync(input)
        if (!deleted)
          throw new Error('Comment deletion was not confirmed.')
        await cache.invalidate('deleteComment', input.topicId)
        return true
      }
      catch (error) {
        cache.restoreTopicCache(snapshot)
        throw error
      }
    })
  }

  return {
    createComment,
    deleteComment,
    creatingComment: createCommentMutation.isLoading,
    deletingComment: deleteCommentMutation.isLoading,
  }
}

function useForumMutationCache() {
  const queryCache = useQueryCache()

  function captureTopicCache(topicId: string | number) {
    return {
      detailKey: forumKeys.topic(topicId),
      detail: queryCache.getQueryData<ForumAPI.Topic>(forumKeys.topic(topicId)),
      lists: queryCache.getEntries({ key: forumKeys.topicLists() }).map(entry => ({
        key: entry.key,
        data: entry.state.value.data,
      })),
    }
  }

  function restoreTopicCache(snapshot: ReturnType<typeof captureTopicCache>): void {
    queryCache.setQueryData(snapshot.detailKey, snapshot.detail)
    for (const entry of snapshot.lists)
      queryCache.setQueryData(entry.key, entry.data)
  }

  async function invalidate(kind: ForumMutationKind, topicId?: string | number, topic?: ForumAPI.Topic): Promise<void> {
    const policy = forumMutationPolicies[kind]
    if (topicId !== undefined && policy.patchDetail && topic) {
      const current = queryCache.getQueryData<ForumAPI.Topic>(forumKeys.topic(topicId))
      queryCache.setQueryData(forumKeys.topic(topicId), current ? { ...current, ...topic } : topic)
    }

    const work: Promise<unknown>[] = []
    if (policy.invalidateTopicLists)
      work.push(queryCache.invalidateQueries({ key: forumKeys.topicLists() }))
    if (topicId !== undefined && policy.invalidateDetail)
      work.push(queryCache.invalidateQueries({ key: forumKeys.topic(topicId), exact: true }))
    if (policy.invalidatePinned && !policy.invalidateTopicLists)
      work.push(queryCache.invalidateQueries({ key: forumKeys.pinned(), exact: true }))
    if (topicId !== undefined && policy.invalidateComments)
      work.push(queryCache.invalidateQueries({ key: forumKeys.comments(topicId), exact: true }))
    if (topicId !== undefined && policy.invalidateTimeline)
      work.push(queryCache.invalidateQueries({ key: forumKeys.topicTimeline(topicId), exact: true }))
    await Promise.all(work)
  }

  function updateCachedTopicPages(
    update: (
      data: UseInfiniteQueryData<ForumPage<ForumAPI.Topic>, number>,
      params: ForumTopicListParams,
    ) => UseInfiniteQueryData<ForumPage<ForumAPI.Topic>, number>,
  ): void {
    for (const entry of queryCache.getEntries({ key: forumKeys.topicLists() })) {
      const data = entry.state.value.data
      const params = entry.key[3]
      if (!isTopicPages(data) || !isForumTopicListParams(params))
        continue
      queryCache.setQueryData(entry.key, update(data, params))
    }
  }

  function reconcileUpdatedTopic(topic: ForumAPI.Topic, insertMissing = false): void {
    updateCachedTopicPages((data, params) => forumTopicBelongsToList(topic, params)
      ? insertMissing
        ? prependTopicToForumPages(data, topic)
        : mapTopicInForumPages(data, topic.id, cached => ({ ...cached, ...topic }))
      : removeTopicFromForumPages(data, topic.id))

    const pinned = queryCache.getQueryData<ForumAPI.Topic[]>(forumKeys.pinned())
    if (!pinned)
      return

    const existing = pinned.find(item => String(item.id) === String(topic.id))
    const merged = existing ? { ...existing, ...topic } : topic
    const others = pinned.filter(item => String(item.id) !== String(topic.id))
    queryCache.setQueryData(
      forumKeys.pinned(),
      topic.pinned && topic.state === 'open' ? [merged, ...others] : others,
    )
  }

  function adjustCachedCommentCount(topicId: string | number, delta: number): void {
    const update = (topic: ForumAPI.Topic): ForumAPI.Topic => topic.commentCount < 0
      ? topic
      : { ...topic, commentCount: Math.max(0, topic.commentCount + delta) }

    const detail = queryCache.getQueryData<ForumAPI.Topic>(forumKeys.topic(topicId))
    if (detail)
      queryCache.setQueryData(forumKeys.topic(topicId), update(detail))

    updateCachedTopicPages(data => mapTopicInForumPages(data, topicId, update))

    const pinned = queryCache.getQueryData<ForumAPI.Topic[]>(forumKeys.pinned())
    if (pinned)
      queryCache.setQueryData(forumKeys.pinned(), pinned.map(topic => String(topic.id) === String(topicId) ? update(topic) : topic))
  }

  function isTopicPages(data: unknown): data is UseInfiniteQueryData<ForumPage<ForumAPI.Topic>, number> {
    return Boolean(data && typeof data === 'object' && Array.isArray((data as { pages?: unknown }).pages))
  }

  return {
    queryCache,
    captureTopicCache,
    restoreTopicCache,
    invalidate,
    reconcileUpdatedTopic,
    adjustCachedCommentCount,
  }
}
