import type { MaybeRefOrGetter } from 'vue'
import { useEventListener, useMediaQuery } from '@vueuse/core'
import { ref, toValue } from 'vue'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/services/forum/forumConfig'

// 用 touch 而非 pointer：滚动手势接管后 pointer 会中途取消；页面级滚动由浏览器原生处理
export function useBounceScroll(
  el: MaybeRefOrGetter<HTMLElement | null>,
  options: { axis: 'x' | 'y', damping?: number, resetMs?: number },
) {
  const { axis, damping = 0.5, resetMs = 360 } = options
  const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
  const offset = ref(0)

  let dragging = false
  let atEdge = 0
  let startPos = 0
  let releaseTimer: ReturnType<typeof setTimeout> | null = null
  let cleanupTimer: ReturnType<typeof setTimeout> | null = null

  const node = () => toValue(el)

  function edgeOf(target: HTMLElement): -1 | 0 | 1 {
    const scroll = axis === 'x' ? target.scrollLeft : target.scrollTop
    const max = axis === 'x'
      ? target.scrollWidth - target.clientWidth
      : target.scrollHeight - target.clientHeight
    if (scroll <= 0)
      return -1
    if (scroll >= max - 1)
      return 1
    return 0
  }

  function applyOffset(target: HTMLElement, value: number): void {
    target.style.transform = value
      ? `translate${axis === 'x' ? 'X' : 'Y'}(${value}px)`
      : ''
  }

  function onTouchStart(event: TouchEvent): void {
    if (!isMobile.value)
      return
    const target = node()
    const touch = event.touches[0]
    if (!target || !touch)
      return
    if (releaseTimer) {
      clearTimeout(releaseTimer)
      releaseTimer = null
    }
    dragging = true
    startPos = axis === 'x' ? touch.clientX : touch.clientY
    offset.value = 0
    target.style.overscrollBehavior = 'none'
  }

  function onTouchMove(event: TouchEvent): void {
    if (!dragging)
      return
    const target = node()
    const touch = event.touches[0]
    if (!target || !touch)
      return
    atEdge = edgeOf(target)
    const pos = axis === 'x' ? touch.clientX : touch.clientY
    const delta = pos - startPos
    const outward = (atEdge === 1 && delta > 0) || (atEdge === -1 && delta < 0)
    if (!outward) {
      reset()
      return
    }
    offset.value = delta * damping
    applyOffset(target, offset.value)
  }

  function onTouchEnd(): void {
    if (!dragging)
      return
    dragging = false
    const target = node()
    if (!target)
      return
    if (offset.value) {
      // back-out 曲线，回位时过冲一瞬更弹
      target.style.transition = `transform ${resetMs}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
      releaseTimer = setTimeout(() => {
        applyOffset(target, 0)
        releaseTimer = null
      }, 16)
      if (cleanupTimer)
        clearTimeout(cleanupTimer)
      cleanupTimer = setTimeout(() => {
        target.style.transition = ''
        target.style.overscrollBehavior = ''
        offset.value = 0
      }, resetMs + 24)
    }
    else {
      target.style.overscrollBehavior = ''
    }
  }

  function reset(): void {
    const target = node()
    if (!target || target.style.transition)
      return
    applyOffset(target, 0)
    offset.value = 0
  }

  useEventListener(el, 'touchstart', onTouchStart, { passive: true })
  useEventListener(el, 'touchmove', onTouchMove, { passive: true })
  useEventListener(el, 'touchend', onTouchEnd)
  useEventListener(el, 'touchcancel', onTouchEnd)

  return { offset }
}
