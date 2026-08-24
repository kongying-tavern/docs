import type { ComputedRef, Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
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

export function useTopicManger(targetTopic: ForumAPI.Topic, message: Ref<CustomConfig>) {
  if (!targetTopic?.id)
    throw new Error('Topic is required.')

  const mutations = useForumMutations()
  const targetTopicId = targetTopic.id

  async function update(
    action: string,
    kind: Parameters<typeof mutations.updateTopic>[0],
    patch: Parameters<typeof mutations.updateTopic>[2],
    successMessage: string,
    failureMessage: string,
  ): Promise<ForumAPI.Topic | false> {
    return withOperationLock(`${targetTopicId}:${action}`, async () => {
      const outcome = await withAuth.execute(
        () => mutations.updateTopic(kind, targetTopicId, patch),
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
    const closeState = computed(() => targetTopic.state === 'closed')
    return [closeState, () => {
      const state = closeState.value ? 'open' : 'closed'
      return update(
        'close',
        'closeTopic',
        { body: composeTopicBody(targetTopic.contentRaw, { state }), state },
        message.value.forum.topic.menu.closeFeedback.success,
        message.value.forum.topic.menu.closeFeedback.fail,
      )
    }]
  }

  const toggleHideTopic = (): [ComputedRef<boolean>, () => Promise<ForumAPI.Topic | false>] => {
    const hideState = computed(() => targetTopic.state === 'progressing')
    return [hideState, () => update(
      'hide',
      'changeTopicMembership',
      { state: hideState.value ? 'open' : 'progressing' },
      message.value.forum.topic.menu.hideFeedback.success,
      message.value.forum.topic.menu.hideFeedback.fail,
    )]
  }

  const toggleTopicType = (newType: Exclude<ForumAPI.TopicType, null>) => update(
    'type',
    'changeTopicMembership',
    { labels: targetTopic.type === newType ? removeLabel(`TYP-${newType}`) : addLabel(`TYP-${newType}`) },
    `Toggle topic type to ${newType} success`,
    `Toggle topic type to ${newType} fail`,
  )

  const togglePinedTopic = () => update(
    'pin',
    'pinTopic',
    { labels: targetTopic.pinned ? removeLabel('PINNED') : addLabel('PINNED') },
    'Pinned topic success',
    'Pinned topic fail',
  )

  const toggleTopicCommentArea = () => {
    const willClose = targetTopic.commentCount !== -1
    return update(
      'comment',
      'toggleCommentArea',
      { labels: willClose ? addLabel('COMMENT-CLOSED') : removeLabel('COMMENT-CLOSED') },
      'Toggle topic comment area success',
      'Toggle topic comment area fail',
    )
  }

  const replaceTopicTags = (newTags: string[]) => update(
    'tags',
    'changeTopicMembership',
    { labels: [...new Set([...getStateTags(), ...newTags])].join(',') },
    'Tag edit success',
    'Tag edit fail',
  )

  function getStateTags() {
    return [
      `TYP-${targetTopic.type}`,
      targetTopic.commentCount === -1 ? 'COMMENT-CLOSED' : null,
      targetTopic.pinned ? 'PINNED' : null,
      import.meta.env.DEV ? 'DEV-TEST' : null,
    ].filter((label): label is string => Boolean(label))
  }

  function addLabel(label: string) {
    return [...new Set([...targetTopic.tags, ...getStateTags(), label])].join(',')
  }

  function removeLabel(label: string) {
    return [...new Set([...targetTopic.tags, ...getStateTags()])].filter(value => value !== label).join(',')
  }

  return {
    toggleCloseTopic,
    toggleHideTopic,
    togglePinedTopic,
    toggleTopicType,
    replaceTopicTags,
    toggleTopicCommentArea,
  }
}
