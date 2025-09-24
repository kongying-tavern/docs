import type ForumAPI from '@/apis/forum/api'
import type { Ref } from 'vue'
import { computed } from 'vue'

export function useTopicImageGrid(topic: Ref<ForumAPI.Topic | undefined>) {
  const gridClass = computed(() => {
    if (!topic.value)
      return ''
    const count = topic.value.content.images?.length || 0
    if (count === 1)
      return 'grid-cols-1'
    if (count === 2)
      return 'grid-cols-2'
    if (count === 3 || count >= 4)
      return 'grid-cols-2'
    return 'grid-cols-1'
  })

  function imageClass(index: number) {
    if (!topic.value)
      return ''
    const count = topic.value.content.images?.length || 0
    if (count === 3 && index === 2)
      return 'col-span-2 aspect-video'
    return 'aspect-square'
  }

  return {
    gridClass,
    imageClass,
  }
}
