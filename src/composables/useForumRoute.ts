import type { ForumFilter, ForumListRouteState, ForumRoute, ForumRouteOptions, ForumSort, ForumTopicType, ParsedForumLocation } from '~/services/forum/forumRoute'
import type { ForumSearchFacet } from '~/services/forum/forumSearchQuery'
import { useData, useRouter } from 'vitepress'
import { computed, readonly, shallowRef } from 'vue'
import {
  buildForumHref,
  canonicalizeForumLocation,
  isSameForumDestination,
  navigateForumDestination,
  parseForumLocation,
} from '~/services/forum/forumRoute'
import { appendForumSearchFacet, toggleForumSearchFacet } from '~/services/forum/forumSearchQuery'

const forumLocation = shallowRef<ParsedForumLocation | null>(null)
let canReturnToForumRoute = false
let canReturnFromSearch = false

export function publishForumLocation(input: string | URL, options: ForumRouteOptions): ParsedForumLocation | null {
  const previous = forumLocation.value
  const next = parseForumLocation(input, options)
  if (!next || next.route.name !== 'topic')
    canReturnToForumRoute = false
  else if (previous && previous.canonicalHref !== next.canonicalHref)
    canReturnToForumRoute = true
  if (!next || (next.route.name !== 'search' && next.route.name !== 'topic'))
    canReturnFromSearch = false
  forumLocation.value = next
  return forumLocation.value
}

