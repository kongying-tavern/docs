import type { ForumFilter, ForumListRouteState, ForumRoute, ForumRouteOptions, ForumSort, ParsedForumLocation } from '~/services/forum/forumRoute'
import { useData, useRouter } from 'vitepress'
import { computed, readonly, shallowRef } from 'vue'
import {
  buildForumHref,
  canonicalizeForumLocation,
  navigateForumDestination,
  parseForumLocation,
} from '~/services/forum/forumRoute'

const forumLocation = shallowRef<ParsedForumLocation | null>(null)

export function publishForumLocation(input: string | URL, options: ForumRouteOptions): ParsedForumLocation | null {
  forumLocation.value = parseForumLocation(input, options)
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
    return navigateForumDestination(currentHref(), targetHref, router.go)
  }

  function homeHref(filter: ForumFilter = 'all'): string {
    return href({
      name: 'home',
      locale: currentLocale(),
      list: { ...currentList(), filter, creator: null },
    }, null)
  }

  function topicHref(topicId: string, hash?: string | null): string {
    return href({ name: 'topic', locale: currentLocale(), topicId }, hash)
  }

  function userHref(username: string, filter: ForumFilter = 'all'): string {
    return href({
      name: 'user',
      locale: currentLocale(),
      username,
      list: { ...currentList(username), filter, creator: username },
    }, null)
  }

  async function navigateFilter(filter: ForumFilter): Promise<boolean> {
    const current = route.value
    if (!current || !('list' in current) || current.list.filter === filter)
      return false
    return navigate({ ...current, list: { ...current.list, filter } })
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

  return {
    location: readonly(forumLocation),
    route,
    list,
    href,
    homeHref,
    topicHref,
    userHref,
    navigate,
    navigateFilter,
    navigateSort,
    submitSearch,
    clearSearch: () => submitSearch(''),
  }
}
