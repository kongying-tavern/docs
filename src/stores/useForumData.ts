import { issues } from '@/apis/forum/gitee'
import { computed, onMounted, reactive, ref, toRefs, watch } from 'vue'
import { useLoadMore } from '@/hooks/useLoadMore'
import { useData } from 'vitepress'
import { defineStore } from 'pinia'
import { isArray, uniqBy } from 'lodash-es'
import { useRequest } from 'vue-request'
import { watchOnce } from '@vueuse/core'
import { useLocalized } from '@/hooks/useLocalized'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { handleError } from '~/composables/handleError'
import { getValidFilter } from '~/composables/getValidFilter'
import { convertMultipleToMarkdown } from '~/components/forum/utils'
import { getForumLocaleLabelGetter } from '~/composables/getForumLocaleGetter'
import { composeTopicBody } from '~/composables/composeTopicBody'
import { toast } from 'vue-sonner'

import type ForumAPI from '@/apis/forum/api'

const typeLabelGetter = getTopicTypeLabelGetter()
const localeLabelGetter = getForumLocaleLabelGetter()

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
    if (import.meta.env.SSR) return null
    const data = await runAsync(
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
    if (!val) return
    pagination.filter = val
  }

  const submitTopic = () => {
    const {
      data: submittedTopic,
      runAsync: asyncSubmit,
      loading: submitLoading,
      error: submitError,
    } = useRequest(issues.postTopic, {
      manual: true,
    })

    // 因为 Gitee 接口不识别普通用户上传的 tags(labels)，为了前端预览正常这里手动缓存并在后面与接口返回值合并
    let userSelectedTags: string[] | null = null

    const submitData = (options: ForumAPI.CreateTopicOption) => {
      const { body, title, tags, type } = options

      const bodyText = () => {
        if (!isArray(body?.images)) return body.text
        return (
          body.text +
          convertMultipleToMarkdown(
            body.images
              .map((image) => image.url)
              .filter((url): url is string => !!url),
          )
        )
      }

      userSelectedTags = tags

      const labels = [
        import.meta.env.DEV ? 'DEV-TEST' : 'WEB-FEEDBACK',
        typeLabelGetter.getLabel(type),
        localeLabelGetter.getLabel(lang.value.substring(0, 2).toUpperCase()),
        ...tags,
      ]

      const newTopic = {
        body: composeTopicBody(bodyText(), { labels }),
        title: `${type}:${title}`,
        labels: labels.join(','),
      }

      const result = asyncSubmit(newTopic)

      toast.promise(result, {
        loading: message.value.forum.publish.publishLoading,
        success: (data: ForumAPI.Topic) =>
          `${message.value.forum.publish.publishSuccess}${data.title}`,
        error: (error: Error) =>
          `${message.value.forum.publish.publishFail} (${error.message})`,
      })
    }

    watch(submittedTopic, () => {
      if (!submittedTopic.value) return
      userSubmittedTopic.value = [
        {
          ...submittedTopic.value,
          ...(userSelectedTags ? { tags: userSelectedTags } : {}),
        },
        ...userSubmittedTopic.value,
      ]
    })

    return {
      data: submittedTopic,
      loading: submitLoading,
      error: submitError,
      runAsync: submitData,
    }
  }

  const searchTopics = async (q: string | string[]) => {
    initialData()

    if (q.length === 0) return (isSearching.value = false)

    isSearching.value = true

    return refreshData(q)
  }

  const getTopic = (id: string | number) => {
    return [...topics.value, ...userSubmittedTopic.value].find(
      (topic) => topic.id === id,
    )
  }

  const getTopicIndex = (id: string | number) => {
    const index = [...topics.value, ...userSubmittedTopic.value].findIndex(
      (topic) => topic.id === id,
    )
    return index === -1 ? false : index
  }

  const removeTopic = (id: string | number) => {
    topics.value = topics.value.filter((topic) => topic.id !== id)
    userSubmittedTopic.value = userSubmittedTopic.value.filter(
      (topic) => topic.id !== id,
    )
  }

  const addTopic = (id: string | number) => {
    const targetTopic = getTopic(id)
    if (targetTopic) return (topics.value = [targetTopic, ...topics.value])
    return null
  }

  const loadStateMessage = computed(() => {
    if (loading.value) return message.value.forum.loadMore
    if (error.value) return message.value.forum.loadError
    if (topics.value.length === 0) return 'No Data'
    if (noMore.value) return message.value.forum.noMore
  })

  const initData = () => {
    if (!import.meta.env.SSR) Promise.all([loadAnn(), refreshData()])
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
      if (annData.value?.length === 0) return
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
    if (isSearching.value) return
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
    submitTopic,
  }
})
