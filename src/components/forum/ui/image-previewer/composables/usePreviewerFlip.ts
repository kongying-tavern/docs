import type { Ref } from 'vue'
import { computed, nextTick, onScopeDispose, shallowRef } from 'vue'

const BASE_EXIT_MS = 320
const SOURCE_FLIP_EXIT_MS = 400

function zoomFlipTransform(from: DOMRect, to: DOMRect): { scale: number, dx: number, dy: number } {
  const scale = from.width / to.width
  const dx = (from.left + from.width / 2) - (to.left + to.width / 2)
  const dy = (from.top + from.height / 2) - (to.top + to.height / 2)
  return { scale, dx, dy }
}

export function stackTransform(dx: number, dy: number, scale: number): string {
  return `translate(${dx}px, ${dy}px) scale(${scale})`
}

export function usePreviewerFlip(
  imageEl: Ref<HTMLImageElement | undefined>,
  stackEl: Ref<HTMLDivElement | undefined>,
) {
  const sourceRect = shallowRef<DOMRect | null>(null)
  const flipping = shallowRef(false)
  const aborted = shallowRef(false)
  const usesSourceTransition = computed(() => Boolean(sourceRect.value) && !aborted.value)
  const timers = new Set<number>()

  function schedule(task: () => void, delay: number): number {
    const timer = window.setTimeout(() => {
      timers.delete(timer)
      task()
    }, delay)
    timers.add(timer)
    return timer
  }

  function setSource(sourceEl?: Element | null): void {
    sourceRect.value = sourceEl?.getBoundingClientRect() ?? null
    aborted.value = false
  }

  function beginEnter(): void {
    if (!sourceRect.value)
      return
    nextTick(() => {
      const image = imageEl.value
      const stack = stackEl.value
      if (!image || !stack)
        return
      let started = false
      const run = () => {
        if (started)
          return
        const destination = image.getBoundingClientRect()
        const source = sourceRect.value
        if (!source || destination.width === 0 || source.width === 0)
          return
        started = true
        flipping.value = true
        const { dx, dy, scale } = zoomFlipTransform(source, destination)
        stack.style.transform = stackTransform(dx, dy, scale)
        void stack.offsetHeight
        schedule(() => schedule(() => {
          stack.style.transform = stackTransform(0, 0, 1)
        }, 24), 24)
        schedule(() => {
          flipping.value = false
        }, 380)
      }
      if (image.complete && image.naturalWidth > 0) {
        requestAnimationFrame(run)
      }
      else {
        image.addEventListener('load', () => requestAnimationFrame(run), { once: true })
        schedule(() => {
          if (!started) {
            started = true
            aborted.value = true
          }
        }, 800)
      }
    })
  }

  function beginExit(): number {
    const source = sourceRect.value
    const image = imageEl.value
    const stack = stackEl.value
    if (!source || !image || !stack)
      return BASE_EXIT_MS

    const current = image.getBoundingClientRect()
    const { dx, dy, scale } = zoomFlipTransform(source, current)
    schedule(() => {
      flipping.value = true
      schedule(() => {
        stack.style.transform = stackTransform(dx, dy, scale)
      }, 16)
    }, 16)
    return SOURCE_FLIP_EXIT_MS
  }

  function clearSource(): void {
    sourceRect.value = null
    aborted.value = false
  }

  onScopeDispose(() => {
    timers.forEach(clearTimeout)
    timers.clear()
  })

  return {
    flipping,
    usesSourceTransition,
    setSource,
    beginEnter,
    beginExit,
    clearSource,
  }
}
