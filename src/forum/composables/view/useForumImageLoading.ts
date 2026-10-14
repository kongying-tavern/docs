import type { Ref } from 'vue'
import { computed, onActivated, onDeactivated, ref, watch } from 'vue'
import { createForumImageScheduler } from '~/forum/services/forumImageScheduler'

type VisibilityListener = (rect: DOMRectReadOnly) => void
const targets = new Map<Element, VisibilityListener>()
const scheduler = createForumImageScheduler()
let observer: IntersectionObserver | undefined
let frame = 0

function refresh() {
  if (frame)
    return
  frame = requestAnimationFrame(() => {
    frame = 0
    // Read every rect before callbacks can change the DOM.
    const positions = [...targets].map(([element, listener]) => [listener, element.getBoundingClientRect()] as const)
    for (const [listener, rect] of positions)
      listener(rect)
  })
}

function observe(target: Element, listener: VisibilityListener): () => void {
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries)
        targets.get(entry.target)?.(entry.boundingClientRect)
    }, { rootMargin: '200px' })
    window.addEventListener('scroll', refresh, { passive: true, capture: true })
    window.addEventListener('resize', refresh, { passive: true })
  }
  targets.set(target, listener)
  observer.observe(target)
  return () => {
    targets.delete(target)
    observer?.unobserve(target)
    if (!targets.size) {
      observer?.disconnect()
      observer = undefined
      window.removeEventListener('scroll', refresh, true)
      window.removeEventListener('resize', refresh)
      cancelAnimationFrame(frame)
      frame = 0
    }
  }
}

/** Only mounted rows participate; decoding completion releases the queue slot. */
export function useForumImageLoading(target: Ref<HTMLElement | null>, source: () => string) {
  const active = ref(true)
  const visible = ref(false)
  const permitted = ref(false)
  const admittedSource = ref('')
  const allowed = computed(() => permitted.value && admittedSource.value === source())
  let complete = () => {}
  watch([target, active, source], ([element, enabled, url], _previous, onCleanup) => {
    permitted.value = visible.value = false
    complete = () => {}
    if (!element || !enabled)
      return
    const job = scheduler.register(() => {
      admittedSource.value = url
      permitted.value = true
    }, () => permitted.value = false)
    complete = job.complete
    const stop = observe(element, (rect) => {
      visible.value = rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth
      job.update(visible.value ? 0 : rect.top >= innerHeight ? 1 : 2, Math.max(0, rect.top - innerHeight, -rect.bottom))
    })
    onCleanup(() => {
      stop()
      job.remove()
    })
  }, { flush: 'post' })
  onActivated(() => active.value = true)
  onDeactivated(() => active.value = false)
  return { visible, allowed, complete: () => complete() }
}
