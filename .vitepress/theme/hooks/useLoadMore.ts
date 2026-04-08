import type ForumAPI from '@/apis/forum/api'
import { useQuery, useQueryCache } from '@pinia/colada'
import { computed, ref, shallowRef, watch } from 'vue'

export interface LoadMoreOptions {
  manual?: boolean
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  totalPage: number
}

export function useLoadMore<T, P extends unknown[] = unknown[]>(
  service: (current: number, ...args: P) => Promise<ForumAPI.PaginatedResult<T[]>>,
  options: LoadMoreOptions = {},
) {
  const { pageSize = 20 } = options

  // SSR guard - return mock implementation
  if (import.meta.env.SSR) {
    return {
      data: shallowRef<T[]>([]),
      loading: ref(false),
      mutate: () => {},
      total: ref(0),
      totalPage: ref(0),
      current: ref(1),
      pageSize: ref(pageSize),
      error: shallowRef<Error | undefined>(undefined),
      runAsync: async () => ({ data: [], total: 0, totalPage: 0 }),
      noMore: computed(() => true),
      loadMore: async () => {},
      initialData: () => {},
      isFirstLoad: computed(() => false),
      canLoadMore: computed(() => false),
      loadingMore: computed(() => false),
      unshiftData: () => {},
    }
  }

  // State
  const current = ref(1)
  const accumulatedData = shallowRef<T[]>([])
  const baseParams = shallowRef<P | null>(null) // 基础参数（不含页码）
  const isLoadingMore = ref(false)
  const hasLoaded = ref(false)
  const queryCache = useQueryCache()

  // Query key factory - 包含 current 以便分页时触发新请求
  const queryKey = () => ['loadMore', current.value, JSON.stringify(baseParams.value)] as const

  // Query
  const {
    data: paginationData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    key: queryKey,
    query: async () => {
      if (!baseParams.value) {
        return { data: [] as T[], total: 0, totalPage: 0 }
      }
      // 关键：service 的第一个参数是 current，后面是基础参数
      return await service(current.value, ...baseParams.value)
    },
    enabled: () => baseParams.value !== null,
    staleTime: 1000 * 60, // 1分钟内不重新请求
  })

  // Computed
  const total = computed(() => paginationData.value?.total ?? 0)
  const totalPage = computed(() => paginationData.value?.totalPage ?? 0)

  // 只有加载完成后才判断是否有更多
  const noMore = computed(() => {
    if (!hasLoaded.value)
      return false
    return current.value >= totalPage.value
  })

  const isFirstLoad = computed(() =>
    accumulatedData.value.length === 0 && !hasLoaded.value && !error.value,
  )

  const canLoadMore = computed(
    () => hasLoaded.value && !noMore.value && !error.value && !isLoading.value && !isLoadingMore.value,
  )

  const loadingMore = computed(() => isLoadingMore.value || (isLoading.value && current.value > 1))

  // Watch pagination data to accumulate
  watch(paginationData, (newValue) => {
    if (newValue && Array.isArray(newValue.data)) {
      hasLoaded.value = true

      if (current.value === 1) {
        accumulatedData.value = [...newValue.data]
      }
      else {
        accumulatedData.value = [...accumulatedData.value, ...newValue.data]
      }
      isLoadingMore.value = false
    }
  }, { deep: true })

  // Actions - 参数不包含页码
  async function runAsync(...args: P): Promise<PaginatedResult<T>> {
    baseParams.value = args as P
    current.value = 1
    accumulatedData.value = []
    hasLoaded.value = false

    const result = await refetch()
    return {
      data: result.data?.data ?? [],
      total: result.data?.total ?? 0,
      totalPage: result.data?.totalPage ?? 0,
    }
  }

  async function loadMore(): Promise<void> {
    if (noMore.value || error.value || isLoading.value || isLoadingMore.value)
      return

    isLoadingMore.value = true
    current.value++
    // key 变化后会自动触发新的查询
  }

  function initialData() {
    accumulatedData.value = []
    current.value = 1
    baseParams.value = null
    isLoadingMore.value = false
    hasLoaded.value = false
  }

  function mutate(newData: ForumAPI.PaginatedResult<T[]>) {
    const key = queryKey()
    queryCache.setQueryData(key, newData)
  }

  function unshiftData(item: T) {
    accumulatedData.value = [item, ...accumulatedData.value]
  }

  return {
    data: accumulatedData,
    loading: isLoading,
    mutate,
    total,
    loadingMore,
    totalPage,
    current,
    pageSize: ref(pageSize),
    error,
    loadMore,
    runAsync,
    initialData,
    noMore,
    isFirstLoad,
    canLoadMore,
    unshiftData,
  }
}
