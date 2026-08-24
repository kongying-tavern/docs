import type ForumAPI from '@/apis/forum/api'
import type { ForumTopicListParams } from '~/services/forum/forumQueryContracts'
import { issues } from '@/apis/forum/gitee'
import { FORUM_CONFIG } from '~/components/forum/constants'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'

export interface ForumQueryParams extends ForumTopicListParams {
  page?: number
}

export interface ForumLoadResult {
  topics: ForumAPI.Topic[]
  totalPage: number
  total: number
  hasMore: boolean
}

export interface ForumServiceOptions {
  onError?: (error: Error) => void
  onSuccess?: (result: ForumLoadResult) => void
}

export interface ForumProviderRequest {
  query: ForumAPI.Query
  state: ForumAPI.TopicState
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
    state: filter === 'closed' ? 'progressing' : 'open',
    search: queryParams.q.trim() || undefined,
  }
}

export class ForumService {
  static async getTopics(
    queryParams: ForumQueryParams,
    options: ForumServiceOptions = {},
  ): Promise<ForumLoadResult> {
    try {
      const request = buildForumProviderRequest(queryParams)
      const response = await issues.getTopics(request.query, request.state, request.search)

      const result: ForumLoadResult = {
        topics: response.data || [],
        totalPage: response.totalPage || 0,
        total: response.total || 0,
        hasMore: (response.totalPage || 0) > 1,
      }
      options.onSuccess?.(result)
      return result
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      options.onError?.(err)
      throw err
    }
  }

  static async getPinnedTopics(
    options: ForumServiceOptions = {},
  ): Promise<ForumAPI.Topic[]> {
    try {
      const response = await issues.getPinnedList()
      return response || []
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load pinned topics')
      options.onError?.(err)
      throw err
    }
  }
}
