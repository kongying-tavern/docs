import type ForumAPI from '@/apis/forum/api'
import type { ComputedRef } from 'vue'
import { issues } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { computed } from 'vue'
import { composeTopicBody } from './composeTopicBody'
import { executeWithAuth } from './executeWithAuth'

export function useTopicMannger(targetTopic: ForumAPI.Topic) {
  const targetTopicId = targetTopic.id

  const { message } = useLocalized()

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

      return result
    }

    return [hideState, toggleHide]
  }

  return {
    toggleCloseTopic,
    toggleHideTopic,
  }
}
