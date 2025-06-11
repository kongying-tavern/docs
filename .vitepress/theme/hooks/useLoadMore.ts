import type ForumAPI from '@/apis/forum/api'
import type { PaginationOptions, Service } from 'vue-request'
import { isError } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import { usePagination, useRequestProvider } from 'vue-request'

export function useLoadMore<R extends any[], P extends unknown[] = any>(
  service: Service<ForumAPI.PaginatedResult<R>, P>,
  options?: PaginationOptions<ForumAPI.PaginatedResult<R>, P>,
) {
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

  watch(paginationData as unknown as GITEE.PaginationParams<R>, (newValue) => {
    if (newValue && Array.isArray(newValue.data)) {
      data.value = [...data.value, ...newValue.data]
    }
  })

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
