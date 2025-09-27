import type { PaginationOptions, Service } from 'vue-request'
import type ForumAPI from '@/apis/forum/api'
import { isError } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import { usePagination, useRequestProvider } from 'vue-request'

export function useLoadMore<R extends unknown[], P extends unknown[] = unknown[]>(
  service: Service<ForumAPI.PaginatedResult<R>, P>,
  options?: PaginationOptions<ForumAPI.PaginatedResult<R>, P>,
) {
  // SSR guard - return mock implementation to avoid vue-request issues
  if (import.meta.env.SSR) {
    return {
      data: ref([]),
      loading: ref(false),
      mutate: () => {},
      total: ref(0),
      totalPage: ref(0),
      current: ref(1),
      pageSize: ref(10),
      error: ref(undefined),
      runAsync: async () => ({ data: [], total: 0, totalPage: 0 }),
      noMore: computed(() => true),
      loadMore: () => {},
      initialData: () => {},
      isFirstLoad: computed(() => false),
      canLoadMore: computed(() => false),
      loadingMore: computed(() => false),
    }
  }

  useRequestProvider({
    loadingDelay: 400,
    loadingKeep: 1000,
    pagination: {
      currentKey: 'page',
      pageSizeKey: 'pageSize',
      totalKey: 'data.total',
    },
  })

  type ServiceResponseData = R extends { data: infer T } ? T : never
  type DataArray = ServiceResponseData extends Array<infer U> ? U : never

  const {
    data: paginationData,
    loading,
    mutate,
    total,
    totalPage,
    current,
    pageSize,
    error,
    ...rest
  } = usePagination(service, options)

  const data = ref<R | []>([])

  const noMore = computed(() => current.value >= totalPage.value)

  const loadMore = () => {
    if (noMore.value || error.value !== undefined || loading.value)
      return
    current.value++
  }

  const initialData = () => {
    data.value = []
    current.value = 1
  }

  const isFirstLoad = computed(() =>
    Boolean(data.value.length === 0 && !noMore.value && !isError(error.value)),
  )
  const canLoadMore = computed(
    () => !noMore.value && !isFirstLoad.value && !isError(error.value),
  )
  const loadingMore = computed(() => {
    if (current.value === 1 && loadingMore.value)
      return false
    if (noMore.value)
      return false
    return loading.value
  })

  const unshiftData = (data: DataArray) =>
    mutate((oldData: ForumAPI.PaginatedResult<R>) => {
      return {
        ...oldData,
        data: [data, ...oldData.data] as unknown as R,
      }
    })

  watch(paginationData, (newValue) => {
    if (newValue && Array.isArray(newValue.data)) {
      data.value = [...data.value, ...newValue.data]
    }
  }, { deep: true })

  return {
    data,
    loading,
    unshiftData,
    total,
    loadingMore,
    totalPage,
    current,
    pageSize,
    error,
    loadMore,
    mutate,
    initialData,
    noMore,
    isFirstLoad,
    canLoadMore,
    ...rest,
  }
}
