import type { SiteData } from 'vitepress'
import { useEventListener } from '@vueuse/core'
import { useData } from 'vitepress'
import { parseForumLocation } from '~/forum/services/forumRoute'
import { preloadForumRouteView } from '../components/AsyncForumRouteView'

export const loadForumLayout = () => import('../layouts/Forum.vue')

let entryPreload: Promise<unknown> | undefined

/** Warm the entry before navigation; mounted forum pages already load it on demand. */
export function preloadForumEntry(href: string, site: SiteData): void {
  if (import.meta.env.SSR || entryPreload)
    return
  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string, saveData?: boolean }
  }).connection
  if (connection?.saveData || connection?.effectiveType?.includes('2g'))
    return

  const url = new URL(href, location.href)
  const options = { base: site.base, locales: Object.keys(site.locales) }
  if (url.origin !== location.origin || !parseForumLocation(url, options)
    || parseForumLocation(location.href, options)) {
    return
  }

  entryPreload = Promise.all([
    loadForumLayout(),
    preloadForumRouteView(),
    import('~/forum/components/sidebar/ForumSidebar.vue'),
  ]).catch(() => {
    entryPreload = undefined
  })
}

/** Delegated listeners also cover links rendered after route or menu changes. */
export function useForumLinkPreload(): void {
  const { site } = useData()
  const warmLink = (event: Event) => {
    if (!(event.target instanceof Element))
      return
    const link = event.target.closest<HTMLAnchorElement>('a[href]')
    if (!link || link.hasAttribute('download'))
      return
    preloadForumEntry(link.href, site.value)
  }
  useEventListener('pointerover', (event: PointerEvent) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen')
      warmLink(event)
  }, { passive: true })
  useEventListener('focusin', warmLink)
}
