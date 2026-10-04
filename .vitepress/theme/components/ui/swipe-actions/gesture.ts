import type { SwipeSide } from './types'

export const ACTION_WIDTH = 76
export const SWIPE_SLOP = 8
export const FLICK_VELOCITY = 900

export function swipeSide(value: number): SwipeSide | null {
  return value > 0 ? 'leading' : value < 0 ? 'trailing' : null
}

export function fullSwipeThreshold(openWidth: number, width: number): number {
  return Math.max(openWidth + 48, width * 0.56)
}

export function constrainSwipe(raw: number, count: number, width: number, fullSwipe: boolean): number {
  const dimension = Math.max(1, width)
  const limit = count === 0 ? 0 : fullSwipe ? dimension : Math.min(count * ACTION_WIDTH, dimension)
  const distance = Math.abs(raw)
  const overshoot = Math.max(0, distance - limit)
  const elastic = (1 - 1 / (overshoot * 0.55 / dimension + 1)) * dimension
  return Math.sign(raw) * (Math.min(distance, limit) + elastic)
}

export function swipeVelocity(samples: readonly (readonly [number, number])[]): number {
  const last = samples.at(-1)
  if (!last)
    return 0
  const first = samples.find(sample => last[0] - sample[0] <= 80) ?? last
  const elapsed = (last[0] - first[0]) / 1000
  return elapsed > 0 ? (last[1] - first[1]) / elapsed : 0
}

export function resolveSwipeRelease(input: {
  value: number
  velocity: number
  count: number
  width: number
  fullSwipe: boolean
  armed: boolean
  cancelled?: boolean
}): { commit: boolean, target: number } {
  const { value, velocity, count, width, fullSwipe, armed, cancelled } = input
  if (cancelled || !count || !value)
    return { commit: false, target: 0 }
  const direction = Math.sign(value)
  const distance = Math.abs(value)
  const outward = velocity * direction
  const open = Math.min(count * ACTION_WIDTH, width)
  const projected = distance + outward * 0.1
  const flung = distance > open && outward > FLICK_VELOCITY
    && projected > fullSwipeThreshold(open, width)
  return {
    commit: fullSwipe && ((armed && outward > -FLICK_VELOCITY) || flung),
    target: projected > open / 2 ? direction * open : 0,
  }
}
