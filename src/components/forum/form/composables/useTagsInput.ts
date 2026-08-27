import { computed, onMounted, ref } from 'vue'
import { labels } from '@/apis/forum/gitee'
import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/composables/getTopicTagMap'
import { addTagToModel, removeTagFromModel } from '~/services/forum/form/topicTagModel'

export interface UseTagsInputOptions {
  modelValue: import('vue').Ref<string[]>
  max: number
}

export function useTagsInput(options: UseTagsInputOptions) {
  const { modelValue, max } = options

  const topicTagMap = getTopicTagMap()
  const topicTagLabelGetter = getTopicTagLabelGetter()

  const tags = ref<string[]>([])
  const searchTerm = ref('')
  const isLoading = ref(false)
  const loadError = ref<Error>()

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
    isLoading.value = true
    loadError.value = undefined
    try {
      const data = await labels.getAllLabelsName()
      tags.value = data.filter(label => topicTagLabelGetter.isLabel(label))
    }
    catch (error) {
      loadError.value = error instanceof Error ? error : new Error('Tag loading failed.')
    }
    finally {
      isLoading.value = false
    }
  }

  onMounted(loadTags)

  return {
    tags,
    searchTerm,
    isLoading,
    loadError,

    isDisabled,
    filteredTags,
    tagList,

    getLocalizedTagName,
    handleSelect,
    handleDelete,
    loadTags,
  }
}
