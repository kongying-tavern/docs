import type { VirtualItem } from '@tanstack/vue-virtual'
import { describe, expect, test } from 'vitest'
import { forumTopicRenderDistance, forumTopicRenderIndexes } from '../../src/forum/services/forumTopicRenderBuffer'

const measurements: VirtualItem[] = Array.from({ length: 5000 }, (_, index) => ({ key: `topic-${index}`, index, start: index * 100, size: 100, end: (index + 1) * 100, lane: 0 }))
const range = { startIndex: 100, endIndex: 107, count: 5000, overscan: 0 }
const options = { offset: 10_000, viewport: 800, before: 400, after: 2400, retained: [], focusedIndex: -1 }

describe('topic render buffer', () => {
  test('predicts ahead distance from velocity and commit duration, with bounded pixel coverage', () => {
    expect(forumTopicRenderDistance(800, 0, 32)).toEqual({ before: 600, after: 600 })
    const slow = forumTopicRenderDistance(800, 4, 16)
    const expensive = forumTopicRenderDistance(800, 4, 160)
    expect(expensive.after).toBeGreaterThan(slow.after)
    expect(forumTopicRenderDistance(800, 1000, 160)).toEqual({ before: 400, after: 2400 })
    expect(forumTopicRenderDistance(800, -1000, 160)).toEqual({ before: 2400, after: 400 })
  })

  test('covers real pixel distances for unequal heights rather than a fixed row count', () => {
    const short = forumTopicRenderIndexes(range, measurements, options)
    const tall = measurements.map(row => ({ ...row, start: row.start * 3, size: row.size * 3, end: row.end * 3 }))
    const tallRange = { ...range, endIndex: 102 }
    const taller = forumTopicRenderIndexes(tallRange, tall, { ...options, offset: 30_000 })
    expect(short).toHaveLength(36)
    expect(taller.length).toBeLessThan(short.length)
    expect(tall[taller.at(-1)!].end).toBeGreaterThanOrEqual(33_200)
  })

  test('retains nearby old rows for reversal, drops distant windows, and caps rich DOM', () => {
    const retained = measurements.slice(70, 100)
    const indexes = forumTopicRenderIndexes(range, measurements, { ...options, retained })
    expect(indexes.length).toBeLessThanOrEqual(48)
    expect(indexes).toContain(95)
    expect(indexes).not.toContain(70)
    const jumped = forumTopicRenderIndexes({ ...range, startIndex: 3000, endIndex: 3007 }, measurements, { ...options, offset: 300_000, retained })
    expect(jumped.every(index => index > 2900)).toBe(true)
    const released = forumTopicRenderIndexes(range, measurements, options)
    expect(released).not.toContain(95)
  })

  test('keeps every visible row and a distant focus even if the normal cap is reached', () => {
    const indexes = forumTopicRenderIndexes({ ...range, endIndex: 155 }, measurements, { ...options, focusedIndex: 3 })
    expect(indexes).toContain(3)
    expect(indexes.filter(index => index >= 100 && index <= 155)).toHaveLength(56)
  })
})
