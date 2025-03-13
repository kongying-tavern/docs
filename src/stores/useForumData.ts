import type ForumAPI from '@/apis/forum/api'
import { issues } from '@/apis/forum/gitee'
import { useLoadMore } from '@/hooks/useLoadMore'
import { useLocalized } from '@/hooks/useLocalized'
import { watchOnce } from '@vueuse/core'
import { uniqBy } from 'lodash-es'
import { defineStore } from 'pinia'
import { useData } from 'vitepress'
import { computed, onMounted, reactive, ref, toRefs, watch } from 'vue'
import { useRequest } from 'vue-request'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { getValidFilter } from '~/composables/getValidFilter'
import { handleError } from '~/composables/handleError'

const typeLabelGetter = getTopicTypeLabelGetter()

export const filterSet = new Set(['FEAT', 'BUG', 'ALL', 'CLOSED'])
export type FilterType = 'FEAT' | 'BUG' | 'ALL' | 'CLOSED'

export const useForumData = defineStore('forum-data', () => {
  const userSubmittedTopic = ref<ForumAPI.Topic[]>([])
  const topics = ref<ForumAPI.Topic[]>([])
  const isSearching = ref(false)
  const defaultPageSize = 20
  const pagination = reactive<{
    sort: string
    page: number
    filter: FilterType
  }>({
    sort: 'created',
    page: 1,
    filter: getValidFilter() || 'ALL',
  })

  const { message } = useLocalized()
  const { lang } = useData()

  const {
    data,
    runAsync,
    loading,
    loadMore,
    noMore,
    initialData,
    error,
    totalPage,
    total,
    isFirstLoad,
    canLoadMore,
  } = useLoadMore(issues.getTopics, {
    manual: true,
  })

  const {
    data: annData,
    loading: annLoading,
    error: annLoadError,
    runAsync: loadAnn,
  } = useRequest(issues.getAnnouncementList, { manual: true })

  const refreshData = async (q?: string | string[]) => {
    if (import.meta.env.SSR)
      return null
    await runAsync(
      {
        current: pagination.page,
        sort: pagination.sort,
        pageSize: defaultPageSize,
        filter: ['CLOSED', 'ALL'].includes(pagination.filter)
          ? null
          : typeLabelGetter.getLabel(pagination.filter) || '',
      },
      pagination.filter === 'CLOSED' ? 'progressing' : 'open',
      q ? String(q) : undefined,
    )
  }

  const switchTopicFilter = (val = pagination.filter) => {
    if (!val)
      return
    pagination.filter = val
  }

  const searchTopics = async (q: string | string[]) => {
    initialData()

    if (q.length === 0)
      return (isSearching.value = false)

    isSearching.value = true

    return refreshData(q)
  }

  const getTopic = (id: string | number) => {
    return [...topics.value, ...userSubmittedTopic.value].find(
      topic => topic.id === id,
    )
  }

  const getTopicIndex = (id: string | number) => {
    const index = [...topics.value, ...userSubmittedTopic.value].findIndex(
      topic => topic.id === id,
    )
    return index === -1 ? false : index
  }

  const removeTopic = (id: string | number) => {
    topics.value = topics.value.filter(topic => topic.id !== id)
    userSubmittedTopic.value = userSubmittedTopic.value.filter(
      topic => topic.id !== id,
    )
  }

  const addTopic = (id: string | number) => {
    const targetTopic = getTopic(id)
    if (targetTopic)
      return (topics.value = [targetTopic, ...topics.value])
    return null
  }

  const loadStateMessage = computed(() => {
    if (loading.value)
      return message.value.forum.loadMore
    if (error.value)
      return message.value.forum.loadError
    if (topics.value.length === 0)
      return 'No Data'
    if (noMore.value)
      return message.value.forum.noMore
  })

  const initData = () => {
    if (!import.meta.env.SSR)
      Promise.all([loadAnn(), refreshData()])
  }

  onMounted(() => {
    initData()
  })

  watch(
    loading,
    () => {
      topics.value = data.value
    },
    {
      immediate: true,
    },
  )

  watchOnce(
    annLoading,
    () => {
      if (annData.value?.length === 0)
        return
      topics.value = uniqBy([...(annData.value || []), ...topics.value], 'id')
    },
    {
      immediate: true,
    },
  )

  watch(
    () => error.value || annLoadError.value,
    () => {
      handleError(error.value, message, {
        errorMessage: error.value
          ? message.value.forum.loadError
          : message.value.forum.topic.type.ann + message.value.forum.loadError,
      })
    },
  )

  watch(
    () => [pagination.sort, pagination.filter, lang.value],
    async () => {
      initialData()
      await refreshData()
    },
  )

  watch(isSearching, async () => {
    if (isSearching.value)
      return
    initialData()
    await refreshData()
  })

  return {
    // data
    userSubmittedTopic,
    annData,
    topics,

    // state
    loading,
    noMore,
    total,
    totalPage,
    error,
    isSearching,
    ...toRefs(pagination),

    // getters
    loadStateMessage,
    isFirstLoad,
    canLoadMore,

    // actions
    initialData,
    searchTopics,
    switchTopicFilter,
    refreshData,
    loadMore,
    loadAnn,
    getTopic,
    addTopic,
    getTopicIndex,
    removeTopic,
  }
})
