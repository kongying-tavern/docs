import type { Router, SiteData } from 'vitepress'
import { expect, test, vi } from 'vitest'
import { ref, shallowRef } from 'vue'
import { installThemeRouter } from '../../.vitepress/theme/router/installThemeRouter'
import { publishForumLocation } from '../../src/forum/composables/state/useForumRoute'

vi.mock('vitepress', () => ({ useData: vi.fn() }))
vi.mock('../../src/forum/composables/state/useForumRoute', () => ({ publishForumLocation: vi.fn() }))
vi.mock('../../src/forum/router/forumViewTransition', () => ({ isForumToBlogNavigation: () => false, transitionForumBlog: vi.fn() }))
vi.mock('../../src/forum/services/forumRoute', () => ({ parseForumLocation: () => null }))
vi.mock('../../src/services/telemetry', () => ({ identifySessionIfEnabled: vi.fn() }))
vi.mock('../../.vitepress/routes', () => ({ routes: [] }))
vi.mock('../../.vitepress/theme/lib/handleRouteMatching', () => ({ default: async () => true }))
vi.mock('../../.vitepress/theme/router/forumPreload', () => ({ preloadForumEntry: vi.fn() }))

function routerWith(loadLocale: (locale: string) => Promise<void>, base = '/docs/') {
  const router = { route: { path: '/docs/' } } as Router
  const site = shallowRef({ base, locales: { root: {}, en: {}, ja: {} } } as unknown as SiteData)
  installThemeRouter(router, site, ref(true), loadLocale)
  return router
}

test('page-load hook prepares messages for direct and history navigation, including root base', async () => {
  const load = vi.fn(async () => {})
  const router = routerWith(load)
  expect(await router.onBeforePageLoad!('https://example.com/docs/en/announcement')).toBe(true)
  expect(load).toHaveBeenLastCalledWith('en')
  expect(await router.onBeforePageLoad!('/docs/ja/feedback/123?x=1#reply')).toBe(true)
  expect(load).toHaveBeenLastCalledWith('ja')
  expect(await router.onBeforePageLoad!('/docs/announcement')).toBe(true)
  expect(load).toHaveBeenLastCalledWith('root')
  const dev = routerWith(load, '/')
  await dev.onBeforePageLoad!('/en/announcement')
  expect(load).toHaveBeenLastCalledWith('en')
})

test('a slower previous locale load cannot resume after a newer page load', async () => {
  let finish!: () => void
  const router = routerWith(locale => locale === 'en'
    ? new Promise<void>((resolve) => {
        finish = resolve
      })
    : Promise.resolve())
  const first = router.onBeforePageLoad!('/docs/en/announcement')
  expect(await router.onBeforePageLoad!('/docs/ja/announcement')).toBe(true)
  finish()
  expect(await first).toBe(false)
})

test('failed locale loads cancel the page load and allow a later retry', async () => {
  const report = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
  const router = routerWith(load)
  expect(await router.onBeforePageLoad!('/docs/en/announcement')).toBe(false)
  expect(report).toHaveBeenCalledOnce()
  expect(await router.onBeforePageLoad!('/docs/en/announcement')).toBe(true)
})

test('ordinary navigation rejects a failed locale before the router changes history', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
  const router = routerWith(load)
  expect(await router.onBeforeRouteChange!('/docs/en/agreement')).toBe(false)
  expect(await router.onBeforeRouteChange!('/docs/en/agreement')).toBeUndefined()
})

test('failed history navigation restores the current URL and publishes that location', async () => {
  vi.stubEnv('SSR', false)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const current = 'https://example.com/docs/agreement?tab=1#section'
  vi.stubGlobal('location', { href: current })
  const replaceState = vi.fn((_state, _title, href) => {
    location.href = new URL(href, current).href
  })
  vi.stubGlobal('history', { state: { scrollPosition: 10 }, replaceState })
  const router = routerWith(async () => {
    throw new Error('offline')
  })
  Object.assign(router.route, { path: '/docs/agreement', query: '?tab=1', hash: '#section' })
  location.href = 'https://example.com/docs/en/agreement'
  expect(await router.onBeforePageLoad!('/docs/en/agreement')).toBe(false)
  expect(replaceState).toHaveBeenCalledWith({ scrollPosition: 10 }, '', current)
  await router.onAfterRouteChange!('/docs/en/agreement')
  expect(publishForumLocation).toHaveBeenLastCalledWith(current, expect.anything())
})
