import type ForumAPI from '@/apis/forum/api'
import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useTopicTagsEditor = createGlobalState(() => {
  const open = ref(false)
  const topic = ref<ForumAPI.Topic | null>(null)

  function toggleTopicTagsEditorDialog() {
    open.value = !open.value
  }

  function openTopicTagsEditorDialog(newTopic: ForumAPI.Topic) {
    topic.value = newTopic
    open.value = true
  }

  return {
    open,
    topic,
    openTopicTagsEditorDialog,
    toggleTopicTagsEditorDialog,
  }
})
