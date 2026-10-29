import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { Composer } from 'vue-i18n'
import type { TopicUpdateOutcome } from '~/forum/api/gitee/issues'
import type ForumAPI from '~/forum/api/types'
import { computed, toValue } from 'vue'
import { withAuth } from '~/forum/composables/auth/auth-helpers'
import {
  replaceEditableTopicLabels,
  toggleTopicLabel,
} from '~/forum/services/forumTopicLabels'
import { replaceTopicStatus, topicStatusHidesTopic } from '~/forum/services/forumTopicStatus'
import { toast } from '~/services/telemetry/toast'
import { useForumTopicMutations } from '../data/useForumMutations'
import { buildTopicMembershipPatch, buildTopicTypeChangePatch } from '../util/composeTopicBody'

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

export function useTopicManager(targetTopic: MaybeRefOrGetter<ForumAPI.Topic | null | undefined>, t: Composer['t'], onSuccess?: (topic: ForumAPI.Topic, text: string, field?: 'type' | 'status' | 'goodIssue') => Promise<void> | void) {
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
    options: { confirmType?: ForumAPI.FeedbackTopicType, visibleField?: 'type' | 'status' | 'goodIssue' } = {},
  ): Promise<ForumAPI.Topic | false> {
    const topic = currentTopic()
    return withOperationLock(topic.id, async () => {
      let outcome: TopicUpdateOutcome | null
      try {
        outcome = await withAuth.execute(
          () => mutations.updateTopic(kind, topic.id, createPatch(topic), topic, options.confirmType),
          { loginMessage: t('forum.auth.loginTips'), errorMessage: failureMessage },
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
        toast.warning(t('forum.topic.menu.syncPending', { action: successMessage }))
        return false
      }
      if (onSuccess)
        await onSuccess(outcome.topic, successMessage, options.visibleField)
      else
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
      t('forum.topic.menu.closeFeedback.success'),
      t('forum.topic.menu.closeFeedback.fail'),
    )]
  }

  const toggleHideTopic = (): [ComputedRef<boolean>, () => Promise<ForumAPI.Topic | false>] => {
    const hideState = computed(() => toValue(targetTopic)?.state === 'progressing')
    return [hideState, () => update(
      'changeTopicMembership',
      topic => buildTopicMembershipPatch(topic, { state: topic.state === 'progressing' ? 'open' : 'progressing' }),
      t('forum.topic.menu.hideFeedback.success'),
      t('forum.topic.menu.hideFeedback.fail'),
    )]
  }

  const toggleTopicType = (newType: ForumAPI.FeedbackTopicType) => update(
    'changeTopicMembership',
    topic => buildTopicTypeChangePatch(topic, newType),
    t('forum.topic.menu.changeType.success'),
    t('forum.topic.menu.changeType.fail'),
    { confirmType: newType, visibleField: 'type' },
  )

  const togglePinnedTopic = () => update(
    'pinTopic',
    topic => buildTopicMembershipPatch(topic, { labels: toggleTopicLabel(currentLabels(topic), 'PINNED', !topic.pinned) }),
    t('forum.topic.menu.pinTopic.success'),
    t('forum.topic.menu.pinTopic.fail'),
  )

  const togglePrivateTopic = () => update(
    'changeTopicMembership',
    topic => ({ security_hole: topic.isPrivate !== true }),
    t('forum.topic.menu.privateFeedback.success'),
    t('forum.topic.menu.privateFeedback.fail'),
  )

  const toggleTopicCommentArea = () => {
    return update(
      'toggleCommentArea',
      topic => buildTopicMembershipPatch(topic, {
        labels: toggleTopicLabel(currentLabels(topic), 'COMMENT-CLOSED', topic.commentCount !== -1),
      }),
      t('forum.topic.menu.commentArea.success'),
      t('forum.topic.menu.commentArea.fail'),
    )
  }

  const replaceTopicTags = (newTags: string[]) => update(
    'changeTopicMembership',
    topic => buildTopicMembershipPatch(topic, { labels: replaceEditableTopicLabels(currentLabels(topic), newTags) }),
    t('forum.topic.menu.modifyTags.success'),
    t('forum.topic.menu.modifyTags.fail'),
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
      t('forum.topic.menu.modifyStatus.success'),
      t('forum.topic.menu.modifyStatus.fail'),
      { visibleField: 'status' },
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
    t('forum.topic.menu.hideFeedback.success'),
    t('forum.topic.menu.hideFeedback.fail'),
  )

  const toggleGoodIssue = () => update(
    'changeTopicMembership',
    topic => buildTopicMembershipPatch(topic, { labels: toggleTopicLabel(currentLabels(topic), 'GOOD-ISSUE', !topic.goodIssue) }),
    t('forum.topic.menu.goodIssue.success'),
    t('forum.topic.menu.goodIssue.fail'),
    { visibleField: 'goodIssue' },
  )

  return {
    toggleCloseTopic,
    toggleHideTopic,
    togglePinnedTopic,
    togglePrivateTopic,
    toggleTopicType,
    replaceTopicTags,
    setTopicStatus,
    hideTopicWithStatus,
    toggleGoodIssue,
    toggleTopicCommentArea,
    updatingTopic: mutations.updatingTopic,
  }
}
