import type { Ref } from 'vue'
import { computed, ref, unref } from 'vue'

export function useTextCollapse(contentRaw: string | Ref<string>, maxLength: number = 180) {
  const isExpanded = ref(false)
  const hasOverflow = computed(() => {
    const content = unref(contentRaw)
    return content && typeof content === 'string' ? content.replace(/!\[.*?\]\(.*?\)/g, '').length > maxLength : false
  })
  const collapseText = computed(() => {
    const content = unref(contentRaw)
    if (!content || typeof content !== 'string')
      return ''
    return isExpanded.value ? content : content.slice(0, maxLength)
  })

  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
  }

  return {
    isExpanded,
    hasOverflow,
    collapseText,
    toggleExpand,
  }
}
