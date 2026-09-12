import type { LocaleConfig, Router } from 'vitepress'
import type { LocaleRoute } from '../../routes'
import { merge } from 'lodash-es'
import { match } from 'path-to-regexp'
import { withBase } from 'vitepress'
import { markRaw } from 'vue'
import { getLangPath } from '@/utils'
import { publishForumLocation } from '~/composables/useForumRoute'
import { canonicalizeForumLocation, forumRouteParams, parseForumLocation } from '~/services/forum/forumRoute'
import { AsyncForumRouteView } from '../components/AsyncForumRouteView'
import { transitionForumBlog, transitionForumRoute } from './forumViewTransition'

const FORUM_TITLES: Record<string, string> = {
  root: '社区反馈',
  en: 'Feedback',
  ja: 'フィードバック',
}

const LEADING_SLASH_REGEX = /^\//

export default async function handleRouteMatching(
  to: string,
  base: string,
  routes: LocaleRoute[],
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

  const normalizePath = stripConfiguredBase(new URL(to, 'https://example.com').pathname, base)
  const matchResult = matchRoute(to, routes, localeConfig)

  if (!matchResult)
    return true

  const { route, locale, params } = matchResult

  if (!isOptionValid(route, params))
    return true
  const updateRoute = () => {
    router.route.path = route.path || normalizePath
    router.route.component = markRaw(route.component)
    router.route.data = buildRouteData(normalizePath, route, locale, params)
  }
  updateRoute()
  return false
}

function matchRoute(to: string, localeRoute: LocaleRoute[], LocaleConfig: LocaleConfig) {
  const locales = Object.keys(LocaleConfig)
  const toPath = new URL(to, 'https://example.com').pathname

  for (const route of localeRoute) {
    const tryMatch = (locale?: string) => {
      const path = withBase(locale ? `${getLangPath(locale)}${route.match}` : route.match)
      return match(path)(toPath)
    }

    if (route.i18n) {
      for (const locale of locales) {
        const result = tryMatch(locale)
        if (result) {
          return { route, locale, params: result.params || {} }
        }
      }
    }
    else {
      const result = tryMatch()
      if (result) {
        return { route, locale: '', params: result.params || {} }
      }
    }
  }

  return null
}

function isOptionValid(route: LocaleRoute, params: Partial<Record<string, string | string[]>>) {
  if (!route.options)
    return true

  for (const [key, validValues] of Object.entries(route.options)) {
    const value = params[key]
    if (value && !validValues.includes(String(value))) {
      return false
    }
  }

  return true
}

function buildRouteData(
  path: string,
  route: LocaleRoute,
  locale: string,
  params: Partial<Record<string, string | string[]>>,
) {
  return merge({
    params,
    relativePath: path,
    filePath: path,
    title: route.locales?.[locale]?.title || '',
    description: route.locales?.[locale]?.description || '',
    headers: [],
    frontmatter: { sidebar: false, layout: 'page' },
  }, route.data)
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
