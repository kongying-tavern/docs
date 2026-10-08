import type { Ref } from 'vue'
import { computed, nextTick, onScopeDispose, shallowRef } from 'vue'

const ENTER_MS = 420
const EXIT_MS = 320
const EASING = 'cubic-bezier(0.2, 0, 0.2, 1)'

function zoomFlipTransform(from: DOMRect, to: DOMRect): { scale: number, dx: number, dy: number } {
  const scale = from.width / to.width
  const dx = (from.left + from.width / 2) - (to.left + to.width / 2)
  const dy = (from.top + from.height / 2) - (to.top + to.height / 2)
  return { scale, dx, dy }
}

export function stackTransform(dx: number, dy: number, scale: number, rotate = 0): string {
  if (rotate === 0)
    return `translate(${dx}px, ${dy}px) scale(${scale})`
  return `translate(${dx}px, ${dy}px) rotate(${rotate}deg) scale(${scale})`
}

export function usePreviewerFlip(
  imageEl: Readonly<Ref<HTMLImageElement | null | undefined>>,
  stackEl: Readonly<Ref<HTMLDivElement | null | undefined>>,
  reducedMotion: Readonly<Ref<boolean>>,
) {
  const sourceRect = shallowRef<DOMRect | null>(null)
  const flipping = shallowRef(false)
  const entering = shallowRef(false)
  const aborted = shallowRef(false)
  const usesSourceTransition = computed(() => Boolean(sourceRect.value) && !aborted.value)
  let animation: Animation | undefined
  let cleanupLoad: (() => void) | undefined
  let generation = 0

  function cancel(): void {
    generation += 1
    cleanupLoad?.()
    cleanupLoad = undefined
    animation?.cancel()
    animation = undefined
    entering.value = false
    flipping.value = false
  }

  function setSource(sourceEl?: Element | null): void {
    cancel()
    const rect = sourceEl?.getBoundingClientRect()
    sourceRect.value = rect && rect.width > 0 && rect.height > 0 ? rect : null
    aborted.value = false
    entering.value = Boolean(sourceRect.value)
  }

  function beginEnter(): void {
    if (!sourceRect.value)
      return
    const session = generation
    void nextTick(() => {
      if (session !== generation)
        return
      const image = imageEl.value
      const stack = stackEl.value
      if (!image || !stack) {
        entering.value = false
        aborted.value = true
        return
      }
      const fallback = () => {
        cleanupLoad?.()
        cleanupLoad = undefined
        entering.value = false
        aborted.value = true
      }
      const run = () => {
        if (session !== generation)
          return
        cleanupLoad?.()
        cleanupLoad = undefined
        const destination = image.getBoundingClientRect()
        const source = sourceRect.value
        if (!source || destination.width === 0 || image.naturalWidth === 0) {
          fallback()
          return
        }
        if (reducedMotion.value) {
          entering.value = false
          return
        }
        const { dx, dy, scale } = zoomFlipTransform(source, destination)
        flipping.value = true
        animation = stack.animate([
          { transform: stackTransform(dx, dy, scale) },
          { transform: stackTransform(0, 0, 1) },
        ], { duration: ENTER_MS, easing: EASING })
        animation.onfinish = () => {
          animation = undefined
          entering.value = false
          flipping.value = false
        }
      }
      if (image.complete) {
        run()
      }
      else {
        const timer = window.setTimeout(fallback, 800)
        image.addEventListener('load', run, { once: true })
        image.addEventListener('error', fallback, { once: true })
        cleanupLoad = () => {
          clearTimeout(timer)
          image.removeEventListener('load', run)
          image.removeEventListener('error', fallback)
        }
      }
    })
  }

  function beginExit(): number {
    const source = sourceRect.value
    const image = imageEl.value
    const stack = stackEl.value
    // 先读取动画当前帧，再取消入场，关闭时才能连续接上。
    const from = stack ? getComputedStyle(stack).transform : 'none'
    cancel()
    if (reducedMotion.value)
      return 0
    if (!source || !image || !stack || aborted.value || image.naturalWidth === 0)
      return EXIT_MS

    const destination = image.getBoundingClientRect()
    if (destination.width === 0)
      return EXIT_MS
    const matrix = new DOMMatrix(getComputedStyle(stack).transform)
    const { dx, dy } = zoomFlipTransform(source, destination)
    flipping.value = true
    animation = stack.animate([
      { transform: from },
      { transform: stackTransform(dx + matrix.m41, dy + matrix.m42, source.width / image.offsetWidth) },
    ], { duration: EXIT_MS, easing: EASING, fill: 'forwards' })
    return EXIT_MS
  }

  function clearSource(): void {
    cancel()
    sourceRect.value = null
    aborted.value = false
  }

  onScopeDispose(cancel)

  return {
    flipping,
    entering,
    usesSourceTransition,
    setSource,
    beginEnter,
    beginExit,
    clearSource,
  }
}