export function useForumRoute() {
  const router = useRouter()
  const { localeIndex, site } = useData()
  const options = computed<ForumRouteOptions>(() => ({
    base: site.value.base,
    locales: Object.keys(site.value.locales),
  }))

  if (!import.meta.env.SSR && !forumLocation.value) {
    const parsed = publishForumLocation(window.location.href, options.value)
    if (parsed) {
      canonicalizeForumLocation(
        window.history,
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
        parsed.canonicalHref,
      )
    }
  }

  const route = computed(() => forumLocation.value?.route ?? null)
  const list = computed(() => route.value && 'list' in route.value ? route.value.list : null)

  function currentHref(): string {
    if (!import.meta.env.SSR)
      return `${window.location.pathname}${window.location.search}${window.location.hash}`
    return forumLocation.value?.canonicalHref ?? '/'
  }

  function currentLocale(): string {
    return route.value?.locale ?? localeIndex.value
  }

  function currentList(creator: string | null = null): ForumListRouteState {
    return {
      filter: list.value?.filter ?? 'all',
      topicType: list.value?.topicType ?? 'all',
      sort: list.value?.sort ?? 'created',
      q: list.value?.q ?? '',
      creator,
    }
  }

  function href(target: ForumRoute, hash?: string | null): string {
    return buildForumHref(target, {
      ...options.value,
      currentUrl: currentHref(),
      ...(hash === undefined ? {} : { hash }),
    })
  }

  async function navigate(target: ForumRoute, hash?: string | null): Promise<boolean> {
    const targetHref = href(target, hash)
    if (!import.meta.env.SSR && route.value?.name === 'search' && target.name === 'search') {
      if (isSameForumDestination(currentHref(), targetHref))
        return false
      // Keep the search page as one History entry so Back returns to the source list.
      window.history.replaceState(window.history.state, '', targetHref)
      await router.go(targetHref)
      return true
    }
    return navigateForumDestination(currentHref(), targetHref, router.go)
  }

  async function openSearchWithQuery(q: string): Promise<boolean> {
    const current = route.value
    if (!current || !('list' in current) || current.name === 'search')
      return false

    const fromUserPage = current.name === 'user'
    canReturnFromSearch = true
    try {
      return await navigate({
        name: 'search',
        locale: current.locale,
        username: null,
        list: fromUserPage
          ? {
              ...current.list,
              filter: 'everything',
              topicType: 'all',
              q: appendForumSearchFacet(q, 'author', current.username),
              creator: null,
            }
          : { ...current.list, q },
      }, null)
    }
    catch (error) {
      canReturnFromSearch = false
      throw error
    }
  }

  function openSearch(): Promise<boolean> {
    return openSearchWithQuery(list.value?.q ?? '')
  }

  async function leaveSearch(): Promise<void> {
    const current = route.value
    if (current?.name !== 'search')
      return
    if (!import.meta.env.SSR && canReturnFromSearch) {
      canReturnFromSearch = false
      window.history.back()
      return
    }
    const list = { ...current.list, q: '' }
    await navigate(current.username
      ? { name: 'user', locale: current.locale, username: current.username, list }
      : { name: 'home', locale: current.locale, list }, null)
  }

  function homeHref(filter: ForumFilter = 'all'): string {
    return href({
      name: 'home',
      locale: currentLocale(),
      list: { ...currentList(), filter, topicType: 'all', creator: null },
    }, null)
  }

  function topicHref(topicId: string, hash?: string | null): string {
    return href({ name: 'topic', locale: currentLocale(), topicId, commentPage: 1 }, hash)
  }

  function commentHref(topicId: string, commentId: string | number, commentPage: number): string {
    return href({ name: 'topic', locale: currentLocale(), topicId, commentPage }, `reply-${commentId}`)
  }

  function replaceCommentPage(commentPage: number): boolean {
    const current = route.value
    if (import.meta.env.SSR || current?.name !== 'topic')
      return false

    return canonicalizeForumLocation(
      window.history,
      currentHref(),
      href({ ...current, commentPage }),
    )
  }

  function userHref(username: string, filter: ForumFilter = 'all'): string {
    return href({
      name: 'user',
      locale: currentLocale(),
      username,
      list: { ...currentList(username), filter, topicType: 'all', creator: username },
    }, null)
  }

  async function leaveTopic(): Promise<void> {
    if (!import.meta.env.SSR && canReturnToForumRoute) {
      window.history.back()
      return
    }
    await router.go(homeHref())
  }

  async function navigateFilter(filter: ForumFilter): Promise<boolean> {
    const current = route.value
    if (!current || !('list' in current) || current.list.filter === filter)
      return false
    return navigate({ ...current, list: { ...current.list, filter } })
  }

  async function navigateType(
    topicType: ForumTopicType,
    fallbackToHome = false,
  ): Promise<boolean> {
    const current = route.value
    if (!fallbackToHome && (!current || !('list' in current)))
      return false
    if (current && 'list' in current) {
      if (current.list.topicType === topicType)
        return false
      return navigate({ ...current, list: { ...current.list, topicType } })
    }
    // 不在列表页（如话题详情）时落到首页，把类型作为列表条件带过去
    return navigate({
      name: 'home',
      locale: currentLocale(),
      list: { ...currentList(), filter: 'all', topicType, creator: null },
    }, null)
  }

  async function navigateSort(sort: ForumSort): Promise<boolean> {
    const current = route.value
    if (!current || !('list' in current) || current.list.sort === sort)
      return false
    return navigate({ ...current, list: { ...current.list, sort } })
  }

  async function submitSearch(q: string): Promise<boolean> {
    const current = route.value
    if (!current || !('list' in current))
      return false
    return navigate({ ...current, list: { ...current.list, q } })
  }

  /**
   * 当前列表的搜索串，地址栏优先：一次导航是先改 URL、再由路由管线发布到 store，
   * 两者之间的空窗里读 store 会拿到上一次的串，连点两个分面就会丢掉前一个。
   */
  function currentQuery(): string {
    if (!import.meta.env.SSR) {
      const route = parseForumLocation(window.location.href, options.value)?.route
      if (route && 'list' in route)
        return route.list.q
    }
    return list.value?.q ?? ''
  }

  /** 只换搜索串、保留其余列表状态；不在列表页时落到首页 */
  function facetTarget(nextQuery: string): ForumRoute {
    const current = route.value
    return current && 'list' in current
      ? { ...current, list: { ...current.list, q: nextQuery } }
      : {
          name: 'home',
          locale: currentLocale(),
          list: { ...currentList(), creator: null, q: nextQuery },
        }
  }

  async function addSearchFacet(facet: ForumSearchFacet, value: string): Promise<boolean> {
    return navigate(facetTarget(appendForumSearchFacet(currentQuery(), facet, value)), null)
  }

  async function toggleSearchFacet(facet: ForumSearchFacet, value: string): Promise<boolean> {
    return navigate(facetTarget(toggleForumSearchFacet(currentQuery(), facet, value)), null)
  }

  return {
    location: readonly(forumLocation),
    route,
    list,
    href,
    homeHref,
    topicHref,
    commentHref,
    userHref,
    replaceCommentPage,
    leaveTopic,
    navigate,
    openSearch,
    openSearchWithQuery,
    leaveSearch,
    navigateFilter,
    navigateType,
    navigateSort,
    submitSearch,
    addSearchFacet,
    toggleSearchFacet,
    clearSearch: () => submitSearch(''),
  }
}
