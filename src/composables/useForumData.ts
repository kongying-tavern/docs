import { ref, watch, computed } from 'vue'
import { issues } from '@/apis/forum/gitee'
import { useUserInfoStore } from '@/stores'
import { useCounter, usePrevious } from '@vueuse/core'
import { extractAndRemovePrefix } from '../components/forum/utils'

const userInfoStore = useUserInfoStore()

// TODO 重构
export function useForumData() {
  const topicsList = ref<GITEE.IssueList>([])
  const sort = ref<'created' | 'updated'>('created')
  const searchSort = ref<'updated_at' | 'notes_count' | 'created_at'>(
    'created_at',
  )
  const filterBy = ref<FilterType>('all')
  const isLoading = ref<boolean>(true)
  const searchState = ref<boolean>(false)
  const total = ref<number>(0)
  const isLastPage = computed(() => page.value == total.value)

  const {
    count: page,
    inc,
    dec,
    set,
    reset,
  } = useCounter(1, { min: 1, max: total.value })

  const filterMap = {
    all: () => lastTopicsList,
    bug: () => lastTopicsList.filter((val) => val?.topicType === 'BUG'),
    feat: () => lastTopicsList.filter((val) => val?.topicType === 'FEAT'),
  }

  type FilterType = keyof typeof filterMap

  let lastQ = ''
  let lastTopicsList: GITEE.IssueList = []

  const fetchData = async (
    q?: string,
  ): Promise<[GITEE.IssueList, GITEE.CommentList]> => {
    const [issuesData, commentsData] = await Promise.all([
      q
        ? issues.searchIssues({
            q: q,
            sort: searchSort.value,
            current: page.value,
            pageSize: 20,
          })
        : issues.getAllIssues({
            sort: sort.value,
            current: page.value,
            pageSize: 20,
          }),
      issues.getAllIssuesComments({ current: page.value, pageSize: 20 }),
    ])

    if (issuesData.data.length === 0) {
      searchState.value = false
      return [[], []]
    }

    if (q) {
      topicsList.value = []
      searchState.value = true
      lastQ = q
    }

    total.value = issuesData.totalPage

    return [issuesData.data, commentsData.data]
  }

  const processIssues = (
    issuesData: GITEE.IssueList,
    commentsData: GITEE.CommentList,
  ) => {
    const filteredIssues = issuesData.filter((val) =>
      val.labels.some((label) => label.name === 'good-issue'),
    )
    topicsList.value = filteredIssues.reduce((acc, issue) => {
      // 只提取官方和作者评论
      const modComment = commentsData.find(
        (comment) =>
          comment.target.issue.id === issue.id &&
          userInfoStore.isTeamMember(comment.user.id),
      )
      const authorComment = commentsData.find(
        (comment) =>
          comment.target.issue.id === issue.id &&
          comment.user.id === issue.user.id,
      )
      const { prefix, str } = extractAndRemovePrefix(issue.title)

      const topicType = !prefix ? '' : prefix.replace(':', '')

      issue.title = str
      issue.topicType = topicType.toLocaleUpperCase()
      issue.usefulComment = modComment
        ? modComment
        : authorComment
          ? authorComment
          : undefined

      acc.push(issue)
      return acc
    }, [] as GITEE.IssueList)
  }

  const refreshData = async (q?: string) => {
    isLoading.value = true

    const [issuesData, commentsData] = await fetchData(q)

    processIssues(issuesData, commentsData)

    // 将公告置顶
    topicsList.value.sort((a, b) => {
      const isAnnouncement = (item: GITEE.IssueInfo) =>
        item.topicType === 'ANN' && userInfoStore.isTeamMember(item.user.id)

      if (isAnnouncement(a) && !isAnnouncement(b)) return -1
      if (!isAnnouncement(a) && isAnnouncement(b)) return 1
      if (isAnnouncement(a) && isAnnouncement(b)) return 1

      return 0
    })

    lastTopicsList = topicsList.value

    if (!q) searchState.value = false

    isLoading.value = false
    return true
  }

  const filterData = (val?: FilterType) => {
    if (!val || !filterMap[val]) return
    topicsList.value = filterMap[val]()
  }

  const unshiftTopic = (topic: GITEE.IssueInfo) => {
    const { prefix, str } = extractAndRemovePrefix(topic.title)
    const topicType = !prefix ? '' : prefix.replace(':', '')

    topic.title = str
    topic.topicType = topicType.toLocaleUpperCase()
    topicsList.value.unshift(topic)
  }

  watch(sort, () => {
    refreshData()
  })

  watch(searchSort, () => {
    refreshData(lastQ)
  })

  watch(page, () => {
    if (!isLastPage.value) refreshData()
  })

  watch(filterBy, () => {
    filterData(filterBy.value)
  })

  return {
    topicsList,
    sort,
    searchSort,
    refreshData,
    page,
    inc,
    dec,
    set,
    reset,
    total,
    isLastPage,
    isLoading,
    searchState,
    filterBy,
    unshiftTopic,
  }
}
