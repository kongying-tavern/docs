import type ForumAPI from '@/apis/forum/api'
import { uniqBy } from 'lodash-es'

// API response processing utilities
export function processTopicsResponse(
  topics: ForumAPI.Topic[],
  existingTopics: ForumAPI.Topic[] = [],
): ForumAPI.Topic[] {
  if (!Array.isArray(topics))
    return existingTopics

  // Merge and deduplicate topics
  const mergedTopics = [...existingTopics, ...topics]
  return uniqBy(mergedTopics, 'id').sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA // Latest first
  })
}

export function processCommentsResponse(
  comments: ForumAPI.Comment[],
  existingComments: ForumAPI.Comment[] = [],
): ForumAPI.Comment[] {
  if (!Array.isArray(comments))
    return existingComments

  const mergedComments = [...existingComments, ...comments]
  return uniqBy(mergedComments, 'id').sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateA - dateB // Oldest first for comments
  })
}

// Request parameter builders
export function buildTopicsQueryParams(options: {
  page?: number
  pageSize?: number
  sort?: ForumAPI.SortMethod
  filter?: ForumAPI.FilterBy
  creator?: string | null
  searchQuery?: string
}): ForumAPI.GetTopicsParams {
  const { page = 1, pageSize = 20, sort = 'created', filter, creator, searchQuery } = options

  return {
    current: page || 1,
    pageSize: pageSize || 20,
    sort: sort || 'created',
    creator: creator || null,
    filter: ['closed', 'all'].includes(filter || '') ? null : filter || null,
    q: searchQuery || undefined,
  }
}

export function buildCommentsQueryParams(options: {
  topicId: string | number
  page?: number
  pageSize?: number
}): ForumAPI.GetCommentsParams {
  const { topicId, page = 1, pageSize = 20 } = options
  const repo: ForumAPI.Repo = 'Feedback'

  return {
    repo,
    issueId: String(topicId),
    page,
    pageSize,
  }
}

// Error handling utilities
export function isApiError(error: unknown): error is ForumAPI.ApiError {
  return (
    typeof error === 'object'
    && error !== null
    && 'message' in error
    && typeof (error as ForumAPI.ApiError).message === 'string'
  )
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('fetch')
      || error.message.includes('network')
      || error.message.includes('NETWORK_ERROR')
  }
  return false
}

export function isNotFoundError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.message.includes('404') || error.message.includes('Not Found')
  }
  return false
}

export function isPermissionError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.message.includes('403')
      || error.message.includes('401')
      || error.message.includes('Forbidden')
      || error.message.includes('Unauthorized')
  }
  return false
}

// Data transformation utilities
export function transformLabelsToTags(labels: Array<{ name: string }>): string[] {
  return labels.map(label => label.name)
}

export function transformTagsToLabels(tags: string[]): Array<{ name: string }> {
  return tags.map(tag => ({ name: tag }))
}

export function normalizeTopicType(type: string): ForumAPI.TopicType {
  const upperType = type.toUpperCase()
  if (['FEAT', 'BUG', 'ANN', 'POST'].includes(upperType)) {
    return upperType as ForumAPI.TopicType
  }
  return 'FEAT'
}

// Cache utilities
export function getCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        result[key] = params[key]
      }
      return result
    }, {} as Record<string, unknown>)

  return `${prefix}:${JSON.stringify(sortedParams)}`
}

export function isValidCacheData(data: unknown, maxAge: number = 5 * 60 * 1000): boolean {
  if (!data || typeof data !== 'object')
    return false

  const cacheData = data as { timestamp?: number, data?: unknown }
  if (!cacheData.timestamp || !cacheData.data)
    return false

  return Date.now() - cacheData.timestamp < maxAge
}

// Rate limiting utilities
const requestTimestamps = new Map<string, number[]>()

export function isRateLimited(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000,
): boolean {
  const now = Date.now()
  const requests = requestTimestamps.get(key) || []

  // Remove old timestamps outside the window
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs)

  if (validRequests.length >= maxRequests) {
    return true
  }

  // Add current request timestamp
  validRequests.push(now)
  requestTimestamps.set(key, validRequests)

  return false
}

// Retry utilities
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    }
    catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff
      const delay = baseDelay * 2 ** attempt
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error(lastError?.message || 'All retry attempts failed')
}
