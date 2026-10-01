import type { Ref } from 'vue'
import { computed, ref, unref } from 'vue'

export function useTextCollapse(contentRaw: string | Ref<string>, maxLength: number = 180) {
  const isExpanded = ref(false)
  const hasOverflow = computed(() => {
    const content = unref(contentRaw)
    return typeof content === 'string' && content.length > maxLength
  })

  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
  }

  return {
    isExpanded,
    hasOverflow,
    toggleExpand,
  }
}
