import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import type ForumAPI from '@/apis/forum/api'
import { computed, toValue } from 'vue'
import { toast } from 'vue-sonner'
import { withAuth } from '@/utils/auth-helpers'
import {
  replaceEditableTopicLabels,
  replaceTopicTypeLabel,
  toggleTopicLabel,
} from '~/services/forum/forumTopicLabels'
import { composeTopicBody } from './composeTopicBody'
import { useForumMutations } from './forum/useForumMutations'

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
  const mutations = useForumMutations()

  function currentTopic(): ForumAPI.Topic {
    const topic = toValue(targetTopic)
    if (!topic?.id)
      throw new Error('Topic is required.')
    return topic
  }

  async function update(
    kind: Parameters<typeof mutations.updateTopic>[0],
    createPatch: (topic: ForumAPI.Topic) => Parameters<typeof mutations.updateTopic>[2],
    successMessage: string,
    failureMessage: string,
  ): Promise<ForumAPI.Topic | false> {
    const topic = currentTopic()
    return withOperationLock(topic.id, async () => {
      const outcome = await withAuth.execute(
        () => mutations.updateTopic(kind, topic.id, createPatch(topic), topic),
        { loginMessage: message.value.forum.auth.loginTips, errorMessage: failureMessage },
      )
      if (!outcome)
        return false
      if (outcome.status === 'unknown') {
        toast.error(failureMessage)
        throw outcome.error
      }
      if (outcome.status === 'partial') {
        toast.warning(message.value.forum.topic.menu.syncPending.replace('{action}', successMessage))
        return outcome.topic
      }
      return outcome.topic
    })
  }

  const toggleCloseTopic = (): [ComputedRef<boolean>, () => Promise<ForumAPI.Topic | false>] => {
    const closeState = computed(() => toValue(targetTopic)?.state === 'closed')
    return [closeState, () => update(
      'closeTopic',
      (topic) => {
        const state = topic.state === 'closed' ? 'open' : 'closed'
        return { body: composeTopicBody(topic.contentRaw, { state }), state }
      },
      message.value.forum.topic.menu.closeFeedback.success,
      message.value.forum.topic.menu.closeFeedback.fail,
    )]
  }

  const toggleHideTopic = (): [ComputedRef<boolean>, () => Promise<ForumAPI.Topic | false>] => {
    const hideState = computed(() => toValue(targetTopic)?.state === 'progressing')
    return [hideState, () => update(
      'changeTopicMembership',
      topic => ({ state: topic.state === 'progressing' ? 'open' : 'progressing' }),
      message.value.forum.topic.menu.hideFeedback.success,
      message.value.forum.topic.menu.hideFeedback.fail,
    )]
  }

  const toggleTopicType = (newType: ForumAPI.FeedbackTopicType) => update(
    'changeTopicMembership',
    topic => ({ labels: replaceTopicTypeLabel(topic.tags, newType).join(',') }),
    message.value.forum.topic.menu.changeType.success,
    message.value.forum.topic.menu.changeType.fail,
  )

  const togglePinnedTopic = () => update(
    'pinTopic',
    topic => ({ labels: toggleTopicLabel(topic.tags, 'PINNED', !topic.pinned).join(',') }),
    message.value.forum.topic.menu.pinTopic.success,
    message.value.forum.topic.menu.pinTopic.fail,
  )

  const toggleTopicCommentArea = () => {
    return update(
      'toggleCommentArea',
      topic => ({
        labels: topic.commentCount !== -1
          ? toggleTopicLabel(topic.tags, 'COMMENT-CLOSED', true).join(',')
          : toggleTopicLabel(topic.tags, 'COMMENT-CLOSED', false).join(','),
      }),
      message.value.forum.topic.menu.commentArea.success,
      message.value.forum.topic.menu.commentArea.fail,
    )
  }

  const replaceTopicTags = (newTags: string[]) => update(
    'changeTopicMembership',
    topic => ({ labels: replaceEditableTopicLabels(topic.tags, newTags).join(',') }),
    message.value.forum.topic.menu.modifyTags.success,
    message.value.forum.topic.menu.modifyTags.fail,
  )

  return {
    toggleCloseTopic,
    toggleHideTopic,
    togglePinnedTopic,
    toggleTopicType,
    replaceTopicTags,
    toggleTopicCommentArea,
    updatingTopic: mutations.updatingTopic,
  }
}
