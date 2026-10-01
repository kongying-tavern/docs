import type ForumAPI from '~/forum/api/types'
import { nextTick } from 'vue'
import { toast } from '~/services/telemetry/toast'
import { isVisibleFeedback } from '~/utils/isVisibleFeedback'

export function useTopicOperationFeedback() {
  return async (topic: ForumAPI.Topic, text: string, field?: 'type' | 'status' | 'goodIssue'): Promise<void> => {
    await nextTick()
    const visibleResult = field && typeof document !== 'undefined'
      && [...document.querySelectorAll<HTMLElement>('[data-feedback-topic]')].some(element =>
        element.dataset.feedbackTopic === String(topic.id)
        && element.dataset[field === 'goodIssue' ? 'feedbackGoodIssue' : field === 'type' ? 'feedbackType' : 'feedbackStatus'] === String(topic[field] ?? '')
        && isVisibleFeedback(element),
      )
    if (!visibleResult)
      toast.success(text)
  }
}
