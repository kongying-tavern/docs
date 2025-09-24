import { computed, onMounted, ref } from 'vue'
import { labels } from '@/apis/forum/gitee'
import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/composables/getTopicTagMap'

export interface UseTagsInputOptions {
  modelValue: string[]
  max: number
}

export function useTagsInput(options: UseTagsInputOptions) {
  const { modelValue, max } = options

  // Composables
  const topicTagMap = getTopicTagMap()
  const topicTagLabelGetter = getTopicTagLabelGetter()

  // State
  const tags = ref<string[]>([])
  const searchTerm = ref('')

  // Computed properties
  const isDisabled = computed(() => modelValue.length >= max)

  const filteredTags = computed(() =>
    tags.value.filter(i => !modelValue.includes(i)),
  )

  const tagList = computed(() => [
    {
      heading: 'Platform',
      list: filteredTags.value.filter(val => val.includes('PLATFORM')),
    },
    {
      heading: 'Type',
      list: filteredTags.value.filter(val => !val.includes('PLATFORM')),
    },
  ])

  // Methods
  function getLocalizedTagName(key: string): string {
    return topicTagMap.get(key)
      || topicTagMap.get(topicTagLabelGetter.getTag(key) ?? '')
      || key
  }

  function handleSelect(tag: string): void {
    if (typeof tag === 'string') {
      searchTerm.value = ''
      modelValue.push(tag)
    }
  }

  function handleDelete(tag: string): void {
    const index = modelValue.indexOf(tag)
    if (index > -1) {
      modelValue.splice(index, 1)
    }
  }

  async function loadTags(): Promise<void> {
    try {
      const data = await labels.getAllLabelsName()
      tags.value = data.filter(label => topicTagLabelGetter.isLabel(label))
    }
    catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  // Initialize on mount
  onMounted(loadTags)

  return {
    // State
    tags,
    searchTerm,

    // Computed
    isDisabled,
    filteredTags,
    tagList,

    // Methods
    getLocalizedTagName,
    handleSelect,
    handleDelete,
    loadTags,
  }
}
