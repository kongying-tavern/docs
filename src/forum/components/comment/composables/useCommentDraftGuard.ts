import type { ComputedRef } from 'vue'
import { useRouter } from 'vitepress'
import { onBeforeUnmount } from 'vue'

/** Chain the site's route hook; the composer owns page-unload protection. */
export function useCommentDraftGuard(hasDraft: ComputedRef<boolean>, prompt: () => string): void {
  const router = useRouter()
  const previous = router.onBeforeRouteChange
  let active = true
  let approvedTo: string | undefined
  const guard: NonNullable<typeof router.onBeforeRouteChange> = async (to) => {
    if (active && hasDraft.value && approvedTo !== to) {
      // eslint-disable-next-line no-alert -- route cancellation needs a synchronous browser decision
      if (!window.confirm(prompt()))
        return false
      approvedTo = to
    }
    try {
      return await previous?.(to)
    }
    finally {
      approvedTo = undefined
    }
  }
  if (!import.meta.env.SSR)
    router.onBeforeRouteChange = guard
  onBeforeUnmount(() => {
    active = false
    if (router.onBeforeRouteChange === guard)
      router.onBeforeRouteChange = previous
  })
}
