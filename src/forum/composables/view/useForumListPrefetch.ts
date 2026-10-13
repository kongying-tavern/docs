import type { Ref } from 'vue'
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { nextTick, onDeactivated, onMounted, onScopeDispose, watch } from 'vue'
import { forumListPrefetchDistance } from '~/forum/services/forumListPrefetch'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { layoutTop } from '~/forum/utils/layoutPosition'

interface ListPrefetchOptions {
  readonly itemCount: number
  readonly loadMore?: () => Promise<unknown> | unknown
  readonly loading?: boolean
  readonly error?: Error | null
  readonly canLoadMore?: boolean
  readonly pageLoadDuration?: number
}

/** Keep scroll sampling and request lifetime separate from list presentation. */
export function useForumListPrefetch(options: ListPrefetchOptions, host: Readonly<Ref<HTMLElement | null>>, active: Ref<boolean>) {
  const userAuth = useUserAuthStore()
  if (options.loadMore && !import.meta.env.SSR) {
    let autoLoading = false
    let lastScrollTop = 0
    let lastScrollAt = performance.now()
    let requestDuration = 1000
    let downwardSpeed = 0
    let frame = 0
    let disposed = false

    async function checkLoadMore(): Promise<void> {
      frame = 0
      if (disposed || !active.value || autoLoading || options.loading || options.error || !options.canLoadMore || !options.itemCount)
        return
      const scrollRoot = document.documentElement
      const duration = Math.max(options.pageLoadDuration ?? 0, requestDuration)
      const speed = downwardSpeed * Math.exp(-(performance.now() - lastScrollAt) / 180)
      const distance = forumListPrefetchDistance(userAuth.isLoggedIn, scrollRoot.clientHeight, speed, duration)
      const results = host.value?.closest<HTMLElement>('.forum-topic-results') ?? host.value
      // Initial page motion can temporarily clip the document to one viewport.
      const end = Math.max(scrollRoot.scrollHeight, results ? layoutTop(results) + results.offsetHeight : 0)
      if (end - scrollRoot.scrollTop - scrollRoot.clientHeight >= distance)
        return
      autoLoading = true
      const started = performance.now()
      try {
        await options.loadMore!()
        await nextTick()
        requestDuration = requestDuration * 0.7 + (performance.now() - started) * 0.3
      }
      catch {
        // Query state owns the error and manual retry.
      }
      finally {
        autoLoading = false
      }
      queueCheck()
    }

    function queueCheck(): void {
      if (!disposed && !frame && active.value)
        frame = requestAnimationFrame(() => void checkLoadMore())
    }

    useEventListener(window, 'scroll', () => {
      const now = performance.now()
      const top = document.documentElement.scrollTop
      downwardSpeed = Math.max(0, (top - lastScrollTop) / Math.max(now - lastScrollAt, 16))
      lastScrollTop = top
      lastScrollAt = now
      queueCheck()
    }, { passive: true })
    useResizeObserver(host, queueCheck)
    watch([() => options.itemCount, () => options.loading, () => options.canLoadMore, active], queueCheck, { flush: 'post' })
    onMounted(queueCheck)
    onScopeDispose(() => {
      disposed = true
      cancelAnimationFrame(frame)
    })
    onDeactivated(() => {
      cancelAnimationFrame(frame)
      frame = 0
      downwardSpeed = 0
    })
  }
}
