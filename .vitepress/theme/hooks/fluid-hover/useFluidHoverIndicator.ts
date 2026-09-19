import type { MaybeRefOrGetter } from 'vue'
import type { HighlightIndicatorOptions } from './indicator'
import { toValue, watch } from 'vue'
import { createHighlightIndicator } from './indicator'

export interface UseFluidHoverIndicatorOptions extends HighlightIndicatorOptions {}

export interface UseFluidHoverIndicatorReturn {
  remeasure: () => void
  /** Stops observing and animating while keeping the indicator's rendered paint. */
  freeze: () => void
}

/**
 * Springs one shared highlight onto the item `useFluidHover` (or the `target` selector) marks, on
 * the same container. The container must be `position: relative`; the indicator element must be
 * `position: absolute; top: 0; left: 0; pointer-events: none` inside it.
 */
export function useFluidHoverIndicator(
  container: MaybeRefOrGetter<HTMLElement | null>,
  indicator: MaybeRefOrGetter<HTMLElement | null>,
  options: UseFluidHoverIndicatorOptions = {},
): UseFluidHoverIndicatorReturn {
  let latest: { remeasure: () => void, freeze: () => void } | null = null

  watch([() => toValue(container), () => toValue(indicator)], ([element, target], _previous, onCleanup) => {
    if (!element || !target)
      return
    const instance = createHighlightIndicator(element, target, options)
    latest = instance
    onCleanup(() => {
      if (latest === instance)
        latest = null
      instance.destroy()
    })
  }, { immediate: true, flush: 'post' })

  return {
    remeasure: () => latest?.remeasure(),
    freeze: () => latest?.freeze(),
  }
}
