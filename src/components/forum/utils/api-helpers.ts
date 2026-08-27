import type ForumAPI from '@/apis/forum/api'
import { uniqBy } from 'lodash-es'

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

// Error handling utilities
function isApiError(error: unknown): error is ForumAPI.ApiError {
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
