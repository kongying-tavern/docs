import type ForumAPI from '@/apis/forum/api'
import { useStorage } from '@vueuse/core'
import { computed } from 'vue'

export const useSharedTopicInfo = (topic?: ForumAPI.Topic) => {
  if (import.meta.env.SSR) return computed(() => null)

  const data = useStorage('topic-info', JSON.stringify(topic), sessionStorage)

  return computed<ForumAPI.Topic>(() => {
    if (data.value == undefined) return null
    return JSON.parse(data.value)
  })
}
