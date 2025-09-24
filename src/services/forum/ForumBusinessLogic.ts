import type { Ref } from 'vue'
import type { CustomConfig } from '../../../.vitepress/locales/types'
import type ForumAPI from '@/apis/forum/api'
import type { ForumQueryParams } from '~/services/forumService'

/**
 * API 响应类型定义
 */
interface ApiResponse {
  topics?: ForumAPI.Topic[]
  data?: ForumAPI.Topic[]
  total?: number
  totalPage?: number
  totalPages?: number
}

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
      result = Array.from(topicMap.values())
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
   */
  static sortTopics(
    topics: ForumAPI.Topic[],
    sort: ForumAPI.SortMethod,
  ): ForumAPI.Topic[] {
    switch (sort) {
      case 'created':
        return topics.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      case 'updated':
        return topics.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
      default:
        return topics
    }
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
    _topic: ForumAPI.Topic,
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
   * 话题数据验证
   */
  static validateTopic(
    topic: Partial<ForumAPI.Topic>,
    message?: Ref<CustomConfig>,
  ): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Fallback messages if not provided
    const msg = message?.value || {
      forum: {
        validation: {
          errors: {
            titleRequired: 'Topic title is required',
            contentRequired: 'Topic content is required',
            authorRequired: 'Topic author is required',
            tooManyTags: 'Too many tags (max 10)',
          },
        },
      },
    } as CustomConfig

    if (!topic.title || topic.title.trim().length === 0) {
      errors.push(msg.forum.validation.errors.titleRequired)
    }

    if (!topic.content || !topic.content.text || topic.content.text.trim().length === 0) {
      errors.push(msg.forum.validation.errors.contentRequired)
    }

    if (!topic.user || !topic.user.login) {
      errors.push(msg.forum.validation.errors.authorRequired)
    }

    if (topic.tags && topic.tags.length > 10) {
      errors.push(msg.forum.validation.errors.tooManyTags)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * 数据转换：API响应到内部格式
   */
  static transformApiResponse(
    response: ApiResponse,
  ): { topics: ForumAPI.Topic[], total: number, totalPage: number } {
    // 这里可以添加数据转换逻辑
    // 例如：格式化日期、处理嵌套数据等

    return {
      topics: response.topics || response.data || [],
      total: response.total || 0,
      totalPage: response.totalPage || response.totalPages || 0,
    }
  }

  /**
   * 批量操作业务逻辑
   */
  static prepareBatchUpdates(
    topics: ForumAPI.Topic[],
    updates: Array<{ id: string | number, changes: Partial<ForumAPI.Topic> }>,
  ): ForumAPI.Topic[] {
    const updateMap = new Map(
      updates.map(update => [String(update.id), update.changes]),
    )

    return topics.map((topic) => {
      const changes = updateMap.get(String(topic.id))
      return changes ? { ...topic, ...changes } : topic
    })
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

  /**
   * 性能优化：数据预处理
   */
  static preprocessTopicsForRendering(topics: ForumAPI.Topic[]): ForumAPI.Topic[] {
    return topics.map(topic => ({
      ...topic,
      // 预计算显示需要的字段
      displayTitle: topic.title.length > 50 ? `${topic.title.slice(0, 47)}...` : topic.title,
      displayContent: topic.content.text.length > 200
        ? `${topic.content.text.slice(0, 197)}...`
        : topic.content.text,
      formattedCreatedAt: new Date(topic.createdAt).toLocaleDateString(),
      formattedUpdatedAt: new Date(topic.updatedAt).toLocaleDateString(),
      tagString: topic.tags.join(', '),
    }))
  }
}

/**
 * Forum操作工厂
 * 提供标准化的操作方法
 */
export class ForumOperationFactory {
  /**
   * 创建话题操作
   */
  static createTopicOperation(
    topic: Partial<ForumAPI.Topic>,
    _onSuccess?: (topic: ForumAPI.Topic) => void,
    onError?: (error: unknown) => void,
  ) {
    return async () => {
      try {
        const validation = ForumBusinessLogic.validateTopic(topic)
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
        }

        // 这里调用实际的API
        // const result = await ForumService.createTopic(topic)
        // onSuccess?.(result)
      }
      catch (error) {
        const errorInfo = ForumBusinessLogic.handleForumError(error, 'Create Topic')
        onError?.(errorInfo)
      }
    }
  }

  /**
   * 批量更新操作
   */
  static createBatchUpdateOperation(
    updates: Array<{ id: string | number, changes: Partial<ForumAPI.Topic> }>,
    onSuccess?: (updatedCount: number) => void,
    onError?: (error: unknown) => void,
  ) {
    return async () => {
      try {
        // 这里可以添加批量更新的API调用
        onSuccess?.(updates.length)
      }
      catch (error) {
        const errorInfo = ForumBusinessLogic.handleForumError(error, 'Batch Update')
        onError?.(errorInfo)
      }
    }
  }
}
