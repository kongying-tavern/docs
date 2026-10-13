import { describe, expect, test } from 'vitest'
import { forumListPrefetchDistance } from '../../src/forum/services/forumListPrefetch'

describe('forum list prefetch distance', () => {
  test('keeps anonymous and stationary/upward scrolling at the bottom threshold', () => {
    expect(forumListPrefetchDistance(false, 800, 4, 1000)).toBe(64)
    expect(forumListPrefetchDistance(true, 800, 0, 1000)).toBe(64)
    expect(forumListPrefetchDistance(true, 800, -1, 1000)).toBe(64)
  })

  test('loads earlier for faster scrolling or slower requests', () => {
    const baseline = forumListPrefetchDistance(true, 800, 0.5, 300)
    expect(baseline).toBe(2050)
    expect(forumListPrefetchDistance(true, 800, 1, 300)).toBeGreaterThan(baseline)
    expect(forumListPrefetchDistance(true, 800, 0.5, 800)).toBeGreaterThan(baseline)
  })

  test('bounds speculation to four viewports, with a 64px minimum', () => {
    expect(forumListPrefetchDistance(true, 800, 100, 10000)).toBe(3200)
    expect(forumListPrefetchDistance(true, 0, 1, 500)).toBe(64)
  })
})
