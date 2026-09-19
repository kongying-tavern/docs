import { ACTIVE_ATTR, CONTAINER_SELECTOR, ITEM_SELECTOR, RESUME_DISTANCE } from './constants'
import { isEligibleItem } from './measure'

export type FluidHoverSource = 'pointer' | 'keyboard' | 'focus'

export interface FluidHoverStore {
  /** The highlighted item, with `data-fluid-hover-active` set on it. */
  readonly highlighted: HTMLElement | null
  /** What highlighted it. */
  readonly source: FluidHoverSource | null
  /** The next highlight change comes from content scrolling under a still pointer: indicators jump instead of gliding. */
  snap: boolean
  /** Increments when the pointer enters the container: a new indicator session. */
  session: number
  /** Calls `listener` after the highlight or the session changes. Returns unsubscribe. */
  subscribe: (listener: () => void) => () => void
  highlight: (item: HTMLElement | null, source: FluidHoverSource | null) => void
  beginSession: () => void
  /** The keyboard took over: the mouse must travel `resumeDistance` px before it picks again. */
  suspendPointer: () => void
  resumePointer: () => void
  pointerSuspended: () => boolean
  /** False for touch; while suspended, false until the pointer has moved `resumeDistance` px from where it was. */
  acceptsPointer: (event: { pointerType: string, clientX: number, clientY: number }, resumeDistance?: number) => boolean
}

const stores = new WeakMap<HTMLElement, FluidHoverStore>()

/** The highlight state shared by every fluid hover behavior on the same container. */
export function getFluidHoverStore(container: HTMLElement): FluidHoverStore {
  let store = stores.get(container)
  if (!store)
    stores.set(container, (store = createFluidHoverStore(container)))
  return store
}

export function createFluidHoverStore(container: HTMLElement): FluidHoverStore {
  let highlighted: HTMLElement | null = null
  let source: FluidHoverSource | null = null
  let suspended = false
  let origin: { x: number, y: number } | undefined
  let lastPointer: { x: number, y: number } | undefined
  let notified: [HTMLElement | null, FluidHoverSource | null, number] = [null, null, 0]
  const listeners = new Set<() => void>()

  const store: FluidHoverStore = {
    get highlighted() {
      return highlighted
    },
    get source() {
      return source
    },
    snap: false,
    session: 0,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    highlight(item, from) {
      const next = item && isEligibleItem(item) ? item : null
      if (next !== highlighted) {
        highlighted?.removeAttribute(ACTIVE_ATTR)
        next?.setAttribute(ACTIVE_ATTR, '')
        highlighted = next
      }
      source = next ? from : null
      notify()
    },
    beginSession() {
      store.session++
      notify()
    },
    suspendPointer() {
      suspended = true
      origin = lastPointer
    },
    resumePointer() {
      suspended = false
      origin = undefined
    },
    pointerSuspended: () => suspended,
    acceptsPointer(event, resumeDistance = RESUME_DISTANCE) {
      if (event.pointerType === 'touch')
        return false
      lastPointer = { x: event.clientX, y: event.clientY }
      if (suspended) {
        origin ??= lastPointer
        if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < resumeDistance)
          return false
        suspended = false
        origin = undefined
      }
      return true
    },
  }

  function notify() {
    if (notified[0] === highlighted && notified[1] === source && notified[2] === store.session)
      return
    notified = [highlighted, source, store.session]
    for (const listener of listeners)
      listener()
  }

  // Tabbing through the items highlights the focused one and pauses pointer picking, so a parked
  // mouse cannot steal the highlight back; the pointer resumes after moving `resumeDistance` px.
  const onFocusIn = (event: FocusEvent) => {
    const target = event.target as Element | null
    if (!target || target === container)
      return
    const item = target.closest(ITEM_SELECTOR)
    if (!item || !container.contains(item) || item.closest(CONTAINER_SELECTOR) !== container)
      return
    if (!isEligibleItem(item))
      return
    store.suspendPointer()
    store.highlight(item, 'focus')
  }
  const onFocusOut = (event: FocusEvent) => {
    if (store.source !== 'pointer' && !container.contains(event.relatedTarget as Node | null)) {
      store.highlight(null, null)
      store.resumePointer()
    }
  }
  container.addEventListener('focusin', onFocusIn)
  container.addEventListener('focusout', onFocusOut)

  return store
}
