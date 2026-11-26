import type { LocaleConfig, Router } from 'vitepress'
import { markRaw } from 'vue'
import { publishForumLocation } from '@/src/forum/composables/state/useForumRoute.ts'
import { transitionForumBlog, transitionForumRoute } from '@/src/forum/router/forumViewTransition.ts'
import { canonicalizeForumLocation, forumRouteParams, parseForumLocation } from '@/src/forum/services/forumRoute.ts'
import { AsyncForumRouteView } from './asyncForumRouteView.ts'

const FORUM_TITLES: Record<string, string> = {
  root: '社区反馈',
  en: 'Feedback',
  ja: 'フィードバック',
}

const LEADING_SLASH_REGEX = /^\//

export default async function handleRouteMatching(
  to: string,
  base: string,
  router: Router,
  localeConfig: LocaleConfig,
): Promise<boolean> {
  const routeOptions = { base, locales: Object.keys(localeConfig) }
  const forumLocation = parseForumLocation(to, routeOptions)
  const currentPath = router.route.path
  if (forumLocation) {
    const currentForumRoute = parseForumLocation(currentPath, {
      base: '/',
      locales: routeOptions.locales,
    })?.route ?? null
    const updateRoute = () => {
      if (typeof window !== 'undefined') {
        const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`
        canonicalizeForumLocation(window.history, currentHref, forumLocation.canonicalHref)
        publishForumLocation(forumLocation.canonicalHref, routeOptions)
      }

      router.route.path = stripConfiguredBase(new URL(forumLocation.canonicalHref, 'https://example.com').pathname, base)
      router.route.component = markRaw(AsyncForumRouteView)
      router.route.data = buildForumRouteData(router.route.path, forumLocation.route.locale, forumRouteParams(forumLocation.route))
    }

    if (typeof window === 'undefined')
      updateRoute()
    else if (currentForumRoute)
      await transitionForumRoute(currentForumRoute, forumLocation.route, updateRoute)
    else
      await transitionForumBlog(currentPath, forumLocation.canonicalHref, updateRoute)
    return false
  }

  if (typeof window !== 'undefined')
    publishForumLocation(to, routeOptions)

  return true
}

function buildForumRouteData(path: string, locale: string, params: Record<string, string>) {
  return {
    params,
    relativePath: path.replace(LEADING_SLASH_REGEX, ''),
    filePath: path.replace(LEADING_SLASH_REGEX, ''),
    title: FORUM_TITLES[locale] || FORUM_TITLES.root,
    description: '',
    headers: [],
    frontmatter: { sidebar: true, layout: 'Forum' },
  }
}

function stripConfiguredBase(pathname: string, base: string): string {
  const normalizedBase = `/${base.split('/').filter(Boolean).join('/')}/`
  if (normalizedBase === '//')
    return pathname

  const baseWithoutSlash = normalizedBase.slice(0, -1)
  if (pathname === baseWithoutSlash)
    return '/'
  return pathname.startsWith(normalizedBase)
    ? `/${pathname.slice(normalizedBase.length)}`
    : pathname
}
