import type { UseInfiniteQueryData } from '@pinia/colada'
import type ForumAPI from '@/apis/forum/api'
import type { TopicUpdateOutcome } from '@/apis/forum/gitee/issues'
import type { ForumMutationKind, ForumPage, ForumTopicListParams } from '~/services/forum/forumQueryContracts'
import { useMutation, useQueryCache } from '@pinia/colada'
import { computed } from 'vue'
import { issues } from '@/apis/forum/gitee'
import {
  forumKeys,
  forumMutationPolicies,
  forumTopicBelongsToList,
  isForumTopicListParams,
  mapTopicInForumPages,
  prependTopicToForumPages,
  removeTopicFromForumPages,
  requiresAuthoritativeRefetch,
} from '~/services/forum/forumQueryContracts'
import { applyOptimisticTopicPatch } from '~/services/forum/forumTopicOptimistic'

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

export function useForumMutations() {
  const queryCache = useQueryCache()
  const createTopicMutation = useMutation({ mutation: issues.postTopic })
  const updateTopicMutation = useMutation({
    mutation: (input: { topicId: string | number, patch: TopicPatch }) =>
      issues.putTopic(input.topicId, input.patch),
  })
  const createCommentMutation = useMutation({
    mutation: (input: { repo: ForumAPI.Repo, topicId: string, body: string }) =>
      issues.postTopicComment(input.repo, input.topicId, input.body),
  })
  const deleteCommentMutation = useMutation({
    mutation: (input: { repo: string, topicId: string, commentId: string | number }) =>
      issues.deleteTopicComment(input.commentId, input.repo),
  })

  async function createTopic(input: ForumAPI.FormSubmitData): Promise<ForumAPI.Topic> {
    const topic = await createTopicMutation.mutateAsync(input)
    await invalidate('createTopic', topic.id, topic)
    return topic
  }

  async function updateTopic(
    kind: Extract<ForumMutationKind, 'editTopic' | 'changeTopicMembership' | 'pinTopic' | 'closeTopic' | 'toggleCommentArea'>,
    topicId: string | number,
    patch: TopicPatch,
    currentTopic: ForumAPI.Topic,
  ): Promise<TopicUpdateOutcome> {
    const snapshot = captureTopicCache(topicId)
    const optimisticTopic = applyOptimisticTopicPatch(currentTopic, patch)
    const restoreToListStart = kind === 'closeTopic' && optimisticTopic.state === 'open'
    reconcileUpdatedTopic(optimisticTopic, restoreToListStart)
    queryCache.setQueryData(forumKeys.topic(topicId), optimisticTopic)

    try {
      const outcome = await updateTopicMutation.mutateAsync({ topicId, patch })
      if (outcome.status === 'unknown')
        restoreTopicCache(snapshot)
      else
        reconcileUpdatedTopic(outcome.topic, restoreToListStart && outcome.topic.state === 'open')
      await invalidate(kind, topicId, outcome.status === 'unknown' ? undefined : outcome.topic)
      if (requiresAuthoritativeRefetch(outcome.status))
        await queryCache.invalidateQueries({ key: forumKeys.topic(topicId), exact: true })
      return outcome
    }
    catch (error) {
      restoreTopicCache(snapshot)
      throw error
    }
  }

  async function createComment(input: { repo: ForumAPI.Repo, topicId: string, body: string }): Promise<ForumAPI.Comment> {
    return serializeTopicCommentMutation(input.topicId, async () => {
      const snapshot = captureTopicCache(input.topicId)
      adjustCachedCommentCount(input.topicId, 1)
      try {
        const comment = await createCommentMutation.mutateAsync(input)
        await invalidate('createComment', input.topicId)
        return comment
      }
      catch (error) {
        restoreTopicCache(snapshot)
        throw error
      }
    })
  }

  async function deleteComment(input: { repo: string, topicId: string, commentId: string | number }): Promise<boolean> {
    return serializeTopicCommentMutation(input.topicId, async () => {
      const snapshot = captureTopicCache(input.topicId)
      adjustCachedCommentCount(input.topicId, -1)
      try {
        const deleted = await deleteCommentMutation.mutateAsync(input)
        if (!deleted)
          throw new Error('Comment deletion was not confirmed.')
        await invalidate('deleteComment', input.topicId)
        return true
      }
      catch (error) {
        restoreTopicCache(snapshot)
        throw error
      }
    })
  }

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
    createTopic,
    updateTopic,
    createComment,
    deleteComment,
    creatingTopic: createTopicMutation.isLoading,
    createdTopic: createTopicMutation.data,
    createTopicError: createTopicMutation.error,
    updatingTopic: updateTopicMutation.isLoading,
    creatingComment: createCommentMutation.isLoading,
    deletingComment: deleteCommentMutation.isLoading,
    isLoading: computed(() =>
      createTopicMutation.isLoading.value
      || updateTopicMutation.isLoading.value
      || createCommentMutation.isLoading.value
      || deleteCommentMutation.isLoading.value),
  }
}
