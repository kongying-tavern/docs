import type ForumAPI from '@/apis/forum/api'
import type { Ref } from 'vue'
import { issues } from '@/apis/forum/gitee'
import { useLoadMore } from '@/hooks/useLoadMore'
import { useLocalized } from '@/hooks/useLocalized'
import { watchOnce } from '@vueuse/core'
import { uniqBy } from 'lodash-es'
import { defineStore } from 'pinia'
import { useData, useRouter } from 'vitepress'
import { computed, ref, watch } from 'vue'
import { useRequest } from 'vue-request'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { handleError } from '~/composables/handleError'

const DEFAULT_SORT = 'created' as ForumAPI.SortMethod
const DEFAULT_PAGE = 1
const DEFAULT_FILTER = 'all'
const DEFAULT_CREATOR = null
const DEFAULT_PAGE_SIZE = 20

const typeLabelGetter = getTopicTypeLabelGetter()
const filterSet = new Set(['feat', 'bug', 'closed', 'all'])

export const useForumData = defineStore('forum-data', () => {
  const userSubmittedTopic = ref<ForumAPI.Topic[]>([])
  const topics = ref<ForumAPI.Topic[]>([])
  const { route, go } = useRouter()

  const isSearching = ref(false)
  const isInitialized = ref(false)
  const isResetting = ref(false)

  const sort = ref<ForumAPI.SortMethod>(DEFAULT_SORT)
  const page = ref<number>(DEFAULT_PAGE)
  const filter = computed<ForumAPI.FilterBy>({
    get: () => {
      return filterSet.has(route.data?.params?.type) ? route.data?.params?.type : DEFAULT_FILTER
    },
    set: (value) => {
      if (isResetting.value)
        return
      const parts = location.pathname.split('/').filter(Boolean)
      if (parts.length && filterSet.has(parts.at(-1)!))
        parts.pop()

      go(`/${parts.join('/')}${parts.length ? '/' : ''}${value === 'all' ? '' : value}`)
    },
  })

  const creator = ref<string | null>(DEFAULT_CREATOR)

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
    data: pinnedTopicData,
    loading: pinnedTopicLoading,
    error: pinnedTopicLoadError,
    runAsync: loadPinnedTopicData,
  } = useRequest(issues.getPinnedList, { manual: true })

  const refreshData = async (q?: string | string[]) => {
    if (import.meta.env.SSR)
      return null
    await runAsync(
      {
        current: page.value,
        sort: sort.value,
        pageSize: DEFAULT_PAGE_SIZE,
        creator: creator.value,
        filter: ['closed', 'all'].includes(filter.value)
          ? null
          : typeLabelGetter.getLabel(filter.value) || '',
      },
      filter.value === 'closed' ? 'progressing' : 'open',
      q ? String(q) : undefined,
    )
  }

  const loadForumData = async () => {
    if (import.meta.env.SSR || isInitialized.value)
      return null
    try {
      isInitialized.value = true
      await Promise.all([loadPinnedTopicData(), refreshData()])
    }
    catch (err) {
      isInitialized.value = false
      throw err
    }
  }

  const searchTopics = async (q: string | string[]) => {
    initialData()

    if (q.length === 0)
      return (isSearching.value = false)

    isSearching.value = true
    return await refreshData(q)
  }

  const getAllTopics = computed(() => [...topics.value, ...userSubmittedTopic.value])

  const getTopic = (id: string | number) => getAllTopics.value.find(topic => topic.id === id)

  const getTopicIndex = (id: string | number) => {
    const topicsIndex = topics.value.findIndex(topic => topic.id === id)
    if (topicsIndex !== -1)
      return { list: 'topics', index: topicsIndex }

    const userTopicsIndex = userSubmittedTopic.value.findIndex(topic => topic.id === id)
    if (userTopicsIndex !== -1)
      return { list: 'userSubmitted', index: userTopicsIndex }

    return false
  }

  const updateTopicInList = (
    listRef: Ref<ForumAPI.Topic[]>,
    index: number,
    updates: Partial<ForumAPI.Topic>,
  ) => {
    if (index >= 0 && index < listRef.value.length) {
      const updatedTopic = { ...listRef.value[index], ...updates }
      listRef.value[index] = updatedTopic
      return true
    }
    return false
  }

  const updateTopic = (
    id: string | number,
    updates: Partial<ForumAPI.Topic>,
  ): boolean => {
    const result = getTopicIndex(id)
    if (!result)
      return false

    if (result.list === 'topics') {
      return updateTopicInList(topics, result.index, updates)
    }
    else {
      return updateTopicInList(userSubmittedTopic, result.index, updates)
    }
  }

  const removeTopic = (id: string | number) => {
    const filterById = (topic: ForumAPI.Topic) => topic.id !== id
    topics.value = topics.value.filter(filterById)
    userSubmittedTopic.value = userSubmittedTopic.value.filter(filterById)
  }

  const addTopic = (id: string | number) => {
    const targetTopic = getTopic(id)
    if (!targetTopic)
      return false

    topics.value = [{ ...targetTopic }, ...topics.value]
    return true
  }

  const replaceTopicTags = (id: string | number, newTags: string[]) =>
    updateTopic(id, { tags: newTags })

  const changeTopicPinState = (id: string | number, state: boolean) =>
    updateTopic(id, { pinned: state })

  const changeTopicType = (id: string | number, newType: Exclude<ForumAPI.TopicType, null>) =>
    updateTopic(id, { type: newType })

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

  const resetState = async (resetOptions?: { reloadData?: boolean }) => {
    isResetting.value = true

    userSubmittedTopic.value = []
    topics.value = []
    isSearching.value = false
    isInitialized.value = false
    initialData()

    filter.value = DEFAULT_FILTER
    sort.value = DEFAULT_SORT
    page.value = DEFAULT_PAGE
    creator.value = DEFAULT_CREATOR

    if (resetOptions?.reloadData) {
      await Promise.resolve()
      await loadForumData()
    }

    isResetting.value = false
  }

  watch(data, () => {
    topics.value = uniqBy(data.value, 'id')
  }, { immediate: true })

  watchOnce(
    pinnedTopicLoading,
    () => {
      if (pinnedTopicData.value?.length === 0)
        return
      topics.value = uniqBy([...(pinnedTopicData.value || []), ...topics.value], 'id')
    },
  )

  watch(
    () => error.value || pinnedTopicLoadError.value,
    () => {
      handleError(error.value, message, {
        errorMessage: error.value
          ? message.value.forum.loadError
          : message.value.forum.topic.type.ann + message.value.forum.loadError,
      })
    },
  )

  watch(
    () => [sort.value, filter.value, lang.value, creator.value],
    async () => {
      if (isResetting.value)
        return
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
    pinnedTopicData,
    topics,

    // state
    loading,
    noMore,
    total,
    totalPage,
    error,
    isSearching,
    sort,
    page,
    filter,
    creator,

    // getters
    loadStateMessage,
    isFirstLoad,
    canLoadMore,

    // actions
    initialData,
    searchTopics,
    refreshData,
    loadMore,
    loadPinnedTopicData,
    getTopic,
    addTopic,
    changeTopicType,
    replaceTopicTags,
    changeTopicPinState,
    getTopicIndex,
    removeTopic,
    loadForumData,
    resetState,
  }
})
