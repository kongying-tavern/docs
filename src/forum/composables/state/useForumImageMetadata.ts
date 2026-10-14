import type { ForumImageResource } from '~/forum/services/forumImageResource'
import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useForumImageMetadata = createGlobalState(() => {
  const image = ref<ForumImageResource>()
  const open = ref(false)
  function inspect(resource: ForumImageResource) {
    image.value = { ...resource }
    open.value = true
  }
  return { image, open, inspect }
})
