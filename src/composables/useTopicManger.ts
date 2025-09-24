import type { ComputedRef, Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { issues } from '@/apis/forum/gitee'
import { forumEvents } from '~/services/events/SimpleEventManager'
import { composeTopicBody } from './composeTopicBody'
import { executeWithAuth } from './executeWithAuth'

export function useTopicManger(targetTopic: ForumAPI.Topic, message: Ref<CustomConfig>) {
  const targetTopicId = targetTopic.id

  if (!targetTopic && !targetTopicId) {
    throw new Error(`Not found target${targetTopic}`)
  }

  const toggleCloseTopic = (): [ComputedRef<boolean>, () => void] => {
    const closeState = computed(() => targetTopic?.state === 'closed')
    const targetState = computed(() => (closeState.value ? 'open' : 'closed'))
    const body = computed(() =>
      composeTopicBody(targetTopic.contentRaw, { state: targetState.value }),
    )

    async function toggleClose() {
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
        // Calculate new state before updating
        const newState = targetState.value
        const isClosed = newState === 'closed'

        // Update local topic state
        targetTopic.state = newState

        // Emit close event
        forumEvents.topicClosed(targetTopic.id, isClosed)
      }

      return result
    }

    return [closeState, toggleClose]
  }

  const toggleHideTopic = (): [ComputedRef<boolean>, () => void] => {
    const hideState = computed(() => targetTopic?.state === 'progressing')

    async function toggleHide() {
      const result = await executeWithAuth(
        issues.putTopic,
        [targetTopicId, { state: hideState.value ? 'open' : 'progressing' }],
        message.value.forum.topic.menu.hideFeedback.success,
        message.value.forum.topic.menu.hideFeedback.fail,
        message,
      )

      if (result) {
        // Update local topic state
        const newState = hideState.value ? 'open' : 'progressing'
        targetTopic.state = newState

        // Emit hide event - isHidden should be true when state becomes 'progressing'
        const isHidden = newState === 'progressing'
        forumEvents.topicHidden(targetTopic.id, isHidden)
      }

      return result
    }

    return [hideState, toggleHide]
  }

  const toggleTopicType = async (newTopicType: Exclude<ForumAPI.TopicType, null>) => {
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
      // Update local topic state
      targetTopic.type = newTopicType

      // Emit topic type changed event
      forumEvents.topicTypeChanged(targetTopic.id, newTopicType)
    }

    return result
  }

  const togglePinedTopic = async () => {
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
      // Update local topic state
      targetTopic.pinned = newPinnedState

      // Emit topic pinned event
      forumEvents.topicPinned(targetTopic.id, newPinnedState)
    }

    return result
  }

  const toggleTopicCommentArea = async () => {
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
      // Update local topic state
      targetTopic.commentCount = willBeClosed ? -1 : 0

      // Emit comment toggle event
      forumEvents.topicCommentToggled(targetTopic.id, willBeClosed)
    }

    return result
  }

  const replaceTopicTags = async (newTags: string[]) => {
    const result = await executeWithAuth(
      issues.putTopic,
      [
        targetTopicId,
        {
          labels: Array.from(new Set([...getStateTags(), ...newTags])).join(
            ',',
          ),
        },
      ],
      'Tag edit success',
      'Tag edit fail',
      message,
    )

    if (result) {
      // Update local topic state
      targetTopic.tags = newTags

      // Emit topic tags updated event
      forumEvents.topicTagsUpdated(targetTopic.id, newTags)
    }

    return result
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
    return Array.from(
      new Set([...targetTopic.tags, ...getStateTags(), newLabel]),
    ).join(',')
  }

  function removeLabel(targetLabel: string) {
    return Array.from(
      new Set([...targetTopic.tags, ...getStateTags(), targetLabel]),
    )
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
