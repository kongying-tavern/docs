import type { ItemRect, PickNearestInput } from '../../../.vitepress/theme/hooks/fluid-hover/geometry'
import assert from 'node:assert/strict'
import { test } from 'vitest'
import { pickNearest } from '../../../.vitepress/theme/hooks/fluid-hover/geometry'
import { stepSpring } from '../../../.vitepress/theme/hooks/fluid-hover/spring'

function rects(list: Array<{ left: number, top: number, width?: number, height?: number }>): (ItemRect | undefined)[] {
  return list.map(({ left, top, width = 100, height = 40 }) => ({ left, top, width, height }))
}

function input(overrides: Partial<PickNearestInput> = {}): PickNearestInput {
  return {
    axis: 'y',
    point: { x: 50, y: 0 },
    rects: [],
    containerRect: { left: 0, top: 0, width: 400, height: 300 },
    scroll: { x: 0, y: 0 },
    border: { x: 0, y: 0 },
    layoutSize: { width: 400, height: 300 },
    ...overrides,
  }
}

test('pickNearest: the item the pointer is inside always wins on the y axis', () => {
  const rectsY = rects([{ left: 0, top: 0 }, { left: 0, top: 60 }])
  assert.equal(pickNearest(input({ rects: rectsY, point: { x: 50, y: 20 } })), 0)
  assert.equal(pickNearest(input({ rects: rectsY, point: { x: 50, y: 80 } })), 1)
  // The x coordinate must not matter on the y axis.
  assert.equal(pickNearest(input({ rects: rectsY, point: { x: 9999, y: 20 } })), 0)
})

test('pickNearest: a pointer in a gap picks the nearest center, ties keep the first', () => {
  const rectsY = rects([{ left: 0, top: 0 }, { left: 0, top: 60 }])
  // y=50: |50-20| = |50-80| -> tie -> first item.
  assert.equal(pickNearest(input({ rects: rectsY, point: { x: 50, y: 50 } })), 0)
  // y=55 is 35 from item 0 and 25 from item 1.
  assert.equal(pickNearest(input({ rects: rectsY, point: { x: 50, y: 55 } })), 1)
  // Past the last row still lands on the nearest item.
  assert.equal(pickNearest(input({ rects: rectsY, point: { x: 50, y: 200 } })), 1)
})

test('pickNearest: the x axis mirrors the y axis', () => {
  const rectsX = rects([{ left: 0, top: 0 }, { left: 120, top: 0 }])
  assert.equal(pickNearest(input({ axis: 'x', rects: rectsX, point: { x: 60, y: 9999 } })), 0)
  assert.equal(pickNearest(input({ axis: 'x', rects: rectsX, point: { x: 111, y: 9999 } })), 1)
  assert.equal(pickNearest(input({ axis: 'x', rects: rectsX, point: { x: 110, y: 9999 } })), 0)
})

test('pickNearest: the xy axis measures squared distance to each center', () => {
  const grid = rects([
    { left: 0, top: 0, width: 100, height: 100 },
    { left: 120, top: 0, width: 100, height: 100 },
    { left: 0, top: 120, width: 100, height: 100 },
    { left: 120, top: 120, width: 100, height: 100 },
  ])
  assert.equal(pickNearest(input({ axis: 'xy', rects: grid, point: { x: 60, y: 60 } })), 0)
  // Dead center of the grid: all four centers tie, the first keeps it.
  assert.equal(pickNearest(input({ axis: 'xy', rects: grid, point: { x: 110, y: 110 } })), 0)
  // Near the top-right card's center, not the top-left's.
  assert.equal(pickNearest(input({ axis: 'xy', rects: grid, point: { x: 200, y: 55 } })), 1)
})

test('pickNearest: disabled items never win, even when the pointer is inside them', () => {
  const rectsY = rects([{ left: 0, top: 0 }, { left: 0, top: 60 }])
  assert.equal(
    pickNearest(input({ rects: rectsY, point: { x: 50, y: 30 }, isDisabled: index => index === 0 })),
    1,
  )
  assert.equal(
    pickNearest(input({ rects: rectsY, point: { x: 50, y: 30 }, isDisabled: () => true })),
    null,
  )
})

test('pickNearest: unmeasured slots are skipped', () => {
  const sparse: (ItemRect | undefined)[] = [rects([{ left: 0, top: 0 }])[0], undefined, rects([{ left: 0, top: 120 }])[0]]
  assert.equal(pickNearest(input({ rects: sparse, point: { x: 50, y: 150 } })), 2)
  assert.equal(pickNearest(input({ rects: sparse, point: { x: 50, y: 60 } })), 0)
})

