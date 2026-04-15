import type { ComputedRef, Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { issues } from '@/apis/forum/gitee'
import { forumEvents } from '~/services/events/SimpleEventManager'
import { composeTopicBody } from './composeTopicBody'
import { executeWithAuth } from './executeWithAuth'

const pendingOperations = new Map<string, Promise<unknown>>()

function getOperationKey(topicId: string | number, action: string): string {
  return `${topicId}:${action}`
}

async function withOperationLock<T>(
  topicId: string | number,
  action: string,
  operation: () => Promise<T>,
): Promise<T | false> {
  const key = getOperationKey(topicId, action)
  if (pendingOperations.has(key)) {
    return false
  }

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
  const targetTopicId = targetTopic.id

  if (!targetTopic && !targetTopicId) {
    throw new Error(`Not found target${targetTopic}`)
  }

  const toggleCloseTopic = (): [ComputedRef<boolean>, () => Promise<ForumAPI.Topic | false>] => {
    const closeState = computed(() => targetTopic?.state === 'closed')
    const targetState = computed(() => (closeState.value ? 'open' : 'closed'))
    const body = computed(() =>
      composeTopicBody(targetTopic.contentRaw, { state: targetState.value }),
    )

    async function toggleClose() {
      return withOperationLock(targetTopicId, 'close', async () => {
        const result = await executeWithAuth(
          issues.putTopic,
          [
            targetTopic.id,
            {
              body: body.value,
              state: targetState.value,
            },
          ],
          message.value.forum.topic.menu.closeFeedback.success,
          message.value.forum.topic.menu.closeFeedback.fail,
          message,
        )

        if (result) {
          const newState = targetState.value
          const isClosed = newState === 'closed'
          targetTopic.state = newState
          forumEvents.topicClosed(targetTopic.id, isClosed)
        }

        return result
      })
    }

    return [closeState, toggleClose]
  }

  const toggleHideTopic = (): [ComputedRef<boolean>, () => Promise<ForumAPI.Topic | false>] => {
    const hideState = computed(() => targetTopic?.state === 'progressing')

    async function toggleHide() {
      return withOperationLock(targetTopicId, 'hide', async () => {
        const result = await executeWithAuth(
          issues.putTopic,
          [targetTopicId, { state: hideState.value ? 'open' : 'progressing' }],
          message.value.forum.topic.menu.hideFeedback.success,
          message.value.forum.topic.menu.hideFeedback.fail,
          message,
        )

        if (result) {
          const newState = hideState.value ? 'open' : 'progressing'
          targetTopic.state = newState
          const isHidden = newState === 'progressing'
          forumEvents.topicHidden(targetTopic.id, isHidden)
        }

        return result
      })
    }

    return [hideState, toggleHide]
  }

  const toggleTopicType = async (newTopicType: Exclude<ForumAPI.TopicType, null>): Promise<ForumAPI.Topic | false> => {
    return withOperationLock(targetTopicId, 'type', async () => {
      const result = await executeWithAuth(
        issues.putTopic,
        [
          targetTopicId,
          {
            labels:
              targetTopic.type === newTopicType
                ? removeLabel(`TYP-${newTopicType!}`)
                : addLabel(`TYP-${newTopicType!}`),
          },
        ],
        `Toggle topic type to ${newTopicType} success`,
        `Toggle topic type to ${newTopicType} Fail`,
        message,
      )

      if (result) {
        targetTopic.type = newTopicType
        forumEvents.topicTypeChanged(targetTopic.id, newTopicType)
      }

      return result
    })
  }

  const togglePinedTopic = async (): Promise<ForumAPI.Topic | false> => {
    return withOperationLock(targetTopicId, 'pin', async () => {
      const result = await executeWithAuth(
        issues.putTopic,
        [
          targetTopicId,
          {
            labels: targetTopic.pinned
              ? removeLabel('PINNED')
              : addLabel('PINNED'),
          },
        ],
        'Pinned topic success',
        'Pinned topic fail',
        message,
      )

      if (result) {
        const newPinnedState = !targetTopic.pinned
        targetTopic.pinned = newPinnedState
        forumEvents.topicPinned(targetTopic.id, newPinnedState)
      }

      return result
    })
  }

  const toggleTopicCommentArea = async (): Promise<ForumAPI.Topic | false> => {
    return withOperationLock(targetTopicId, 'comment', async () => {
      const isCurrentlyClosed = targetTopic.commentCount === -1
      const willBeClosed = !isCurrentlyClosed

      const result = await executeWithAuth(
        issues.putTopic,
        [
          targetTopicId,
          {
            labels: willBeClosed
              ? addLabel('COMMENT-CLOSED')
              : removeLabel('COMMENT-CLOSED'),
          },
        ],
        'Toggle topic comment area success',
        'Toggle topic comment area fail',
        message,
      )

      if (result) {
        targetTopic.commentCount = willBeClosed ? -1 : 0
        forumEvents.topicCommentToggled(targetTopic.id, willBeClosed)
      }

      return result
    })
  }

  const replaceTopicTags = async (newTags: string[]): Promise<ForumAPI.Topic | false> => {
    return withOperationLock(targetTopicId, 'tags', async () => {
      const result = await executeWithAuth(
        issues.putTopic,
        [
          targetTopicId,
          {
            labels: [...new Set([...getStateTags(), ...newTags])].join(','),
          },
        ],
        'Tag edit success',
        'Tag edit fail',
        message,
      )

      if (result) {
        targetTopic.tags = newTags
        forumEvents.topicTagsUpdated(targetTopic.id, newTags)
      }

      return result
    })
  }

  function getStateTags() {
    return [
      `TYP-${targetTopic.type}`,
      targetTopic.commentCount === -1 ? 'COMMENT-CLOSED' : null,
      targetTopic.pinned ? 'PINNED' : null,
      import.meta.env.DEV ? 'DEV-TEST' : null,
    ].filter(Boolean)
  }

  function addLabel(newLabel: string) {
    return [...new Set([...targetTopic.tags, ...getStateTags(), newLabel])].join(',')
  }

  function removeLabel(targetLabel: string) {
    return [...new Set([...targetTopic.tags, ...getStateTags(), targetLabel])]
      .filter(val => val !== targetLabel)
      .join(',')
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
