import { computed, onMounted, ref } from 'vue'
import { labels } from '@/apis/forum/gitee'
import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/composables/getTopicTagMap'
import { addTagToModel, removeTagFromModel } from './topicTagModel'

export interface UseTagsInputOptions {
  modelValue: import('vue').Ref<string[]>
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
  const isDisabled = computed(() => modelValue.value.length >= max)

  const filteredTags = computed(() =>
    tags.value.filter(i => !modelValue.value.includes(i)),
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
      addTagToModel(modelValue, tag, max)
    }
  }

  function handleDelete(tag: string): void {
    removeTagFromModel(modelValue, tag)
  }

  async function loadTags(): Promise<void> {
    try {
      const data = await labels.getAllLabelsName()
      tags.value = data.filter(label => topicTagLabelGetter.isLabel(label))
    }
    catch {
      // Failed to load tags - use empty array
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
