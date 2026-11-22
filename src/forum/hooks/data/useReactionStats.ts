import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export type ReactionStatsTarget
  = | { kind: 'topic', topicId: string }
    | { kind: 'comment', topicId: string, commentId: string }

export const useReactionStats = createGlobalState(() => {
  const open = ref(false)
  const target = ref<ReactionStatsTarget | null>(null)

  function openReactionStatsDialog(newTarget: ReactionStatsTarget) {
    target.value = newTarget
    open.value = true
  }

  return {
    open,
    target,
    openReactionStatsDialog,
  }
})
