import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getFallbackLabelDisplay } from '~/forum/services/forumLabelTaxonomy'
import { getTopicTagLabelGetter } from '~/forum/services/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/forum/services/getTopicTagMap'

export function useTopicTagDisplay() {
  const { t } = useI18n({ useScope: 'global' })
  const topicTagLabelGetter = getTopicTagLabelGetter()

  // 响应式：语言切换后按新 locale 重建映射，标签显示名随语言即时更新
  const topicTagMap = computed(() => getTopicTagMap(t))

  function getTagDisplay(label: string | null | undefined): string {
    if (!label)
      return ''
    return topicTagMap.value.get(label)
      ?? topicTagMap.value.get(topicTagLabelGetter.getTag(label) ?? '')
      ?? getFallbackLabelDisplay(label)
  }

  return { getTagDisplay }
}
