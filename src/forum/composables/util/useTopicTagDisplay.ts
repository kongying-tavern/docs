import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getTopicTagLabelGetter } from '~/forum/services/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/forum/services/getTopicTagMap'
import { getFallbackLabelDisplay } from '~/forum/services/labelTaxonomy'

export function useTopicTagDisplay() {
  const { message } = useLocalized()
  const topicTagLabelGetter = getTopicTagLabelGetter()

  // 响应式：语言切换后按新 locale 重建映射，标签显示名随语言即时更新
  const topicTagMap = computed(() => getTopicTagMap(message))

  function getTagDisplay(label: string | null | undefined): string {
    if (!label)
      return ''
    return topicTagMap.value.get(label)
      ?? topicTagMap.value.get(topicTagLabelGetter.getTag(label) ?? '')
      ?? getFallbackLabelDisplay(label)
  }

  return { getTagDisplay }
}
