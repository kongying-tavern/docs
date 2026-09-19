/**
 * Advances a critically damped spring by `dt` seconds on every channel, solved in closed form so it
 * is exact at any frame time and keeps its velocity when the target changes mid-flight (retarget
 * continuity). Matches framer-motion's `{ type: 'spring', duration, bounce: 0 }` envelope: the
 * critically damped decay `e^-x(1 + x)` reaches 0.001 at x = 9.23. Returns whether it settled.
 */
export function stepSpring(
  pos: Float64Array,
  vel: Float64Array,
  target: Float64Array,
  duration: number,
  dt: number,
): boolean {
  const omega = 9.23 / duration
  const decay = Math.exp(-omega * dt)
  let settled = true
  for (let i = 0; i < pos.length; i++) {
    const offset = pos[i]! - target[i]!
    const b = vel[i]! + omega * offset
    const nextOffset = (offset + b * dt) * decay
    const nextVelocity = (vel[i]! - omega * b * dt) * decay
    pos[i] = target[i]! + nextOffset
    vel[i] = nextVelocity
    if (Math.abs(nextOffset) > 0.1 || Math.abs(nextVelocity) > 2)
      settled = false
  }
  if (settled) {
    pos.set(target)
    vel.fill(0)
  }
  return settled
}
