import type { FluidHoverAxis, ItemRect } from './geometry'
import type { FluidHoverStore } from './store'
import {
  CONTAINER_ATTR,
  ITEM_SELECTOR,
  MEASUREMENT_ATTEMPTS,
  OWN_CLICK_SELECTOR,
} from './constants'
import { pickNearest } from './geometry'
import { collectItems, hasLayoutBox, measureItemRect, onAncestorMotionEnd } from './measure'
import { getFluidHoverStore } from './store'

export interface ProximityHoverOptions {
  /** Which way the nearest item is measured along: `y` for lists, `x` for strips, `xy` for grids. */
  axis?: FluidHoverAxis
  /** Skips an item without remeasuring; consulted on every pick, so keep it cheap. */
  isItemDisabled?: (element: HTMLElement) => boolean
  /**
   * Non-item content (group labels, headers) that highlights nothing, where a real gap picks the
   * nearest item.
   */
  ignore?: string
  /**
   * Routes a click that lands between items to the highlighted one, so what is lit is what a click
   * hits. Default false; pass `{ maxDistance }` to route only clicks within that many pixels of the
   * highlighted item's edge. Never enable where empty space should stay inert or a wrong click
   * would hurt.
   */
  gapClick?: boolean | { maxDistance?: number }
}

export interface ProximityHover {
  store: FluidHoverStore
  /** Measures the items again, for geometry that changed without a DOM mutation or a resize. */
  remeasure: () => void
  destroy: () => void
}

const ACTIVATOR_SELECTOR
  = 'a[href], button, [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="option"], [role="radio"], [role="checkbox"], [role="tab"], [role="link"], [role="button"]'

/**
 * The element a routed click should land on. A registered item is usually the interactive row
 * itself; when it is only a box around one, the first control inside is what a real click on the
 * row would have reached.
 */
function resolveActivator(element: HTMLElement): HTMLElement {
  if (element.matches(ACTIVATOR_SELECTOR) || element.hasAttribute('tabindex'))
    return element
  return element.querySelector<HTMLElement>(ACTIVATOR_SELECTOR) ?? element
}

/**
 * Highlights the item under the pointer or, in gaps and padding, the nearest one. Items carry
 * `data-fluid-hover-item`; disabled ones are skipped. The container must be positioned and becomes
 * the discovery scope: items inside a nested fluid hover container belong to that one.
 */
