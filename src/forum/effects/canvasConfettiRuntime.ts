import type {
  ForumFestivalEffectController,
  ForumFestivalEffectStopOptions,
} from './types'
import confetti from 'canvas-confetti'
import { readReducedMotion } from '~/services/sitePreferences'

export type FestivalConfetti = ReturnType<typeof confetti.create>

export interface FestivalAnimationFrame {
  elapsedMs: number
  remainingMs: number
  fire: FestivalConfetti
}

export function startCanvasFestival(
  durationMs: number,
  renderFrame: (frame: FestivalAnimationFrame) => void,
): ForumFestivalEffectController {
  if (typeof document === 'undefined' || readReducedMotion()) {
    return {
      finished: Promise.resolve(),
      stop: () => {},
    }
  }

  const canvas = document.createElement('canvas')
  canvas.dataset.forumFestivalEffect = 'true'
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100dvh',
    pointerEvents: 'none',
    zIndex: '79',
  })
  document.body.append(canvas)

  const fire = confetti.create(canvas, {
    resize: true,
    useWorker: true,
    disableForReducedMotion: true,
  })
  const startedAt = performance.now()
  const pendingEmissions = new Set<Promise<unknown>>()
  let animationFrame = 0
  let fadeOutTimer = 0
  let hardStopTimer = 0
  let fadingOut = false
  let stopped = false
  let settling = false
  let resolveFinished = () => {}
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve
  })

  function finalize(resetParticles = true): void {
    if (stopped)
      return

    stopped = true
    cancelAnimationFrame(animationFrame)
    clearTimeout(fadeOutTimer)
    clearTimeout(hardStopTimer)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if (resetParticles)
      fire.reset()
    canvas.remove()
    resolveFinished()
  }

  function stop(options: ForumFestivalEffectStopOptions = {}): void {
    if (stopped || fadingOut)
      return

    if (!options.fadeOut) {
      finalize()
      return
    }

    fadingOut = true
    canvas.style.transition = 'opacity 250ms ease-out'
    requestAnimationFrame(() => canvas.style.opacity = '0')
    fadeOutTimer = window.setTimeout(finalize, 260)
  }

  function emit(options: Parameters<FestivalConfetti>[0]): ReturnType<FestivalConfetti> {
    const completion = fire(options)
    if (completion) {
      const tracked = Promise.resolve(completion)
      pendingEmissions.add(tracked)
      void tracked.finally(() => pendingEmissions.delete(tracked))
    }
    return completion
  }

  function finishNaturally(): void {
    if (settling || stopped || fadingOut)
      return

    settling = true
    cancelAnimationFrame(animationFrame)
    void Promise.allSettled([...pendingEmissions]).then(() => finalize(false))
  }

  function handleVisibilityChange(): void {
    if (document.hidden)
      stop()
  }

  function frame(now: number): void {
    if (stopped)
      return

    const elapsedMs = now - startedAt
    if (elapsedMs >= durationMs) {
      finishNaturally()
      return
    }

    try {
      renderFrame({
        elapsedMs,
        remainingMs: durationMs - elapsedMs,
        fire: emit as FestivalConfetti,
      })
    }
    catch {
      stop()
      return
    }
    animationFrame = requestAnimationFrame(frame)
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  animationFrame = requestAnimationFrame(frame)
  // A malformed effect must not leave an overlay behind indefinitely. Normal
  // completion waits for canvas-confetti's own particle promises instead.
  hardStopTimer = window.setTimeout(finalize, durationMs + 8_000)

  return { finished, stop }
}
