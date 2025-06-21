import type { LocaleConfig, Router } from 'vitepress'
import type { LocaleRoute } from '../../routes'
import { getLangPath, stripTrailingSlashInPath } from '@/utils'
import { merge } from 'lodash-es'
import { match } from 'path-to-regexp'
import { withBase } from 'vitepress'
import { markRaw } from 'vue'

export default function handleRouteMatching(
  to: string,
  base: string,
  routes: LocaleRoute[],
  router: Router,
  localeConfig: LocaleConfig,
): boolean {
  const normalizePath = new URL(to, 'https://example.com').pathname.replace(base, '')
  const matchResult = matchRoute(to, routes, localeConfig)

  if (!matchResult)
    return true

  const { route, locale, params } = matchResult

  if (!isOptionValid(route, params))
    return true
  router.route.path = route.path || normalizePath
  router.route.component = markRaw(route.component)
  router.route.data = buildRouteData(normalizePath, route, locale, params)
  stripTrailingSlashInPath()
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
