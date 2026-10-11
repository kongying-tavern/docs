import type { Router, SiteData } from 'vitepress'
import type { Ref } from 'vue'
import { publishForumLocation } from '~/forum/composables/state/useForumRoute'
import { isForumToBlogNavigation, transitionForumBlog } from '~/forum/router/forumViewTransition'
import { parseForumLocation } from '~/forum/services/forumRoute'
import { identifySessionIfEnabled } from '~/services/telemetry'
import { routes } from '../../routes'
import handleRouteMatching from '../lib/handleRouteMatching'
import { preloadForumEntry } from './forumPreload'

/** Install the theme's navigation lifecycle in one place. */
export function installThemeRouter(router: Router, siteData: Ref<SiteData>, initialDocument: Ref<boolean>): void {
  let resumingBlogNavigation = false
  let initialNavigation = true
  let loadingForumShell = false
  let initialPageLoad = true
  router.onBeforeRouteChange = async (to) => {
    if (loadingForumShell)
      return
    if (initialNavigation)
      initialNavigation = false
    else
      initialDocument.value = false
    preloadForumEntry(to, siteData.value)
    if (resumingBlogNavigation || !isForumToBlogNavigation(router.route.path, to))
      return
    await transitionForumBlog(router.route.path, to, async () => {
      resumingBlogNavigation = true
      try {
        await router.go(to)
      }
      finally {
        resumingBlogNavigation = false
      }
    })
    return false
  }
  router.onBeforePageLoad = async (to) => {
    if (loadingForumShell)
      return true
    const isInitialPageLoad = initialPageLoad
    initialPageLoad = false
    const forumLocation = parseForumLocation(to, { base: siteData.value.base, locales: Object.keys(siteData.value.locales) })
    if (!import.meta.env.SSR && isInitialPageLoad && forumLocation) {
      // VitePress must consume its initial (lean) page load before custom routes
      // take over. Otherwise the first document navigation gets an empty lean
      // chunk instead of the full Markdown body. Subroutes use the static shell.
      const localePrefix = forumLocation.route.locale === 'root' ? '' : `${forumLocation.route.locale}/`
      const initialLocation = new URL(to, location.href)
      // Keep query/hash: changing only these makes VitePress skip the page loader,
      // even with initialLoad, when the initial route is already the forum shell.
      const shellHref = `${siteData.value.base}${localePrefix}feedback${initialLocation.search}${initialLocation.hash}`
      loadingForumShell = true
      try {
        await router.go(shellHref, { initialLoad: true, replace: true })
      }
      finally {
        loadingForumShell = false
      }
    }
    const shouldLoadPage = await handleRouteMatching(to, siteData.value.base, routes, router, siteData.value.locales)
    identifySessionIfEnabled()
    return shouldLoadPage
  }
  // 同路径只换 query/hash 时 VitePress 不加载页面，onBeforePageLoad 不会跑，状态要在这里补回灌
  router.onAfterRouteChange = (to) => {
    if (loadingForumShell)
      return
    publishForumLocation(to, { base: siteData.value.base, locales: Object.keys(siteData.value.locales) })
  }
}
