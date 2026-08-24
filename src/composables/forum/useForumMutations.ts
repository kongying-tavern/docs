import type ForumAPI from '@/apis/forum/api'
import type { TopicUpdateOutcome } from '@/apis/forum/gitee/issues'
import type { ForumMutationKind } from '~/services/forum/forumQueryContracts'
import { useMutation, useQueryCache } from '@pinia/colada'
import { computed } from 'vue'
import { issues } from '@/apis/forum/gitee'
import { forumKeys, forumMutationPolicies, requiresAuthoritativeRefetch } from '~/services/forum/forumQueryContracts'

type TopicPatch = Parameters<typeof issues.putTopic>[1]

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
  ): Promise<TopicUpdateOutcome> {
    const outcome = await updateTopicMutation.mutateAsync({ topicId, patch })
    await invalidate(kind, topicId, outcome.status === 'unknown' ? undefined : outcome.topic)
    if (requiresAuthoritativeRefetch(outcome.status))
      await queryCache.invalidateQueries({ key: forumKeys.topic(topicId), exact: true })
    return outcome
  }

  async function createComment(input: { repo: ForumAPI.Repo, topicId: string, body: string }): Promise<ForumAPI.Comment> {
    const comment = await createCommentMutation.mutateAsync(input)
    await invalidate('createComment', input.topicId)
    return comment
  }

  async function deleteComment(input: { repo: string, topicId: string, commentId: string | number }): Promise<boolean> {
    const deleted = await deleteCommentMutation.mutateAsync(input)
    if (!deleted)
      throw new Error('Comment deletion was not confirmed.')
    await invalidate('deleteComment', input.topicId)
    return true
  }

  async function invalidate(kind: ForumMutationKind, topicId?: string | number, topic?: ForumAPI.Topic): Promise<void> {
    const policy = forumMutationPolicies[kind]
    if (topicId !== undefined && policy.patchDetail && topic)
      queryCache.setQueryData(forumKeys.topic(topicId), topic)

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
