import type ForumAPI from '@/apis/forum/api'
import { isError } from 'lodash-es'
import { type Ref, computed, ref, watch } from 'vue'
import {
  type PaginationOptions,
  type Service,
  usePagination,
  useRequestProvider,
} from 'vue-request'

export const useLoadMore = <R, P extends unknown[] = any>(
  service: Service<ForumAPI.PaginatedResult<R>, P>,
  options?: PaginationOptions<ForumAPI.PaginatedResult<R>, P>,
) => {
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

  const loadMore = () => {
    if (noMore.value || error.value !== undefined) return
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
    () => !noMore.value && !isFirstLoad.value && !isError(error),
  )
  const noMore = computed(() => current.value >= totalPage.value)
  const loadingMore = computed(() => {
    if (current.value === 1 && loadingMore.value) return false
    if (noMore.value) return false
    return loading.value
  })

  const unshiftData = (data: DataArray) =>
    // @ts-ignore
    mutate((oldData: { data: P }) => {
      return {
        data: [data, ...oldData.data],
        total: total.value,
        pageSize: pageSize.value,
        current: current.value,
        totalPage: totalPage.value,
      }
    })

  watch(paginationData as unknown as GITEE.PaginationParams<R>, (newValue) => {
    if (newValue && Array.isArray(newValue.data)) {
      data.value.push(...newValue.data)
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
