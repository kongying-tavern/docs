import { computed, ref } from 'vue'

export function useTextCollapse(contentRaw: string, maxLength: number = 180) {
  const isExpanded = ref(false)
  const hasOverflow = computed(() => {
    return contentRaw.replace(/!\[.*?\]\(.*?\)/g, '').length > maxLength
  })
  const collapseText = computed(() => {
    return isExpanded.value ? contentRaw : contentRaw.slice(0, maxLength)
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
