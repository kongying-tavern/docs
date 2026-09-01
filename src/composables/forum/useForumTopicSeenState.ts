import { createGlobalState } from '@vueuse/core'
import { shallowRef } from 'vue'
import { markForumTopicSeen, readForumTopicSeenMap } from '~/services/forum/forumTopicSeenState'

export const useForumTopicSeenState = createGlobalState(() => {
  const seenAtById = shallowRef(readSeenMap())

  function readSeenMap(): Map<string, number> {
    if (typeof window === 'undefined')
      return new Map()
    try {
      return readForumTopicSeenMap(localStorage)
    }
    catch {
      return new Map()
    }
  }

  function markSeen(topicId: string | number): void {
    if (typeof window === 'undefined')
      return
    try {
      seenAtById.value = markForumTopicSeen(localStorage, String(topicId))
    }
    catch {
      seenAtById.value = new Map(seenAtById.value)
      seenAtById.value.set(String(topicId), Date.now())
    }
  }

  function seenAt(topicId: string | number): number {
    return seenAtById.value.get(String(topicId)) ?? 0
  }

  return { markSeen, seenAt }
})
