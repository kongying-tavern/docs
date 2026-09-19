import type { MotionTier } from './constants'
import { FADE_IN, FADE_OUT, MOTION_TIERS } from './constants'
import { hasLayoutBox, measureItemRect, onAncestorMotionEnd } from './measure'
import { stepSpring } from './spring'
import { getFluidHoverStore } from './store'

export interface HighlightIndicatorOptions {
  /**
   * Selector of the element to sit on; defaults to the store's highlighted item. A list that
   * resolves its own selection (a tab strip, `aria-selected`) passes its selector instead.
   */
  target?: string
  /** Selector the indicator grows out of on a new session and returns into when it ends. */
  from?: string
  /** Spring tier: `fast` follows the pointer, `moderate` suits a moving selection. Default `fast`. */
  motion?: MotionTier
  /** Jump instead of gliding; fades still run. Read on every frame. Default: `prefers-reduced-motion: reduce`. */
  reducedMotion?: () => boolean
}

export interface HighlightIndicator {
  /** Measures the target again, for geometry that changed without a DOM mutation or a resize. */
  remeasure: () => void
  /** Stops observing and animating while keeping the indicator's rendered paint. */
  freeze: () => void
  destroy: () => void
}

function sizeOf(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return `${rect.width} ${rect.height}`
}

/**
 * Springs one shared highlight onto the store's highlighted item (or the `target` selector's).
 * The container is `position: relative` and may scroll; the indicator is `position: absolute;
 * top: 0; left: 0; pointer-events: none` inside it. Transform, size and opacity are written
 * directly every animated frame — no Vue render, no per-move layout read: rects are measured in
 * the container's layout space on invalidation, and pointer picking does math on the cache.
 */
export function createHighlightIndicator(
  container: HTMLElement,
  indicator: HTMLElement,
  options: HighlightIndicatorOptions = {},
): HighlightIndicator {
  const store = getFluidHoverStore(container)
  const duration = MOTION_TIERS[options.motion ?? 'fast']
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  const reducedMotion = () => options.reducedMotion?.() ?? reducedMotionQuery.matches

  const pos = new Float64Array(4)
  const vel = new Float64Array(4)
  const target = new Float64Array(4)
  const originalStyles = (['opacity', 'transform', 'width', 'height'] as const).map(property =>
    [property, indicator.style.getPropertyValue(property), indicator.style.getPropertyPriority(property)] as const,
  )
  let opacity = 0
  let visible = false
  let initial = true
  let current: HTMLElement | null = null
  let needsSync = true
  let queued = false
  let pending = false
  let raf = 0
  let last = 0
  let writtenSize = ''
  let measuredSize = ''
  let destroyed = false
  let frozen = false

  const resizeObserver = new ResizeObserver(() => invalidate())
  resizeObserver.observe(container)
  // The indicator's own style writes are attribute mutations it must not react to; framework
  // patches of the content are coalesced into one sync that still runs before paint.
  const mutationObserver = new MutationObserver(() => {
    pending = true
    if (queued)
      return
    queued = true
    queueMicrotask(flush)
  })
  mutationObserver.observe(container, { subtree: true, childList: true, characterData: true })
  // Geometry measured while an ancestor was scaled (an enter zoom) is off, and nothing mutates when it ends.
  const stopMotionEnd = onAncestorMotionEnd(container, () => {
    if (current && sizeOf(container) !== measuredSize)
      invalidate()
  })

  const unsubscribe = store.subscribe(() => invalidate())

  indicator.style.opacity = '0'

  /** Reads the target and the container box. Runs before paint, on the same frame as the content. */
  function invalidate() {
    if (destroyed || frozen)
      return
    needsSync = true
    if (raf)
      cancelAnimationFrame(raf)
    else
      last = 0
    raf = 0
    frame()
  }

  function flush() {
    if (pending) {
      pending = false
      return queueMicrotask(flush)
    }
    queued = false
    invalidate()
  }

  function measureInto(item: HTMLElement, out: Float64Array): boolean {
    if (!hasLayoutBox(item))
      return false
    const rect = measureItemRect(item, container)
    if (!rect)
      return false
    out[0] = rect.left
    out[1] = rect.top
    out[2] = rect.width
    out[3] = rect.height
    return true
  }

  function sync() {
    needsSync = false
    measuredSize = sizeOf(container)
    const item = options.target
      ? container.querySelector<HTMLElement>(options.target)
      : store.highlighted
    const origin = options.from ? container.querySelector<HTMLElement>(options.from) : null
    const previous = current
    const changed = item !== current
    const snap = changed && !options.target && store.snap
    if (changed) {
      if (current)
        resizeObserver.unobserve(current)
      if (item)
        resizeObserver.observe(item)
      current = item
      store.snap = false
    }
    if (!item || !measureInto(item, target)) {
      // A detached target has nothing to fade over; clear it now so its old box cannot overflow a
      // shrinking list.
      if (changed && previous && !container.contains(previous))
        opacity = 0
      visible = false
      if (origin)
        measureInto(origin, target)
      return
    }
    if (snap && visible) {
      pos.set(target)
      vel.fill(0)
    }
    if (!visible) {
      // A new session fades in where it lands — or grows out of `from` — instead of sliding over
      // from wherever the last session ended.
      visible = true
      opacity = initial ? 1 : 0
      if (!(origin && !initial && measureInto(origin, pos)))
        pos.set(target)
      vel.fill(0)
    }
  }

  function frame() {
    if (destroyed || frozen)
      return
    raf = 0
    if (needsSync)
      sync()
    initial = false
    const now = performance.now()
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60
    last = now
    opacity = visible ? Math.min(1, opacity + dt / FADE_IN) : Math.max(0, opacity - dt / FADE_OUT)
    const settled = reducedMotion()
      ? (pos.set(target), vel.fill(0), true)
      : stepSpring(pos, vel, target, duration, dt)
    write()
    if (!visible && opacity === 0) {
      // Opacity alone does not remove an absolutely positioned box from scrollable overflow.
      pos.fill(0)
      vel.fill(0)
      target.fill(0)
      last = 0
      indicator.style.transform = 'translate3d(0, 0, 0)'
      indicator.style.width = '0px'
      indicator.style.height = '0px'
      writtenSize = '0 0'
      return
    }
    if (!settled || opacity !== (visible ? 1 : 0))
      raf = requestAnimationFrame(frame)
  }

  function write() {
    indicator.style.opacity = String(opacity)
    indicator.style.transform = `translate3d(${pos[0]}px, ${pos[1]}px, 0)`
    const size = `${pos[2]} ${pos[3]}`
    if (size !== writtenSize) {
      writtenSize = size
      indicator.style.width = `${pos[2]}px`
      indicator.style.height = `${pos[3]}px`
    }
  }

  return {
    remeasure: invalidate,
    freeze() {
      if (destroyed || frozen)
        return
      frozen = true
      const computed = getComputedStyle(indicator)
      for (const [property] of originalStyles) {
        const paint = computed.getPropertyValue(property) || indicator.style.getPropertyValue(property)
        if (paint)
          indicator.style.setProperty(property, paint)
      }
      cancelAnimationFrame(raf)
      raf = 0
      stopMotionEnd()
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      unsubscribe()
    },
    destroy() {
      if (destroyed)
        return
      destroyed = true
      frozen = true
      cancelAnimationFrame(raf)
      raf = 0
      stopMotionEnd()
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      unsubscribe()
      for (const [property, value, priority] of originalStyles) {
        if (value)
          indicator.style.setProperty(property, value, priority)
        else
          indicator.style.removeProperty(property)
      }
    },
  }
}
