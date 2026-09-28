import { computed, onMounted, ref } from 'vue'
import { useForumLabelStore } from '~/forum/composables/state/useForumLabelStore'
import { useTopicTagDisplay } from '~/forum/composables/util/useTopicTagDisplay'
import { addTagToModel, removeTagFromModel } from '~/forum/services/form/topicTagModel'

export interface UseTagsInputOptions {
  modelValue: import('vue').Ref<string[]>
  max: number
}

export function useTagsInput(options: UseTagsInputOptions) {
  const { modelValue, max } = options

  const { getTagDisplay } = useTopicTagDisplay()
  const labelStore = useForumLabelStore()

  const searchTerm = ref('')
  const loadError = ref<Error>()

  // 候选标签来自仓库实时 label 列表（会话级共享缓存）：
  // 管理页增删的 CATA- 标签会即时反映到这里，不再依赖静态映射表
  const tags = computed(() => labelStore.categoryLabels.value.map(label => label.name))
  const isLoading = computed(() => labelStore.isLoading.value)

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
    return getTagDisplay(key)
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
    loadError.value = undefined
    await labelStore.loadLabels()
    if (labelStore.error.value)
      loadError.value = labelStore.error.value
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
