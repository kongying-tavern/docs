import { afterEach, expect, test, vi } from 'vitest'
import { subscribeRelativeTime } from '../../src/services/relativeTimeClock'

const cleanup: Array<() => void> = []
afterEach(() => {
  cleanup.splice(0).forEach(stop => stop())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('shares one timer, updates old timestamps less often, and releases the last subscriber', () => {
  vi.useFakeTimers()
  vi.setSystemTime(1_000_000)
  const document = Object.assign(new EventTarget(), { hidden: false })
  vi.stubGlobal('document', document)
  const recent = vi.fn()
  const old = vi.fn()
  cleanup.push(subscribeRelativeTime(() => 1_000_000, recent))
  cleanup.push(subscribeRelativeTime(() => 0, old))
  expect(vi.getTimerCount()).toBe(1)
  vi.advanceTimersByTime(3000)
  expect(recent).toHaveBeenCalledTimes(4)
  expect(old).toHaveBeenCalledTimes(1)
  document.hidden = true
  document.dispatchEvent(new Event('visibilitychange'))
  expect(vi.getTimerCount()).toBe(0)
  vi.advanceTimersByTime(60_000)
  document.hidden = false
  document.dispatchEvent(new Event('visibilitychange'))
  expect(old).toHaveBeenLastCalledWith(Date.now())
  cleanup.splice(0).forEach(stop => stop())
  expect(vi.getTimerCount()).toBe(0)
})
