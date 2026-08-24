export const FORUM_FILTERS = ['all', 'bug', 'feat', 'closed'] as const
export const FORUM_SORTS = ['created', 'updated'] as const
export const FORUM_SEARCH_MAX_LENGTH = 50

export type ForumFilter = typeof FORUM_FILTERS[number]
export type ForumSort = typeof FORUM_SORTS[number]

export interface ForumListRouteState {
  filter: ForumFilter
  sort: ForumSort
  q: string
  creator: string | null
}

export type ForumRoute
  = | { name: 'home', locale: string, list: ForumListRouteState }
    | { name: 'topic', locale: string, topicId: string }
    | { name: 'user', locale: string, username: string, list: ForumListRouteState }

export interface ForumRouteOptions {
  base: string
  locales: readonly string[]
}

export interface ForumHrefOptions extends ForumRouteOptions {
  currentUrl?: string | URL
  hash?: string | null
}

export interface ParsedForumLocation {
  route: ForumRoute
  href: string
  canonicalHref: string
  pathname: string
}

interface HistoryCanonicalizer {
  readonly state: unknown
  replaceState: (data: unknown, unused: string, url?: string | URL | null) => void
}

const URL_ORIGIN = 'https://forum.invalid'
const LEADING_HASH_REGEX = /^#/

export function parseForumLocation(input: string | URL, options: ForumRouteOptions): ParsedForumLocation | null {
  const url = toUrl(input)
  const relativePath = stripBase(url.pathname, options.base)
  if (relativePath === null)
    return null

  const rawSegments = relativePath.split('/').filter(Boolean)
  const decodedSegments = decodeSegments(rawSegments)
  if (!decodedSegments)
    return null

  const [first, possibleLocale] = decodedSegments
  const hasLocalePrefix = possibleLocale === 'feedback' && first !== 'root' && options.locales.includes(first)
  const locale = hasLocalePrefix ? first : 'root'
  const segments = hasLocalePrefix ? decodedSegments.slice(1) : decodedSegments

  if (!options.locales.includes(locale) || segments[0] !== 'feedback')
    return null

  const list = readListState(url, null)
  let route: ForumRoute

  if (segments.length === 1) {
    route = { name: 'home', locale, list }
  }
  else if (segments[1] === 'topic') {
    if (segments.length !== 3 || !segments[2])
      return null
    route = { name: 'topic', locale, topicId: segments[2] }
  }
  else if (segments[1] === 'user') {
    if ((segments.length !== 3 && segments.length !== 4) || !segments[2])
      return null
    const filter = segments[3] ?? 'all'
    if (!isForumFilter(filter))
      return null
    route = {
      name: 'user',
      locale,
      username: segments[2],
      list: readListState(url, segments[2], filter),
    }
  }
  else {
    if (segments.length !== 2 || !isForumFilter(segments[1]))
      return null
    route = { name: 'home', locale, list: readListState(url, null, segments[1]) }
  }

  return {
    route,
    href: toHref(url),
    canonicalHref: buildForumHref(route, { ...options, currentUrl: url }),
    pathname: url.pathname,
  }
}

export function buildForumHref(route: ForumRoute, options: ForumHrefOptions): string {
  if (!options.locales.includes(route.locale))
    throw new RangeError(`Unknown Forum locale: ${route.locale}`)

  const url = toUrl(options.currentUrl ?? '/')
  const base = normalizeBase(options.base)
  const segments = route.locale === 'root' ? ['feedback'] : [route.locale, 'feedback']

  if (route.name === 'topic') {
    segments.push('topic', route.topicId)
    url.searchParams.delete('q')
    url.searchParams.delete('sort')
  }
  else {
    if (route.name === 'user')
      segments.push('user', route.username)
    if (route.list.filter !== 'all')
      segments.push(route.list.filter)
    writeListQuery(url.searchParams, route.list)
  }

  const encodedPath = segments.map(segment => encodeURIComponent(segment)).join('/')
  url.pathname = `${base}${encodedPath}`

  if (options.hash !== undefined)
    url.hash = options.hash ? `#${options.hash.replace(LEADING_HASH_REGEX, '')}` : ''

  return toHref(url)
}

export function isSameForumDestination(currentHref: string | URL, targetHref: string | URL): boolean {
  return toHref(toUrl(currentHref)) === toHref(toUrl(targetHref))
}

export async function navigateForumDestination(
  currentHref: string | URL,
  targetHref: string,
  go: (href: string) => void | Promise<void>,
): Promise<boolean> {
  if (isSameForumDestination(currentHref, targetHref))
    return false
  await go(targetHref)
  return true
}

export function canonicalizeForumLocation(
  history: HistoryCanonicalizer,
  currentHref: string | URL,
  canonicalHref: string | URL,
): boolean {
  if (isSameForumDestination(currentHref, canonicalHref))
    return false

  history.replaceState(history.state, '', canonicalHref)
  return true
}

export function forumRouteParams(route: ForumRoute): Record<string, string> {
  if (route.name === 'topic')
    return { id: route.topicId }
  if (route.name === 'user') {
    return {
      id: route.username,
      ...(route.list.filter === 'all' ? {} : { type: route.list.filter }),
    }
  }
  return route.list.filter === 'all' ? {} : { type: route.list.filter }
}

function readListState(url: URL, creator: string | null, filter: ForumFilter = 'all'): ForumListRouteState {
  const sort = url.searchParams.get('sort')
  return {
    filter,
    sort: sort === 'updated' ? 'updated' : 'created',
    q: (url.searchParams.get('q') ?? '').trim().slice(0, FORUM_SEARCH_MAX_LENGTH),
    creator,
  }
}

function writeListQuery(searchParams: URLSearchParams, list: ForumListRouteState): void {
  const q = list.q.trim().slice(0, FORUM_SEARCH_MAX_LENGTH)
  if (q)
    searchParams.set('q', q)
  else
    searchParams.delete('q')

  if (list.sort === 'updated')
    searchParams.set('sort', list.sort)
  else
    searchParams.delete('sort')
}

function stripBase(pathname: string, base: string): string | null {
  const normalizedBase = normalizeBase(base)
  if (normalizedBase === '/')
    return pathname

  const baseWithoutSlash = normalizedBase.slice(0, -1)
  if (pathname === baseWithoutSlash)
    return '/'
  if (!pathname.startsWith(normalizedBase))
    return null
  return `/${pathname.slice(normalizedBase.length)}`
}

function normalizeBase(base: string): string {
  const segments = base.split('/').filter(Boolean)
  return segments.length ? `/${segments.join('/')}/` : '/'
}

function decodeSegments(segments: string[]): string[] | null {
  try {
    return segments.map(segment => decodeURIComponent(segment))
  }
  catch {
    return null
  }
}

function isForumFilter(value: string): value is ForumFilter {
  return FORUM_FILTERS.includes(value as ForumFilter)
}

function toUrl(input: string | URL): URL {
  return input instanceof URL ? new URL(input) : new URL(input, URL_ORIGIN)
}

function toHref(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`
}
