import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ProximityHoverOptions } from './proximityHover'
import type { FluidHoverSource } from './store'
import { shallowRef, toValue, watch } from 'vue'
import { collectItems } from './measure'
import { createProximityHover } from './proximityHover'
import { getFluidHoverStore } from './store'

export interface UseFluidHoverOptions extends ProximityHoverOptions {}

export interface UseFluidHoverReturn {
  /** Index of the highlighted item among the eligible ones, or null. */
  activeIndex: Ref<number | null>
  activeElement: Ref<HTMLElement | null>
  source: Ref<FluidHoverSource | null>
  /** Counts pointer entries; a new entry starts a fresh indicator session. */
  session: Ref<number>
  remeasure: () => void
}

/**
 * Highlights the item under the pointer or, in gaps and padding, the nearest one. Items carry
 * `data-fluid-hover-item`; disabled ones are skipped. The container must be `position: relative`.
 * Pair with `useFluidHoverIndicator` on the same container for the shared highlight.
 */
export function useFluidHover(
  container: MaybeRefOrGetter<HTMLElement | null>,
  options: UseFluidHoverOptions = {},
): UseFluidHoverReturn {
  const activeIndex = shallowRef<number | null>(null)
  const activeElement = shallowRef<HTMLElement | null>(null)
  const source = shallowRef<FluidHoverSource | null>(null)
  const session = shallowRef(0)
  let latest: { remeasure: () => void } | null = null

  watch(() => toValue(container), (element, _previous, onCleanup) => {
    if (!element)
      return
    const store = getFluidHoverStore(element)
    const sync = () => {
      activeElement.value = store.highlighted
      source.value = store.source
      session.value = store.session
      activeIndex.value = store.highlighted
        ? collectItems(element).indexOf(store.highlighted)
        : null
    }
    const unsubscribe = store.subscribe(sync)
    const behavior = createProximityHover(element, options)
    latest = behavior
    sync()
    onCleanup(() => {
      if (latest === behavior)
        latest = null
      unsubscribe()
      behavior.destroy()
    })
  }, { immediate: true, flush: 'post' })

  return {
    activeIndex,
    activeElement,
    source,
    session,
    remeasure: () => latest?.remeasure(),
  }
}
