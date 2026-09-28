import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { TopicUpdateOutcome } from '~/forum/api/gitee/issues'
import type ForumAPI from '~/forum/api/types'
import type { CustomConfig } from '~/forum/types'
import { computed, toValue } from 'vue'
import { withAuth } from '@/utils/auth-helpers'
import {
  replaceEditableTopicLabels,
  toggleTopicLabel,
} from '~/forum/services/topicLabels'
import { replaceTopicStatus, topicStatusHidesTopic } from '~/forum/services/topicStatus'
import { toast } from '~/services/telemetry/toast'
import { buildTopicMembershipPatch, buildTopicTypeChangePatch } from './composeTopicBody'
import { useForumTopicMutations } from './useForumMutations'

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
    options: { confirmType?: ForumAPI.FeedbackTopicType } = {},
  ): Promise<ForumAPI.Topic | false> {
    const topic = currentTopic()
    return withOperationLock(topic.id, async () => {
      let outcome: TopicUpdateOutcome | null
      try {
        outcome = await withAuth.execute(
          () => mutations.updateTopic(kind, topic.id, createPatch(topic), topic, options.confirmType),
          { loginMessage: message.value.forum.auth.loginTips, errorMessage: failureMessage },
        )
      }
      catch {
        // withAuth 已展示请求失败；菜单动作不能泄漏未处理的 Promise rejection。
        return false
      }
      if (!outcome)
        return false
      if (outcome.status === 'unknown') {
        toast.error(failureMessage, { error: outcome.error, scene: 'op' })
        return false
      }
      if (outcome.status === 'partial') {
        toast.warning(message.value.forum.topic.menu.syncPending.replace('{action}', successMessage))
        return false
      }
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

  const toggleTopicType = (newType: ForumAPI.FeedbackTopicType) => update(
    'changeTopicMembership',
    topic => buildTopicTypeChangePatch(topic, newType),
    message.value.forum.topic.menu.changeType.success,
    message.value.forum.topic.menu.changeType.fail,
    { confirmType: newType },
  )

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

  /**
   * 「隐藏反馈」子菜单的选择：状态与隐藏在同一次补丁里落库。隐藏在这里是显式意图，
   * 不取决于所选状态是否结论型 —— 无状态话题必须借这一步补上隐藏的原因。
   */
  const hideTopicWithStatus = (status: ForumAPI.TopicStatus) => update(
    'changeTopicMembership',
    topic => buildTopicMembershipPatch(topic, {
      labels: replaceTopicStatus(currentLabels(topic), status),
      state: 'progressing' as const,
    }),
    message.value.forum.topic.menu.hideFeedback.success,
    message.value.forum.topic.menu.hideFeedback.fail,
  )

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
    hideTopicWithStatus,
    toggleGoodIssue,
    toggleTopicCommentArea,
    updatingTopic: mutations.updatingTopic,
  }
}
