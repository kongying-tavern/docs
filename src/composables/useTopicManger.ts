import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import type ForumAPI from '@/apis/forum/api'
import { computed, toValue } from 'vue'
import { toast } from 'vue-sonner'
import { withAuth } from '@/utils/auth-helpers'
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

export function useTopicManger(targetTopic: MaybeRefOrGetter<ForumAPI.Topic | null | undefined>, message: Ref<CustomConfig>) {
  const mutations = useForumMutations()

  function currentTopic(): ForumAPI.Topic {
    const topic = toValue(targetTopic)
    if (!topic?.id)
      throw new Error('Topic is required.')
    return topic
  }

  async function update(
    action: string,
    kind: Parameters<typeof mutations.updateTopic>[0],
    createPatch: (topic: ForumAPI.Topic) => Parameters<typeof mutations.updateTopic>[2],
    successMessage: string,
    failureMessage: string,
  ): Promise<ForumAPI.Topic | false> {
    const topic = currentTopic()
    return withOperationLock(`${topic.id}:${action}`, async () => {
      const outcome = await withAuth.execute(
        () => mutations.updateTopic(kind, topic.id, createPatch(topic)),
        { loginMessage: message.value.forum.auth.loginTips, errorMessage: failureMessage },
      )
      if (!outcome)
        return false
      if (outcome.status === 'unknown') {
        toast.error(failureMessage)
        throw outcome.error
      }
      if (outcome.status === 'partial') {
        toast.warning(`${successMessage}，同步状态待确认`)
        return outcome.topic
      }
      toast.success(successMessage)
      return outcome.topic
    })
  }

  const toggleCloseTopic = (): [ComputedRef<boolean>, () => Promise<ForumAPI.Topic | false>] => {
    const closeState = computed(() => toValue(targetTopic)?.state === 'closed')
    return [closeState, () => update(
      'close',
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
      'hide',
      'changeTopicMembership',
      topic => ({ state: topic.state === 'progressing' ? 'open' : 'progressing' }),
      message.value.forum.topic.menu.hideFeedback.success,
      message.value.forum.topic.menu.hideFeedback.fail,
    )]
  }

  const toggleTopicType = (newType: Exclude<ForumAPI.TopicType, null>) => update(
    'type',
    'changeTopicMembership',
    topic => ({ labels: topic.type === newType ? removeLabel(topic, `TYP-${newType}`) : addLabel(topic, `TYP-${newType}`) }),
    `Toggle topic type to ${newType} success`,
    `Toggle topic type to ${newType} fail`,
  )

  const togglePinedTopic = () => update(
    'pin',
    'pinTopic',
    topic => ({ labels: topic.pinned ? removeLabel(topic, 'PINNED') : addLabel(topic, 'PINNED') }),
    'Pinned topic success',
    'Pinned topic fail',
  )

  const toggleTopicCommentArea = () => {
    return update(
      'comment',
      'toggleCommentArea',
      topic => ({
        labels: topic.commentCount !== -1
          ? addLabel(topic, 'COMMENT-CLOSED')
          : removeLabel(topic, 'COMMENT-CLOSED'),
      }),
      'Toggle topic comment area success',
      'Toggle topic comment area fail',
    )
  }

  const replaceTopicTags = (newTags: string[]) => update(
    'tags',
    'changeTopicMembership',
    topic => ({ labels: [...new Set([...getStateTags(topic), ...newTags])].join(',') }),
    'Tag edit success',
    'Tag edit fail',
  )

  function getStateTags(topic: ForumAPI.Topic) {
    return [
      `TYP-${topic.type}`,
      topic.commentCount === -1 ? 'COMMENT-CLOSED' : null,
      topic.pinned ? 'PINNED' : null,
      import.meta.env.DEV ? 'DEV-TEST' : null,
    ].filter((label): label is string => Boolean(label))
  }

  function addLabel(topic: ForumAPI.Topic, label: string) {
    return [...new Set([...topic.tags, ...getStateTags(topic), label])].join(',')
  }

  function removeLabel(topic: ForumAPI.Topic, label: string) {
    return [...new Set([...topic.tags, ...getStateTags(topic)])].filter(value => value !== label).join(',')
  }

  return {
    toggleCloseTopic,
    toggleHideTopic,
    togglePinedTopic,
    toggleTopicType,
    replaceTopicTags,
    toggleTopicCommentArea,
    updatingTopic: mutations.updatingTopic,
  }
}
