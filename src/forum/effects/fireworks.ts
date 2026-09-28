import type { FestivalConfetti } from './canvasConfettiRuntime'
import type { ForumFestivalEffectOptions } from './types'
import { startCanvasFestival } from './canvasConfettiRuntime'

interface ActiveRocket {
  colors: string[]
  fromLeft: boolean
  lastTrailAt: number
  startedAt: number
  targetX: number
  targetY: number
}

const DEFAULT_PALETTE = ['#38bdf8', '#f8fafc', '#facc15', '#fb7185']
const ROCKET_FLIGHT_MS = 620

function explodeNewYear(
  fire: FestivalConfetti,
  rocket: ActiveRocket,
): void {
  const origin = { x: rocket.targetX, y: rocket.targetY }
  void fire({
    particleCount: 96,
    angle: 90,
    spread: 360,
    startVelocity: 42 + Math.random() * 10,
    decay: 0.93,
    gravity: 0.78,
    ticks: 135,
    origin,
    colors: rocket.colors,
    shapes: ['circle', 'star'],
    scalar: 0.9 + Math.random() * 0.25,
    zIndex: 79,
    disableForReducedMotion: true,
  })
  void fire({
    particleCount: 28,
    angle: 90,
    spread: 360,
    startVelocity: 26 + Math.random() * 8,
    decay: 0.94,
    gravity: 0.55,
    ticks: 155,
    origin,
    colors: ['#ffffff', '#fff7cc', ...rocket.colors],
    shapes: ['star'],
    scalar: 0.58,
    zIndex: 79,
    disableForReducedMotion: true,
  })
}

function explodeSpringFestival(
  fire: FestivalConfetti,
  rocket: ActiveRocket,
): void {
  const origin = { x: rocket.targetX, y: rocket.targetY }
  void fire({
    particleCount: 118,
    angle: 90,
    spread: 360,
    startVelocity: 44 + Math.random() * 8,
    decay: 0.934,
    gravity: 0.7,
    ticks: 145,
    origin,
    colors: rocket.colors,
    shapes: ['circle'],
    scalar: 0.88 + Math.random() * 0.18,
    zIndex: 79,
    disableForReducedMotion: true,
  })
  void fire({
    particleCount: 58,
    angle: 90,
    spread: 360,
    startVelocity: 27 + Math.random() * 7,
    decay: 0.955,
    gravity: 0.92,
    ticks: 185,
    origin,
    colors: ['#fff1a8', '#ffd54f', '#ffb300'],
    shapes: ['circle'],
    scalar: 0.68,
    zIndex: 79,
    disableForReducedMotion: true,
  })
  void fire({
    particleCount: 24,
    angle: 90,
    spread: 360,
    startVelocity: 20 + Math.random() * 6,
    decay: 0.94,
    gravity: 0.45,
    ticks: 125,
    origin,
    colors: ['#fff7cc', '#ffd54f', ...rocket.colors],
    shapes: ['star'],
    scalar: 0.58,
    zIndex: 79,
    disableForReducedMotion: true,
  })
}

function emitRocketTrail(
  fire: FestivalConfetti,
  rocket: ActiveRocket,
  origin: { x: number, y: number },
  springFestival: boolean,
): void {
  void fire({
    particleCount: springFestival ? 7 : 5,
    angle: 270,
    spread: springFestival ? 34 : 42,
    startVelocity: springFestival ? 4.2 : 3.5,
    decay: 0.91,
    gravity: springFestival ? 0.75 : 0.65,
    ticks: springFestival ? 42 : 36,
    origin,
    colors: springFestival
      ? ['#fff1a8', '#ffd54f', '#ffb300']
      : ['#f59e0b', '#facc15', ...rocket.colors],
    shapes: ['circle'],
    scalar: springFestival ? 0.72 : 0.78 + Math.random() * 0.22,
    zIndex: 79,
    disableForReducedMotion: true,
  })
  void fire({
    particleCount: 1,
    angle: 90,
    spread: 0,
    startVelocity: 0,
    decay: 1,
    gravity: 0,
    ticks: 10,
    origin,
    colors: [springFestival ? '#ffd54f' : '#ffffff'],
    shapes: ['circle'],
    scalar: 1.25,
    zIndex: 79,
    disableForReducedMotion: true,
  })
}

export function startFestivalEffect(options: ForumFestivalEffectOptions) {
  const colors = [...(options.palette ?? DEFAULT_PALETTE)]
  const springFestival = options.fireworkStyle === 'spring-festival'
  const launchIntervalMs = springFestival ? 520 : 620
  const activeRockets: ActiveRocket[] = []
  let lastLaunchAt = Number.NEGATIVE_INFINITY
  let launchFromLeft = Math.random() >= 0.5

  return startCanvasFestival(options.durationMs, ({ elapsedMs, remainingMs, fire }) => {
    for (let index = activeRockets.length - 1; index >= 0; index -= 1) {
      const rocket = activeRockets[index]
      if (!rocket)
        continue

      const progress = Math.min(1, (elapsedMs - rocket.startedAt) / ROCKET_FLIGHT_MS)
      const easedProgress = 1 - (1 - progress) ** 2
      const startX = rocket.fromLeft ? 0.025 : 0.975
      const x = startX + (rocket.targetX - startX) * easedProgress
      const y = 1.02 + (rocket.targetY - 1.02) * easedProgress

      if (progress < 1 && elapsedMs - rocket.lastTrailAt >= 34) {
        rocket.lastTrailAt = elapsedMs
        emitRocketTrail(fire, rocket, { x, y }, springFestival)
      }

      if (progress >= 1) {
        if (springFestival)
          explodeSpringFestival(fire, rocket)
        else
          explodeNewYear(fire, rocket)
        activeRockets.splice(index, 1)
      }
    }

    if (remainingMs < 1_800 || elapsedMs - lastLaunchAt < launchIntervalMs)
      return

    lastLaunchAt = elapsedMs
    launchFromLeft = !launchFromLeft
    const launchSides = Math.random() > (springFestival ? 0.45 : 0.6)
      ? [launchFromLeft, !launchFromLeft]
      : [launchFromLeft]

    for (const fromLeft of launchSides) {
      const targetX = fromLeft
        ? 0.16 + Math.random() * 0.3
        : 0.54 + Math.random() * 0.3
      const targetY = 0.1 + Math.random() * 0.32
      const launchColors = colors.toSorted(() => Math.random() - 0.5).slice(0, 3)

      activeRockets.push({
        colors: launchColors,
        fromLeft,
        lastTrailAt: Number.NEGATIVE_INFINITY,
        startedAt: elapsedMs,
        targetX,
        targetY,
      })
    }
  })
}
