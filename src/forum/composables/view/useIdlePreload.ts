import { useDocumentVisibility } from '@vueuse/core'
import { onMounted, watch } from 'vue'

/** Warm likely interactions after the first paint, without mounting their UI. */
export function useIdlePreload(load: () => Promise<unknown> | void, enabled: () => boolean): void {
  const visibility = useDocumentVisibility()
  let ready = false
  let pending = false
  onMounted(() => {
    watch([enabled, visibility], ([active, visible], _previous, cleanup) => {
      const connection = (navigator as Navigator & {
        connection?: { effectiveType?: string, saveData?: boolean }
      }).connection
      if (!active || visible !== 'visible' || ready || pending
        || connection?.saveData || connection?.effectiveType?.includes('2g')) {
        return
      }

      let idle: number | undefined
      let timer: ReturnType<typeof setTimeout> | undefined
      const warm = () => {
        if (!enabled() || document.hidden)
          return
        pending = true
        void Promise.resolve().then(load).then((result) => {
          ready = result !== false
        }).catch(() => {
          // Intent-based loaders remain available after a speculative failure.
        }).finally(() => { pending = false })
      }
      const frame = requestAnimationFrame(() => {
        if ('requestIdleCallback' in window)
          idle = window.requestIdleCallback(warm, { timeout: 2000 })
        else
          timer = setTimeout(warm, 500)
      })
      cleanup(() => {
        cancelAnimationFrame(frame)
        if (idle !== undefined)
          window.cancelIdleCallback(idle)
        clearTimeout(timer)
      })
    }, { immediate: true })
  })
}