export function createProximityHover(
  container: HTMLElement,
  options: ProximityHoverOptions = {},
): ProximityHover {
  const axis = options.axis ?? 'y'
  const gapClick = options.gapClick ?? false
  const gapClickMaxDistance = typeof gapClick === 'object'
    ? gapClick.maxDistance ?? Number.POSITIVE_INFINITY
    : Number.POSITIVE_INFINITY
  const store = getFluidHoverStore(container)

  let items: HTMLElement[] = []
  let rects: (ItemRect | undefined)[] = []
  let px = 0
  let py = 0
  let hovering = false
  let stale = true
  let dirty = false
  let forced = false
  let scrolled = false
  let raf = 0
  let measurementTries = MEASUREMENT_ATTEMPTS
  let pickedLeft = container.scrollLeft
  let pickedTop = container.scrollTop
  const observed = new Set<HTMLElement>()

  const resizeObserver = new ResizeObserver(() => invalidate())
  resizeObserver.observe(container)
  const mutationObserver = new MutationObserver(() => invalidate())
  mutationObserver.observe(container, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['disabled', 'aria-disabled', 'data-disabled'],
  })
  // Rects measured while an ancestor was scaled (a menu mid zoom-in) are off, and nothing mutates when it ends.
  const stopMotionEnd = onAncestorMotionEnd(container, () => {
    if (!stale)
      invalidate()
  })

  container.setAttribute(CONTAINER_ATTR, '')

  // A static container leaves the offset chain outside the container and measurement fails
  // silently; this bit us once with reka's popper wrapper, whose content element is not positioned.
  if (import.meta.env.DEV && getComputedStyle(container).position === 'static') {
    // eslint-disable-next-line no-console
    console.warn('[fluid-hover] container must be positioned (e.g. `relative`), measurement would fail')
  }

  function invalidate() {
    stale = true
    if (hovering && !store.pointerSuspended()) {
      dirty = true
      schedule()
    }
  }

  function schedule() {
    if (!raf)
      raf = requestAnimationFrame(pick)
  }

  /** Publishes a rect for every eligible item. Returns false when the pass was incomplete. */
  function measure(): boolean {
    const next = collectItems(container)
    const nextRects: (ItemRect | undefined)[] = []
    let complete = true
    for (let index = 0; index < next.length; index++) {
      const item = next[index]!
      // An element inside a display:none / not-yet-laid-out popup reports every offset as 0:
      // treat the whole pass as incomplete so the last complete measurement stands.
      if (!hasLayoutBox(item)) {
        complete = false
        continue
      }
      const rect = measureItemRect(item, container)
      if (!rect) {
        complete = false
        continue
      }
      nextRects[index] = rect
    }
    if (complete) {
      items = next
      rects = nextRects
      const current = new Set(items)
      for (const item of current) {
        if (!observed.has(item)) {
          observed.add(item)
          resizeObserver.observe(item)
        }
      }
      for (const item of observed) {
        if (!current.has(item)) {
          observed.delete(item)
          resizeObserver.unobserve(item)
        }
      }
    }
    return complete
  }

  function pick() {
    raf = 0
    if (!hovering || store.pointerSuspended())
      return
    if (stale) {
      if (!measure()) {
        // A popup can be in the DOM one frame before it is laid out: retry a few frames, and stop
        // so a list that stays hidden does not spin forever (a later resize re-triggers).
        if (measurementTries > 0) {
          measurementTries--
          schedule()
        }
        return
      }
      measurementTries = MEASUREMENT_ATTEMPTS
    }
    if (!dirty)
      return
    // A virtualizer can re-render mid-scroll before the scroll event arrives; that event re-picks.
    if (!forced && (container.scrollLeft !== pickedLeft || container.scrollTop !== pickedTop))
      return
    dirty = forced = false
    pickedLeft = container.scrollLeft
    pickedTop = container.scrollTop
    const box = container.getBoundingClientRect()
    const isItemDisabled = options.isItemDisabled
    const index = pickNearest({
      axis,
      point: { x: px, y: py },
      rects,
      containerRect: { left: box.left, top: box.top, width: box.width, height: box.height },
      scroll: { x: container.scrollLeft, y: container.scrollTop },
      border: { x: container.clientLeft, y: container.clientTop },
      layoutSize: { width: container.offsetWidth, height: container.offsetHeight },
      view: {
        x: container.scrollLeft,
        y: container.scrollTop,
        width: container.clientWidth,
        height: container.clientHeight,
      },
      isDisabled: isItemDisabled
        ? index => isItemDisabled(items[index]!)
        : undefined,
    })
    const item = index === null ? null : items[index] ?? null
    store.snap = scrolled
    store.highlight(item, 'pointer')
    scrolled = false
  }

  function onPointerEnter(event: PointerEvent) {
    if (event.pointerType === 'touch')
      return
    hovering = true
    stale = true
    store.beginSession()
    onPointerMove(event)
  }

  function onPointerMove(event: PointerEvent) {
    if (!hovering)
      return
    px = event.clientX
    py = event.clientY
    if (!store.acceptsPointer(event))
      return
    const target = event.target as Element | null
    if (options.ignore && target && target !== container && container.contains(target)) {
      // Over ignored content nothing is highlighted; a pick queued for an earlier position must
      // not override the clear.
      if (!target.closest(ITEM_SELECTOR) && target.closest(options.ignore)) {
        dirty = forced = false
        if (stale)
          schedule()
        if (store.source === 'pointer')
          store.highlight(null, null)
        return
      }
    }
    dirty = forced = true
    schedule()
  }

  function onPointerLeave() {
    hovering = false
    store.resumePointer()
    if (store.source === 'pointer')
      store.highlight(null, null)
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  // Content moving under a still pointer is followed at once, like native :hover.
  function onScroll() {
    if (!hovering || store.pointerSuspended())
      return
    dirty = forced = scrolled = true
    schedule()
  }

  function onClick(event: MouseEvent) {
    const item = store.highlighted
    const target = event.target as Element | null
    if (!item || !target)
      return
    // Inside an item, or on a control between the rows: the target owns the click.
    if (target.closest(`${ITEM_SELECTOR}, ${OWN_CLICK_SELECTOR}`))
      return
    // A row that unmounted while its own click was still bubbling already landed; it is not a gap.
    if (!target.isConnected)
      return
    if (gapClickMaxDistance !== Number.POSITIVE_INFINITY) {
      const rect = item.getBoundingClientRect()
      const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right)
      const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom)
      if (Math.hypot(dx, dy) > gapClickMaxDistance)
        return
    }
    resolveActivator(item).click()
  }

  const listeners: Array<[type: string, listener: EventListener, options?: AddEventListenerOptions]> = [
    ['pointerenter', onPointerEnter as EventListener],
    ['pointermove', onPointerMove as EventListener, { passive: true }],
    ['pointerleave', onPointerLeave as EventListener],
    // Captured, so a descendant scroll container scrolling under a still pointer also re-picks.
    ['scroll', onScroll as EventListener, { passive: true, capture: true }],
  ]
  if (gapClick)
    listeners.push(['click', onClick as EventListener])
  for (const [type, listener, listenerOptions] of listeners)
    container.addEventListener(type, listener, listenerOptions)

  return {
    store,
    remeasure: invalidate,
    destroy() {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      stopMotionEnd()
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      for (const [type, listener, listenerOptions] of listeners)
        container.removeEventListener(type, listener, listenerOptions)
      container.removeAttribute(CONTAINER_ATTR)
    },
  }
}
