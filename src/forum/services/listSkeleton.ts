import type { ForumTopicListParams } from '~/forum/services/queryContracts'
import type { ForumRoute } from '~/forum/services/route'
import { clamp } from 'lodash-es'
import { normalizeTopicListParams } from '~/forum/services/queryContracts'
import { parseForumSearchQuery } from '~/forum/services/searchQuery'

/**
 * 会话缓存列表首屏条数，供下次无数据时骨架屏复用。
 * key 由路由 scope 与规范化列表参数构成，不同列表（含不同用户页）互不串用。
 */
const CACHE_KEY_PREFIX = 'forum:list-skeleton-count:v1'

export const MIN_SKELETON_COUNT = 3
export const MAX_SKELETON_COUNT = 20
export const SKELETON_FADE_MIN_OPACITY = 0.1

interface SkeletonListCountCache {
  count: number
  at: number
}

export function resolveForumListScope(route: ForumRoute | null | undefined): string | null {
  if (!route)
    return null
  if (route.name === 'home')
    return 'home'
  if (route.name === 'user')
    return `user:${route.username}`
  if (route.name === 'search')
    return route.username ? `search:user:${route.username}` : 'search:home'
  return null
}

export function resolveForumListParams(route: ForumRoute | null | undefined): ForumTopicListParams | null {
  if (!route || !('list' in route))
    return null
  const { list } = route
  const search = parseForumSearchQuery(list.q ?? '')
  return {
    filter: list.filter ?? 'all',
    topicType: list.topicType ?? 'all',
    sort: list.sort ?? 'created',
    q: search.text,
    tags: search.tags,
    statuses: search.states,
    creator: search.author ?? (route.name === 'user' || route.name === 'search' ? route.username : null),
  }
}

export function buildForumListCacheKey(scope: string, params: ForumTopicListParams): string {
  const normalized = normalizeTopicListParams(params)
  // normalize 已排序数组，这里固定字段顺序，key 不随对象键序漂移
  const entries = Object.entries(normalized).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  return `${CACHE_KEY_PREFIX}:${scope}:${JSON.stringify(entries)}`
}

export function readSkeletonListCount(key: string): number | null {
  if (typeof window === 'undefined')
    return null
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw)
      return null
    const cache = JSON.parse(raw) as Partial<SkeletonListCountCache>
    return Number.isInteger(cache.count) && cache.count! > 0 ? clamp(cache.count!, 1, MAX_SKELETON_COUNT) : null
  }
  catch {
    return null
  }
}

export function saveSkeletonListCount(key: string, count: number): void {
  if (typeof window === 'undefined' || !Number.isInteger(count) || count <= 0)
    return
  try {
    const cache: SkeletonListCountCache = { count: clamp(count, 1, MAX_SKELETON_COUNT), at: Date.now() }
    sessionStorage.setItem(key, JSON.stringify(cache))
  }
  catch {
    // sessionStorage 不可用时静默降级
  }
}

export function skeletonItemOpacity(index: number, total: number): number {
  if (total <= 1)
    return 1
  const faded = (index / (total - 1)) * (1 - SKELETON_FADE_MIN_OPACITY)
  return Math.round((1 - faded) * 100) / 100
}
