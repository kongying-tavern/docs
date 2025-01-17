import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'

export const SHARED_TOPIC_INFO_KEY = 'topic-info'

export const useSharedTopicInfo = (topic?: ForumAPI.Topic) => {
  if (import.meta.env.SSR) return computed(() => null)

  return computed<ForumAPI.Topic>(() => {
    const data = sessionStorage.getItem(SHARED_TOPIC_INFO_KEY)
    if (data) {
      sessionStorage.removeItem(SHARED_TOPIC_INFO_KEY)
      return JSON.parse(data)
    }
    sessionStorage.setItem(SHARED_TOPIC_INFO_KEY, JSON.stringify(topic))
    return topic
  })
}
