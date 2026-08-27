import type { Ref } from 'vue'
import type { CustomConfig } from '../../../.vitepress/locales/types'
import type ForumAPI from '@/apis/forum/api'
import type { ForumQueryParams } from '~/services/forumService'

interface ApiErrorResponse {
  response?: {
    status?: number
    data?: unknown
  }
  message?: string
}

/**
 * 类型守卫：检查是否为 API 错误响应
 */
function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return error !== null && typeof error === 'object'
}

/**
 * Forum Business Logic Service
 * 将复杂的业务逻辑从Store中分离出来
 * 专注于数据处理、验证和转换
 */
export class ForumBusinessLogic {
  /**
   * 数据合并策略：智能合并API数据和用户提交数据
   */
  static mergeTopicsData(
    apiTopics: ForumAPI.Topic[] | null,
    userSubmittedTopics: ForumAPI.Topic[],
    options: {
      enableUserFilter?: boolean
      currentUser?: string | null
      deduplication?: boolean
    } = {},
  ): ForumAPI.Topic[] {
    const {
      enableUserFilter = false,
      currentUser = null,
      deduplication = true,
    } = options

    const api = apiTopics || []
    const user = userSubmittedTopics || []

    let result: ForumAPI.Topic[]

    if (deduplication) {
      // 使用Map进行高效去重，用户数据优先
      const topicMap = new Map<string | number, ForumAPI.Topic>()
      api.forEach(topic => topicMap.set(topic.id, topic))
      user.forEach(topic => topicMap.set(topic.id, topic))
      result = [...topicMap.values()]
    }
    else {
      // 简单合并
      result = [...user, ...api]
    }

    // 用户过滤
    if (enableUserFilter && currentUser) {
      result = result.filter(topic => topic.user?.login === currentUser)
    }

    return result
  }

  /**
   * 数据筛选业务逻辑
   */
  static filterTopics(
    topics: ForumAPI.Topic[],
    filter: ForumAPI.FilterBy,
  ): ForumAPI.Topic[] {
    switch (filter) {
      case 'all':
        return topics.filter(topic => topic.state === 'open')
      case 'closed':
        return topics.filter(topic => topic.state === 'progressing')
      case 'bug':
        return topics.filter(topic => topic.type === 'BUG')
      case 'feat':
        return topics.filter(topic => topic.type === 'FEAT')
      default:
        return topics
    }
  }

  /**
   * 数据排序业务逻辑
   * 使用 Schwartzian transform 避免重复创建 Date 对象
   */
  static sortTopics(
    topics: ForumAPI.Topic[],
    sort: ForumAPI.SortMethod,
  ): ForumAPI.Topic[] {
    if (sort === 'created' || sort === 'updated') {
      const dateKey = sort === 'created' ? 'createdAt' : 'updatedAt' as const
      const withTimestamps = topics.map(t => ({
        topic: t,
        timestamp: new Date(t[dateKey]).getTime(),
      }))
      withTimestamps.sort((a, b) => b.timestamp - a.timestamp)
      return withTimestamps.map(item => item.topic)
    }
    return topics
  }

  /**
   * 置顶话题分离逻辑
   */
  static separatePinnedTopics(
    topics: ForumAPI.Topic[],
  ): { pinnedTopics: ForumAPI.Topic[], regularTopics: ForumAPI.Topic[] } {
    const pinnedTopics = topics.filter(topic => topic.pinned)
    const regularTopics = topics.filter(topic => !topic.pinned)
    return { pinnedTopics, regularTopics }
  }

  /**
   * 话题状态更新业务逻辑
   */
  static updateTopicVisibility(
    _topic: ForumAPI.Topic | null,
    updates: { hidden?: boolean, closed?: boolean },
  ): Partial<ForumAPI.Topic> {
    const stateUpdate: Partial<ForumAPI.Topic> = {}

    if (updates.hidden !== undefined) {
      stateUpdate.state = updates.hidden ? 'progressing' : 'open'
    }
    if (updates.closed !== undefined) {
      stateUpdate.state = updates.closed ? 'closed' : 'open'
    }

    return stateUpdate
  }

  /**
   * 搜索参数构建业务逻辑
   */
  static buildSearchParams(
    baseParams: {
      filter?: ForumAPI.FilterBy
      sort?: ForumAPI.SortMethod
      creator?: string | null
    },
    searchQuery?: string | string[],
    additionalParams?: Omit<ForumQueryParams, 'searchQuery'>,
  ): ForumQueryParams {
    const params: ForumQueryParams = {
      filter: baseParams.filter || 'all',
      sort: baseParams.sort || 'created',
      ...additionalParams,
    }

    if (baseParams.creator) {
      params.creator = baseParams.creator
    }

    if (searchQuery) {
      params.searchQuery = Array.isArray(searchQuery) ? searchQuery.join(' ') : searchQuery
    }

    return params
  }

  /**
   * 错误处理业务逻辑
   */
  static handleForumError(
    error: unknown,
    operation: string,
    message?: Ref<CustomConfig>,
  ): { message: string, shouldRetry: boolean, errorCode?: string } {
    if (!isApiErrorResponse(error)) {
      return {
        message: `${operation} failed: Unknown error`,
        shouldRetry: false,
        errorCode: 'UNKNOWN_ERROR',
      }
    }
    // Fallback messages if not provided
    const msg = message?.value || {
      forum: {
        errors: {
          tooManyRequests: 'Too many requests, please try again later',
          serverError: 'Server error, please try again',
          notFound: 'Resource not found',
          operationFailed: '{operation} failed: {message}',
          unknownError: 'Unknown error',
        },
      },
    } as CustomConfig

    // 标准化错误处理
    if (error?.response?.status === 429) {
      return {
        message: msg.forum.errors.tooManyRequests,
        shouldRetry: true,
        errorCode: 'RATE_LIMIT',
      }
    }

    if (error.response?.status && error.response.status >= 500) {
      return {
        message: msg.forum.errors.serverError,
        shouldRetry: true,
        errorCode: 'SERVER_ERROR',
      }
    }

    if (error?.response?.status === 404) {
      return {
        message: msg.forum.errors.notFound,
        shouldRetry: false,
        errorCode: 'NOT_FOUND',
      }
    }

    return {
      message: msg.forum.errors.operationFailed.replace('{operation}', operation).replace('{message}', error.message || msg.forum.errors.unknownError),
      shouldRetry: false,
      errorCode: 'UNKNOWN',
    }
  }
}
