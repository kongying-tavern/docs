import type { OfficialUserPredicate } from '~/forum/api/gitee/officialComments'
import type ForumAPI from '~/forum/api/types'
import type { ForumTopicListParams, TopicStateFilter } from '~/forum/services/forumQueryContracts'
import type { ForumSearchState } from '~/forum/services/forumSearchQuery'
import { issues } from '~/forum/api/gitee'
import { FORUM_CONFIG } from '~/forum/services/forumConfig'
import {
  forumExcludedStatesForFilter,
  forumStateForFilter,
  matchesForumTopicListQuery,
  normalizeStrings,
} from '~/forum/services/forumQueryContracts'
import { getTopicStatusDefinition } from '~/forum/services/forumTopicStatus'
import { getTopicTypeLabelGetter } from '~/forum/services/getTopicTypeLabelGetter'

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
  /** States the provider cannot exclude itself; callers drop them from the response. */
  excludedStates: readonly ForumAPI.TopicState[]
}

const MAX_STRUCTURED_SEARCH_PAGES = 5
const STRUCTURED_SEARCH_PAGE_SIZE = 100
/** 单次查询调用内最多补抓的原始页数，防止高过滤率场景一次滚动拉太多请求 */
const MAX_FETCH_BATCHES_PER_CALL = 8
const STRUCTURED_CACHE_LIMIT = 12

export type StructuredTopicFetcher = (
  query: ForumAPI.Query,
  state: TopicStateFilter | undefined,
  search: string | undefined,
  isOfficialUser: OfficialUserPredicate,
) => Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>>

const typeLabelGetter = getTopicTypeLabelGetter()

interface StructuredBranchPlan {
  labels: string[]
  state: TopicStateFilter
  /** 下一个待抓取的原生页 */
  page: number
  /** 已知原生总页数；首个响应前为 null */
  totalPages: number | null
}

interface StructuredSearchCache {
  branches: StructuredBranchPlan[]
  rawTopics: Map<string, ForumAPI.Topic>
  orderedTopicIds: string[]
  publishedCount: number
  exhausted: boolean
  lastAccess: number
}

/** 分面搜索按查询键缓存抓取进度与已抓条目，页面滚动时按需补抓，而不是一次拉全 */
const structuredCaches = new Map<string, StructuredSearchCache>()

export function buildForumProviderRequest(queryParams: ForumQueryParams): ForumProviderRequest {
  const filter = queryParams.filter || 'all'
  const labels = normalizeStrings(queryParams.labels)
  const topicType = queryParams.topicType && queryParams.topicType !== 'all' ? queryParams.topicType : filter
  const typeLabel = topicType === 'bug'
    ? typeLabelGetter.getLabel('bug') || 'TYP-BUG'
    : topicType === 'feat'
      ? typeLabelGetter.getLabel('feat') || 'TYP-FEAT'
      : null
  const query: ForumAPI.Query = {
    current: queryParams.page || 1,
    pageSize: queryParams.pageSize || FORUM_CONFIG.DEFAULT_PAGE_SIZE,
    sort: queryParams.sort || 'created',
    creator: queryParams.creator?.trim() || null,
    filter: labels.length ? labels : typeLabel,
  }

  return {
    query,
    state: queryParams.state ?? forumStateForFilter(filter),
    search: queryParams.q.trim() || undefined,
    excludedStates: forumExcludedStatesForFilter(filter),
  }
}

export async function getForumTopics(
  queryParams: ForumQueryParams,
  isOfficialUser: OfficialUserPredicate,
): Promise<ForumLoadResult> {
  if (queryParams.tags?.length || queryParams.statuses?.length)
    return getStructuredForumTopics(queryParams, isOfficialUser, issues.getTopics, queryParams.page ?? 1)

  const request = buildForumProviderRequest(queryParams)
  const response = await issues.getTopics(request.query, request.state, request.search, isOfficialUser)
  const selectedType = queryParams.topicType && queryParams.topicType !== 'all'
    ? queryParams.topicType
    : queryParams.filter
  const topics = (response.data || []).filter(topic =>
    (!topic.state || !request.excludedStates.includes(topic.state))
    && (selectedType !== 'bug' || topic.type === 'BUG')
    && (selectedType !== 'feat' || topic.type === 'FEAT'),
  )
  return {
    topics,
    totalPage: response.totalPage || 0,
    total: response.total || 0,
  }
}

export async function getStructuredForumTopics(
  queryParams: ForumQueryParams,
  isOfficialUser: OfficialUserPredicate,
  fetchTopics: StructuredTopicFetcher = issues.getTopics,
  page = 1,
): Promise<ForumLoadResult> {
  const cache = getStructuredCache(queryParams)
  const pageSize = queryParams.pageSize || FORUM_CONFIG.DEFAULT_PAGE_SIZE

  let batches = 0
  while (batches < MAX_FETCH_BATCHES_PER_CALL) {
    const filtered = collectStructuredTopics(cache, queryParams)
    if (cache.exhausted || filtered.length >= page * pageSize)
      break
    await fetchNextStructuredBatch(cache, queryParams, isOfficialUser, fetchTopics)
    batches += 1
  }

  const topics = collectStructuredTopics(cache, queryParams)
  const start = (page - 1) * pageSize
  const slice = topics.slice(start, start + pageSize)
  cache.publishedCount = Math.max(
    cache.publishedCount,
    Math.min(start + slice.length, topics.length),
  )
  const knownTotalPage = Math.max(1, Math.ceil(topics.length / pageSize))

  return {
    topics: slice,
    total: topics.length,
    totalPage: cache.exhausted
      ? knownTotalPage
      : Math.max(knownTotalPage, page + 1),
  }
}

