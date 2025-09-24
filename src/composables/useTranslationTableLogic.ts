import type { SortOrder } from '~/constants/translationConstants'
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { useDebounceFn } from '@vueuse/core'
import { orderBy } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import { PAGINATION_CONFIG, SEARCH_DEBOUNCE_TIME } from '~/constants/translationConstants'

interface UseTranslationTableLogicParams {
  translationEntries: () => TranslationEntry[]
  availableLocales: () => string[]
  categories: () => string[]
}

export function useTranslationTableLogic({
  translationEntries,
  availableLocales,
  categories,
}: UseTranslationTableLogicParams) {
  // 搜索和过滤状态
  const searchQuery = ref('')
  const selectedCategory = ref('all')
  const currentPage = ref(1)
  const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE

  // 排序状态
  const sortBy = ref('')
  const sortOrder = ref<SortOrder>('asc')

  // 防抖搜索
  const debouncedSearch = useDebounceFn((value: string) => {
    searchQuery.value = value
    currentPage.value = 1
  }, SEARCH_DEBOUNCE_TIME)

  // 过滤后的条目
  const filteredEntries = computed(() => {
    let entries = translationEntries()

    // 按分类过滤
    if (selectedCategory.value !== 'all') {
      entries = entries.filter(entry => entry.category === selectedCategory.value)
    }

    // 按搜索词过滤
    if (searchQuery.value.trim()) {
      const searchTerm = searchQuery.value.toLowerCase()
      entries = entries.filter((entry) => {
        // 搜索键名和路径
        if (entry.key.toLowerCase().includes(searchTerm))
          return true
        if (entry.path.toLowerCase().includes(searchTerm))
          return true

        // 搜索翻译内容
        return availableLocales().some(locale =>
          entry.translations[locale]?.toLowerCase().includes(searchTerm),
        )
      })
    }

    // 排序处理
    if (sortBy.value) {
      entries = [...entries]

      if (sortBy.value === 'status') {
        // 按状态排序：已删除 < 已修改 < 正常
        entries = orderBy(entries, [
          entry => entry.isDeleted ? 0 : (entry.isModified ? 1 : 2),
        ], [sortOrder.value])
      }
      else if (sortBy.value === 'path') {
        entries = orderBy(entries, ['path'], [sortOrder.value])
      }
      else if (sortBy.value === 'category') {
        entries = orderBy(entries, ['category'], [sortOrder.value])
      }
      else if (sortBy.value.startsWith('translation_')) {
        // 按翻译内容排序
        const locale = sortBy.value.replace('translation_', '')
        entries = orderBy(entries, [
          entry => entry.translations[locale] || '',
        ], [sortOrder.value])
      }
    }

    return entries
  })

  // 分页相关计算
  const totalPages = computed(() => Math.ceil(filteredEntries.value.length / pageSize))

  const paginatedEntries = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return filteredEntries.value.slice(start, end)
  })

  // 统计信息
  const stats = computed(() => {
    const entries = translationEntries()
    return {
      total: entries.length,
      deleted: entries.filter(e => e.isDeleted).length,
      filtered: filteredEntries.value.length,
      currentCategory: selectedCategory.value,
      totalCategories: categories().length - 1, // 排除 'all'
      supportedLocales: availableLocales(),
    }
  })

  // 排序处理函数
  function handleSort(column: string, order: 'asc' | 'desc') {
    sortBy.value = column
    sortOrder.value = order
    currentPage.value = 1 // 重置到第一页
  }

  // 分页处理函数
  function handlePageChange(page: number) {
    currentPage.value = page
  }

  // 更新搜索词
  function updateSearchQuery(value: string) {
    debouncedSearch(value)
  }

  // 更新分类过滤
  function updateSelectedCategory(category: string) {
    selectedCategory.value = category
    currentPage.value = 1
  }

  // 监听分类和搜索变化，重置分页
  watch([selectedCategory], () => {
    currentPage.value = 1
  })

  return {
    // 状态
    searchQuery,
    selectedCategory,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,

    // 计算属性
    filteredEntries,
    paginatedEntries,
    totalPages,
    stats,

    // 方法
    handleSort,
    handlePageChange,
    updateSearchQuery,
    updateSelectedCategory,
    debouncedSearch,
  }
}
