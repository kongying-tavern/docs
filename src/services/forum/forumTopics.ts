import type ForumAPI from '@/apis/forum/api'
import type { ForumTopicListParams, TopicStateFilter } from '~/services/forum/forumQueryContracts'
import { issues } from '@/apis/forum/gitee'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { FORUM_CONFIG } from '~/services/forum/forumConfig'
import { forumStateForFilter } from '~/services/forum/forumQueryContracts'

interface ForumQueryParams extends ForumTopicListParams {
  page?: number
}

interface ForumLoadResult {
  topics: ForumAPI.Topic[]
  totalPage: number
  total: number
}

interface ForumProviderRequest {
  query: ForumAPI.Query
  state: TopicStateFilter
  search?: string
}

const typeLabelGetter = getTopicTypeLabelGetter()

export function buildForumProviderRequest(queryParams: ForumQueryParams): ForumProviderRequest {
  const filter = queryParams.filter || 'all'
  const query: ForumAPI.Query = {
    current: queryParams.page || 1,
    pageSize: queryParams.pageSize || FORUM_CONFIG.DEFAULT_PAGE_SIZE,
    sort: queryParams.sort || 'created',
    creator: queryParams.creator?.trim() || null,
    filter: filter === 'bug'
      ? typeLabelGetter.getLabel('bug') || 'TYP-BUG'
      : filter === 'feat'
        ? typeLabelGetter.getLabel('feat') || 'TYP-FEAT'
        : null,
  }

  return {
    query,
    state: queryParams.state ?? forumStateForFilter(filter),
    search: queryParams.q.trim() || undefined,
  }
}

export async function getForumTopics(queryParams: ForumQueryParams): Promise<ForumLoadResult> {
  const request = buildForumProviderRequest(queryParams)
  const response = await issues.getTopics(request.query, request.state, request.search)
  return {
    topics: response.data || [],
    totalPage: response.totalPage || 0,
    total: response.total || 0,
  }
}

export async function getPinnedForumTopics(): Promise<ForumAPI.Topic[]> {
  return issues.getPinnedList()
}