function buildStructuredBranches(queryParams: ForumQueryParams): StructuredBranchPlan[] {
  const tags = normalizeValues(queryParams.tags)
  const statuses = normalizeValues(queryParams.statuses)
  const statusLabels = statuses.flatMap((status) => {
    if (status === 'closed')
      return []
    if (status === 'good-issue')
      return ['GOOD-ISSUE']
    return [getTopicStatusDefinition(status).label]
  })
  const branches: Array<{ labels: string[], state: TopicStateFilter }> = []

  if (statuses.includes('closed'))
    branches.push({ labels: tags, state: 'progressing' })
  if (statusLabels.length)
    branches.push({ labels: statusLabels, state: 'all' })
  if (!statuses.length)
    branches.push({ labels: tags, state: queryParams.state ?? forumStateForFilter(queryParams.filter) })

  return branches.map(branch => ({ ...branch, page: 1, totalPages: null }))
}

function structuredCacheKey(queryParams: ForumQueryParams): string {
  return JSON.stringify([
    queryParams.filter,
    queryParams.topicType ?? 'all',
    queryParams.sort,
    queryParams.q.trim(),
    queryParams.creator?.trim() ?? null,
    normalizeStrings(queryParams.tags),
    normalizeStrings(queryParams.statuses),
    queryParams.state ?? null,
  ])
}

function getStructuredCache(queryParams: ForumQueryParams): StructuredSearchCache {
  const key = structuredCacheKey(queryParams)
  let cache = structuredCaches.get(key)
  if (!cache) {
    cache = {
      branches: buildStructuredBranches(queryParams),
      rawTopics: new Map(),
      orderedTopicIds: [],
      publishedCount: 0,
      exhausted: false,
      lastAccess: Date.now(),
    }
    structuredCaches.set(key, cache)
  }
  cache.lastAccess = Date.now()

  if (structuredCaches.size > STRUCTURED_CACHE_LIMIT) {
    const oldest = [...structuredCaches.entries()].toSorted((a, b) => a[1].lastAccess - b[1].lastAccess)[0]
    if (oldest)
      structuredCaches.delete(oldest[0])
  }
  return cache
}

/** 推进一个分支的原生页抓取；所有分支都抓完或达到页数上限后标记 exhausted */
async function fetchNextStructuredBatch(
  cache: StructuredSearchCache,
  queryParams: ForumQueryParams,
  isOfficialUser: OfficialUserPredicate,
  fetchTopics: StructuredTopicFetcher,
): Promise<void> {
  for (const branch of cache.branches) {
    if (branch.totalPages !== null && branch.page > branch.totalPages)
      continue
    if (branch.page > MAX_STRUCTURED_SEARCH_PAGES)
      continue

    const request = buildForumProviderRequest({
      ...queryParams,
      labels: branch.labels,
      q: '',
      page: branch.page,
      pageSize: STRUCTURED_SEARCH_PAGE_SIZE,
      state: branch.state,
    })
    const response = await fetchTopics(request.query, request.state, undefined, isOfficialUser)
    if (!response.data?.length) {
      branch.totalPages = branch.page - 1
      return
    }
    for (const topic of response.data) {
      const id = String(topic.id)
      if (!cache.rawTopics.has(id))
        cache.rawTopics.set(id, topic)
    }
    branch.totalPages = response.totalPage
      || (response.data.length === STRUCTURED_SEARCH_PAGE_SIZE ? branch.page + 1 : branch.page)
    branch.page += 1
    return
  }
  cache.exhausted = true
}

function collectStructuredTopics(cache: StructuredSearchCache, queryParams: ForumQueryParams): ForumAPI.Topic[] {
  const tags = normalizeValues(queryParams.tags)
  const statuses = normalizeValues(queryParams.statuses)
  const matching = [...cache.rawTopics.values()]
    .filter(topic => matchesStructuredQuery(topic, queryParams, tags, statuses))
    .sort((a, b) => Date.parse(queryParams.sort === 'updated' ? b.updatedAt : b.createdAt)
      - Date.parse(queryParams.sort === 'updated' ? a.updatedAt : a.createdAt))
  const matchingById = new Map(matching.map(topic => [String(topic.id), topic]))
  const publishedIds = cache.orderedTopicIds
    .slice(0, cache.publishedCount)
    .filter(id => matchingById.has(id))
  const published = new Set(publishedIds)
  const pendingIds = matching
    .map(topic => String(topic.id))
    .filter(id => !published.has(id))

  cache.orderedTopicIds = [...publishedIds, ...pendingIds]
  return cache.orderedTopicIds.flatMap(id => matchingById.get(id) ?? [])
}

function matchesStructuredQuery(
  topic: ForumAPI.Topic,
  params: ForumQueryParams,
  tags: readonly string[],
  statuses: readonly ForumSearchState[],
): boolean {
  return matchesForumTopicListQuery(topic, { ...params, tags: [...tags], statuses: [...statuses] })
}

function normalizeValues<T extends string>(values: readonly T[] | undefined): T[] {
  return (values ?? [])
    .map(value => value.trim() as T)
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
}

export async function getPinnedForumTopics(): Promise<ForumAPI.Topic[]> {
  return issues.getPinnedList()
}
