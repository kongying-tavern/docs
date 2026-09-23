import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import type ForumAPI from '@/apis/forum/api'
import { computed, toValue } from 'vue'
import { withAuth } from '@/utils/auth-helpers'
import {
  replaceEditableTopicLabels,
  toggleTopicLabel,
} from '~/services/forum/forumTopicLabels'
import { replaceTopicStatus, topicStatusHidesTopic } from '~/services/forum/forumTopicStatus'
import { toast } from '~/services/telemetry/toast'
import { buildTopicMembershipPatch, buildTopicTypeChangePatch } from './composeTopicBody'
import { useForumTopicMutations } from './forum/useForumMutations'

const pendingOperations = new Map<string, Promise<unknown>>()

async function withOperationLock<T>(key: string, operation: () => Promise<T>): Promise<T | false> {
  if (pendingOperations.has(key))
    return false
  const promise = operation()
  pendingOperations.set(key, promise)
  try {
    return await promise
  }
  finally {
    pendingOperations.delete(key)
  }
}

export function useTopicManager(targetTopic: MaybeRefOrGetter<ForumAPI.Topic | null | undefined>, message: Ref<CustomConfig>) {
  const mutations = useForumTopicMutations()

  function currentTopic(): ForumAPI.Topic {
    const topic = toValue(targetTopic)
    if (!topic?.id)
      throw new Error('Topic is required.')
    return topic
  }

  function currentLabels(topic: ForumAPI.Topic): string[] {
    return topic.labels ?? topic.tags
  }

  async function update(
    kind: Parameters<typeof mutations.updateTopic>[0],
    createPatch: (topic: ForumAPI.Topic) => Parameters<typeof mutations.updateTopic>[2],
    successMessage: string,
    failureMessage: string,
    options: { notifySuccess?: boolean, confirmType?: ForumAPI.FeedbackTopicType } = {},
  ): Promise<ForumAPI.Topic | false> {
    const topic = currentTopic()
    return withOperationLock(topic.id, async () => {
      const outcome = await withAuth.execute(
        () => mutations.updateTopic(kind, topic.id, createPatch(topic), topic, options.confirmType),
        { loginMessage: message.value.forum.auth.loginTips, errorMessage: failureMessage },
      )
      if (!outcome)
        return false
      if (outcome.status === 'unknown') {
        toast.error(failureMessage, { error: outcome.error, scene: 'op' })
        throw outcome.error
      }
      if (outcome.status === 'partial') {
        toast.warning(message.value.forum.topic.menu.syncPending.replace('{action}', successMessage))
        return outcome.topic
      }
      if (options.notifySuccess)
        toast.success(successMessage)
      return outcome.topic
    })
  }

  const toggleCloseTopic = (): [ComputedRef<boolean>, (status?: ForumAPI.TopicStatus) => Promise<ForumAPI.Topic | false>] => {
    const closeState = computed(() => toValue(targetTopic)?.state === 'closed')
    return [closeState, status => update(
      'closeTopic',
      (topic) => {
        const state = topic.state === 'closed' ? 'open' : 'closed'
        return buildTopicMembershipPatch(topic, {
          state,
          ...(state === 'closed' && status
            ? { labels: replaceTopicStatus(currentLabels(topic), status) }
            : {}),
        })
      },
      message.value.forum.topic.menu.closeFeedback.success,
      message.value.forum.topic.menu.closeFeedback.fail,
    )]
  }

  const toggleHideTopic = (): [ComputedRef<boolean>, () => Promise<ForumAPI.Topic | false>] => {
    const hideState = computed(() => toValue(targetTopic)?.state === 'progressing')
    return [hideState, () => update(
      'changeTopicMembership',
      topic => buildTopicMembershipPatch(topic, { state: topic.state === 'progressing' ? 'open' : 'progressing' }),
      message.value.forum.topic.menu.hideFeedback.success,
      message.value.forum.topic.menu.hideFeedback.fail,
    )]
  }

  const toggleTopicType = async (newType: ForumAPI.FeedbackTopicType) => {
    try {
      return await update(
        'changeTopicMembership',
        topic => buildTopicTypeChangePatch(topic, newType),
        message.value.forum.topic.menu.changeType.success,
        message.value.forum.topic.menu.changeType.fail,
        { notifySuccess: true, confirmType: newType },
      )
    }
    catch {
      // update 已向用户展示失败原因，菜单事件不再产生未处理的 Promise rejection。
      return false
    }
  }

  const togglePinnedTopic = () => update(
    'pinTopic',
    topic => buildTopicMembershipPatch(topic, { labels: toggleTopicLabel(currentLabels(topic), 'PINNED', !topic.pinned) }),
    message.value.forum.topic.menu.pinTopic.success,
    message.value.forum.topic.menu.pinTopic.fail,
  )

  const toggleTopicCommentArea = () => {
    return update(
      'toggleCommentArea',
      topic => buildTopicMembershipPatch(topic, {
        labels: toggleTopicLabel(currentLabels(topic), 'COMMENT-CLOSED', topic.commentCount !== -1),
      }),
      message.value.forum.topic.menu.commentArea.success,
      message.value.forum.topic.menu.commentArea.fail,
    )
  }

  const replaceTopicTags = (newTags: string[]) => update(
    'changeTopicMembership',
    topic => buildTopicMembershipPatch(topic, { labels: replaceEditableTopicLabels(currentLabels(topic), newTags) }),
    message.value.forum.topic.menu.modifyTags.success,
    message.value.forum.topic.menu.modifyTags.fail,
  )

  const setTopicStatus = (status: ForumAPI.TopicStatus | null) => {
    const shouldHide = status !== null
      && topicStatusHidesTopic(status)
      && currentTopic().state === 'open'
    return update(
      'changeTopicMembership',
      topic => buildTopicMembershipPatch(topic, {
        labels: replaceTopicStatus(currentLabels(topic), status),
        ...(shouldHide ? { state: 'progressing' as const } : {}),
      }),
      message.value.forum.topic.menu.modifyStatus.success,
      message.value.forum.topic.menu.modifyStatus.fail,
    )
  }

  const toggleGoodIssue = () => update(
    'changeTopicMembership',
    topic => buildTopicMembershipPatch(topic, { labels: toggleTopicLabel(currentLabels(topic), 'GOOD-ISSUE', !topic.goodIssue) }),
    message.value.forum.topic.menu.goodIssue.success,
    message.value.forum.topic.menu.goodIssue.fail,
  )

  return {
    toggleCloseTopic,
    toggleHideTopic,
    togglePinnedTopic,
    toggleTopicType,
    replaceTopicTags,
    setTopicStatus,
    toggleGoodIssue,
    toggleTopicCommentArea,
    updatingTopic: mutations.updatingTopic,
  }
}
