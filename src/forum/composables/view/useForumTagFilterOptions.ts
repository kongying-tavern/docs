import { computed, onMounted } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumLabelStore } from '~/forum/composables/state/useForumLabelStore'
import { useTopicTagDisplay } from '~/forum/composables/util/useTopicTagDisplay'
import { getTopicTagLabelGetter } from '~/forum/services/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/forum/services/getTopicTagMap'

export function useForumTagFilterOptions() {
  const { message } = useLocalized()
  const labelStore = useForumLabelStore()
  const labelGetter = getTopicTagLabelGetter()
  const { getTagDisplay } = useTopicTagDisplay()
  const options = computed(() => {
    const labels = [...getTopicTagMap(message).keys()].map(tag => labelGetter.getLabel(tag) ?? tag)
    labels.push(...labelStore.categoryLabels.value.map(label => label.name))
    return [...new Set(labels)].map(id => ({ id, label: getTagDisplay(id) }))
  })

  onMounted(() => {
    void labelStore.loadLabels()
  })

  return { options }
}
