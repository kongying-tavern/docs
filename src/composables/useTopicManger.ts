import type ForumAPI from '@/apis/forum/api'
import type { ComputedRef, Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import { issues } from '@/apis/forum/gitee'
import { computed } from 'vue'
import { useForumData } from '~/stores/useForumData'
import { composeTopicBody } from './composeTopicBody'
import { executeWithAuth } from './executeWithAuth'

export function useTopicManger(targetTopic: ForumAPI.Topic, message: Ref<CustomConfig>) {
  const targetTopicId = targetTopic.id

  if (!targetTopic && !targetTopicId) {
    throw new Error(`Not found target${targetTopic}`)
  }
  const { removeTopic, changeTopicType, changeTopicPinState, replaceTopicTags: replaceLocaleTopicTags } = useForumData()

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

      if (targetState.value === 'open')
        removeTopic(targetTopic.id)

      return !result
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

      if (!hideState.value)
        removeTopic(targetTopic.id)

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

    changeTopicType(targetTopic.id, newTopicType)

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

    changeTopicPinState(targetTopic.id, !targetTopic.pinned)

    return result
  }

  const toggleTopicCommentArea = async () => {
    console.log(removeLabel('COMMENT-CLOSED'))
    const result = await executeWithAuth(
      issues.putTopic,
      [
        targetTopicId,
        {
          labels:
            targetTopic.commentCount !== -1
              ? addLabel('COMMENT-CLOSED')
              : removeLabel('COMMENT-CLOSED'),
        },
      ],
      'Toggle topic comment area success',
      'Toggle topic comment area fail',
      message,
    )

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

    replaceLocaleTopicTags(targetTopic.id, newTags)

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
