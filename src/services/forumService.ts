import type ForumAPI from '@/apis/forum/api'
import { issues } from '@/apis/forum/gitee'
import { FORUM_CONFIG } from '~/components/forum/constants'
import {
  buildTopicsQueryParams,
  getErrorMessage,
  processTopicsResponse,
} from '~/components/forum/utils/api-helpers'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'

export interface ForumQueryParams {
  page?: number
  pageSize?: number
  sort?: ForumAPI.SortMethod
  filter?: ForumAPI.FilterBy
  creator?: string | null
  searchQuery?: string | string[]
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

export class ForumService {
  private static typeLabelGetter = getTopicTypeLabelGetter()

  static async getTopics(
    queryParams: ForumQueryParams,
    options: ForumServiceOptions = {},
  ): Promise<ForumLoadResult> {
    try {
      const params = buildTopicsQueryParams({
        page: queryParams.page || 1,
        pageSize: queryParams.pageSize || FORUM_CONFIG.DEFAULT_PAGE_SIZE,
        sort: queryParams.sort || 'created',
        filter: queryParams.filter || 'all',
        creator: queryParams.creator || null,
        searchQuery: queryParams.searchQuery ? String(queryParams.searchQuery) : undefined,
      })

      const filterValue = queryParams.filter || 'all'
      // Map filter to API state and filter parameters
      let state: ForumAPI.TopicState = 'open'
      let finalFilter: string | string[] | null = null

      if (filterValue === 'closed') {
        // Show progressing topics (已结反馈)
        state = 'progressing'
        finalFilter = null
      }
      else if (filterValue === 'bug') {
        // Show open topics with BUG type
        state = 'open'
        finalFilter = this.typeLabelGetter.getLabel('bug') || 'TYP-BUG'
      }
      else if (filterValue === 'feat') {
        // Show open topics with FEAT type
        state = 'open'
        finalFilter = this.typeLabelGetter.getLabel('feat') || 'TYP-FEAT'
      }
      else {
        // Show all open topics (filterValue === 'all')
        state = 'open'
        finalFilter = null
      }

      const finalQueryParams: ForumAPI.Query = {
        current: params.current,
        pageSize: params.pageSize,
        sort: params.sort,
        creator: params.creator || null,
        filter: finalFilter,
      }

      const response = await issues.getTopics(
        finalQueryParams,
        state,
        queryParams.searchQuery ? String(queryParams.searchQuery) : undefined,
      )

      const result: ForumLoadResult = {
        topics: processTopicsResponse(response.data || []),
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
      const topics = processTopicsResponse(response || [])

      return topics
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load pinned topics')
      options.onError?.(err)
      throw err
    }
  }

  static async searchTopics(
    query: string | string[],
    additionalParams: Omit<ForumQueryParams, 'searchQuery'> = {},
    options: ForumServiceOptions = {},
  ): Promise<ForumLoadResult> {
    if (!query || (Array.isArray(query) && query.length === 0)) {
      throw new Error('Search query is required')
    }

    return this.getTopics(
      {
        ...additionalParams,
        searchQuery: query,
      },
      options,
    )
  }

  static async loadMore(
    currentData: ForumAPI.Topic[],
    queryParams: ForumQueryParams,
    currentPage: number,
    options: ForumServiceOptions = {},
  ): Promise<ForumLoadResult> {
    const result = await this.getTopics(
      {
        ...queryParams,
        page: currentPage + 1,
      },
      options,
    )

    return {
      ...result,
      topics: processTopicsResponse(result.topics, currentData),
    }
  }

  static buildErrorMessage(error: Error): string {
    return getErrorMessage(error)
  }
}
