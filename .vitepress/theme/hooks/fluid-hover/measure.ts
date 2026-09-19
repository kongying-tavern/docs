import type { ItemRect } from './geometry'
import { CONTAINER_SELECTOR, DISABLED_SELECTOR, ITEM_SELECTOR } from './constants'

const GEOMETRY_PROPERTY = /^(?:transform|translate|scale|rotate|zoom|width|height)$/

/** True while the element has a layout box; a `display: none` / not-yet-laid-out subtree reports all-zero offsets. */
export function hasLayoutBox(element: HTMLElement): boolean {
  return element.offsetParent !== null || element.offsetWidth > 0 || element.offsetHeight > 0
}

/** An item is highlightable unless it (or a form ancestor) is disabled. */
export function isEligibleItem(element: Element): element is HTMLElement {
  return element instanceof HTMLElement && !element.matches(DISABLED_SELECTOR)
}

/**
 * Measures `item` in `container`'s layout space: padding-edge origin, scroll-independent, and
 * unaffected by CSS transforms on the container or its ancestors, because `offset*` values are
 * layout, not visual. Items nested inside positioned descendants of the container accumulate those
 * ancestors' offsets. Returns null when the offset chain leaves the container — the container must
 * be positioned (`position: relative`, which the shared indicator requires anyway).
 */
export function measureItemRect(item: HTMLElement, container: HTMLElement): ItemRect | null {
  let top = item.offsetTop
  let left = item.offsetLeft
  let ancestor = item.offsetParent as HTMLElement | null
  while (ancestor && ancestor !== container) {
    if (!container.contains(ancestor))
      return null
    top += ancestor.offsetTop + ancestor.clientTop
    left += ancestor.offsetLeft + ancestor.clientLeft
    ancestor = ancestor.offsetParent as HTMLElement | null
  }
  return { top, left, width: item.offsetWidth, height: item.offsetHeight }
}

/** Eligible items in document order; items of nested fluid hover containers are excluded. */
export function collectItems(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(ITEM_SELECTOR)]
    .filter(element => isEligibleItem(element) && element.closest(CONTAINER_SELECTOR) === container)
}

/**
 * Calls `callback`, at most once a frame, after a CSS animation or a geometry transition ends on
 * `container` or an ancestor: geometry measured while it ran (a menu mid zoom-in) would be off, and
 * nothing else reports its end. Returns stop.
 */
export function onAncestorMotionEnd(container: HTMLElement, callback: () => void): () => void {
  const doc = container.ownerDocument
  let raf = 0
  const onEnd = (event: Event) => {
    if (raf || (event.type === 'transitionend' && !GEOMETRY_PROPERTY.test((event as TransitionEvent).propertyName)))
      return
    if (!(event.target instanceof Node && event.target.contains(container)))
      return
    raf = requestAnimationFrame(() => {
      raf = 0
      callback()
    })
  }
  doc.addEventListener('animationend', onEnd, true)
  doc.addEventListener('transitionend', onEnd, true)
  return () => {
    cancelAnimationFrame(raf)
    doc.removeEventListener('animationend', onEnd, true)
    doc.removeEventListener('transitionend', onEnd, true)
  }
}