test('pickNearest: a cumulative ancestor scale factors out per axis', () => {
  // The container renders at half scale: layout 400 wide, viewport 200 wide.
  const scaled = input({
    axis: 'x',
    rects: rects([{ left: 200, top: 0 }, { left: 400, top: 0 }]),
    containerRect: { left: 0, top: 0, width: 200, height: 300 },
    layoutSize: { width: 400, height: 300 },
  })
  // Layout 200..300 becomes viewport 100..150, center 125; layout 400..500 becomes 200..250, center 225.
  assert.equal(pickNearest({ ...scaled, point: { x: 120, y: 0 } }), 0)
  assert.equal(pickNearest({ ...scaled, point: { x: 210, y: 0 } }), 1)
  assert.equal(pickNearest({ ...scaled, point: { x: 170, y: 0 } }), 0)
  assert.equal(pickNearest({ ...scaled, point: { x: 180, y: 0 } }), 1)
})

test('pickNearest: scroll and border offsets map layout into the viewport', () => {
  const scrolled = input({
    rects: rects([{ left: 0, top: 40 }]),
    scroll: { x: 0, y: 40 },
    border: { x: 0, y: 2 },
  })
  // Layout top 40 becomes viewport 2..42.
  assert.equal(pickNearest({ ...scrolled, point: { x: 50, y: 10 } }), 0)
  assert.equal(pickNearest({ ...scrolled, point: { x: 50, y: 41 } }), 0)
})

test('pickNearest: fully scrolled-out items are skipped, mostly-clipped ones lose to visible ones', () => {
  const view = { x: 0, y: 0, width: 400, height: 100 }
  // In a gap with only a mostly-clipped item (5 of 40px visible) left, it still wins.
  const clipped = input({ view, rects: rects([{ left: 0, top: 95 }, { left: 0, top: 140 }]), point: { x: 50, y: 60 } })
  assert.equal(pickNearest(clipped), 0)
  // A fully visible item farther from the pointer beats the mostly-clipped one.
  const visibleNear = input({ view, rects: rects([{ left: 0, top: 0 }, { left: 0, top: 95 }]), point: { x: 50, y: 140 } })
  assert.equal(pickNearest(visibleNear), 0)
})

test('pickNearest: nothing to pick yields null', () => {
  assert.equal(pickNearest(input()), null)
})

function spring(pos: number[], vel: number[], target: number[], duration = 0.08) {
  const p = Float64Array.from(pos)
  const v = Float64Array.from(vel)
  const t = Float64Array.from(target)
  return {
    pos: p,
    vel: v,
    target: t,
    step: (dt: number) => stepSpring(p, v, t, duration, dt),
  }
}

test('stepSpring: settles exactly on the target with zero velocity', () => {
  const s = spring([0, 0], [0, 0], [320, 80], 0.16)
  for (let i = 0; i < 600 && !s.step(1 / 60); i++);
  assert.equal(s.step(1 / 60), true)
  assert.deepEqual([...s.pos], [320, 80])
  assert.deepEqual([...s.vel], [0, 0])
})

test('stepSpring: the closed form is exact, one big step equals many small ones', () => {
  const big = spring([100, -40], [-50, 120], [0, 0], 0.16)
  big.step(0.5)
  const small = spring([100, -40], [-50, 120], [0, 0], 0.16)
  for (let i = 0; i < 50; i++)
    small.step(0.01)
  for (let i = 0; i < big.pos.length; i++) {
    assert.ok(Math.abs(big.pos[i]! - small.pos[i]!) < 1e-6)
    assert.ok(Math.abs(big.vel[i]! - small.vel[i]!) < 1e-6)
  }
})

test('stepSpring: a retarget keeps velocity instead of restarting from rest', () => {
  // Retargeting to the opposite side must not teleport: the position stays continuous.
  const bounced = spring([0], [0], [100], 0.24)
  for (let i = 0; i < 5; i++)
    bounced.step(1 / 60)
  const before = bounced.pos[0]!
  bounced.target[0] = 50
  bounced.step(1 / 60)
  assert.ok(Math.abs(bounced.pos[0]! - before) < 12)

  // The carried momentum still pushes upward: retargeting to a point above the current position
  // overshoots it, while a restart from rest approaches without ever crossing.
  const carried = spring([0], [0], [100], 0.24)
  for (let i = 0; i < 5; i++)
    carried.step(1 / 60)
  assert.ok(carried.vel[0]! > 0)
  carried.target[0] = 90
  const restarted = spring([carried.pos[0]!], [0], [90], 0.24)
  for (let i = 0; i < 4; i++) {
    carried.step(1 / 60)
    restarted.step(1 / 60)
  }
  assert.ok(carried.pos[0]! > 90)
  assert.ok(restarted.pos[0]! < 90)
})

test('stepSpring: a tiny remainder snaps to the target', () => {
  const s = spring([0.05], [0], [0], 0.08)
  assert.equal(s.step(1 / 60), true)
  assert.equal(s.pos[0], 0)
})

test('stepSpring: channels are independent', () => {
  const s = spring([0, 1000], [0, 0], [0, 0], 0.08)
  s.step(1 / 60)
  assert.equal(s.pos[0], 0)
  assert.ok(s.pos[1]! < 1000)
})
