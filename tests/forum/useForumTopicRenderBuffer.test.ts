import type { Range, Virtualizer } from '@tanstack/vue-virtual'
import type { EffectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useForumTopicRenderBuffer } from '../../src/forum/composables/view/useForumTopicRenderBuffer'

const observation = vi.hoisted(() => ({
  callback: undefined as ((offset: number, scrolling: boolean) => void) | undefined,
  detach: vi.fn(),
  observe: vi.fn(),
}))
vi.mock('@tanstack/vue-virtual', () => ({ observeWindowOffset: observation.observe }))

describe('forum topic render buffer lifecycle', () => {
  let now: number
  let scopes: EffectScope[]
  let frames: Map<number, FrameRequestCallback>
  let idle: Map<number, IdleRequestCallback>
  let cancelIdle: ReturnType<typeof vi.fn>

  beforeEach(() => {
    now = 0
    scopes = []
    frames = new Map()
    idle = new Map()
    let nextFrame = 1
    let nextIdle = 1
    vi.useFakeTimers()
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      const id = nextFrame++
      frames.set(id, callback)
      return id
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)))
    cancelIdle = vi.fn((id: number) => idle.delete(id))
    vi.stubGlobal('window', {
      innerHeight: 800,
      requestIdleCallback: vi.fn((callback: IdleRequestCallback) => {
        const id = nextIdle++
        idle.set(id, callback)
        return id
      }),
      cancelIdleCallback: cancelIdle,
    })
    observation.callback = undefined
    observation.observe.mockImplementation((_instance, callback) => {
      observation.callback = callback
      return observation.detach
    })
  })

  afterEach(() => {
    scopes.forEach(scope => scope.stop())
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function createBuffer() {
    const scope = effectScope()
    scopes.push(scope)
    const active = ref(true)
    const focused = ref<string>()
    const indexes = new Map(Array.from({ length: 1000 }, (_, index) => [String(index), index]))
    const buffer = scope.run(() => useForumTopicRenderBuffer(active, focused, indexes))!
    const instance = {
      scrollRect: { width: 1200, height: 800 },
      scrollOffset: 5000,
      measurementsCache: Array.from({ length: 1000 }, (_, index) => ({ key: String(index), index, start: index * 100, end: (index + 1) * 100, size: 100, lane: 0 })),
    } as unknown as Virtualizer<Window, HTMLElement>
    const range: Range = { count: 1000, startIndex: 50, endIndex: 57, overscan: 0 }
    buffer.resize(800)
    return { scope, focused, buffer, instance, range }
  }

  test('subtracts accumulated size corrections from scroll velocity and still observes user scrolling', () => {
    const { buffer, instance, range } = createBuffer()
    const callback = vi.fn()
    const detach = buffer.observeOffset(instance, callback)
    observation.callback!(5000, true)
    const stationary = buffer.extract.value

    buffer.adjust(400)
    buffer.adjust(600)
    now = 16
    instance.scrollOffset = 6000
    observation.callback!(6000, true)
    expect(buffer.extract.value).toBe(stationary)
    expect(vi.getTimerCount()).toBe(0)

    now = 32
    instance.scrollOffset = 7000
    observation.callback!(7000, true)
    const currentRange = { ...range, startIndex: 70, endIndex: 77 }
    expect(buffer.extract.value(currentRange, instance).at(-1)).toBeGreaterThan(stationary(currentRange, instance).at(-1)!)
    expect(callback.mock.calls).toEqual([[5000, true], [6000, true], [7000, true]])
    detach?.()
    expect(observation.detach).toHaveBeenCalledOnce()
  })

  test('idle disposal removes retired identities and invalidates the extractor memo', async () => {
    const { buffer, instance, range } = createBuffer()
    const withoutRetention = buffer.extract.value(range, instance)
    expect(withoutRetention).not.toContain(41)
    buffer.recordRows(['41'], ['42'])
    const beforeIdle = buffer.extract.value
    expect(beforeIdle(range, instance)).toContain(41)
    await nextTick()
    vi.advanceTimersByTime(250)
    expect(idle.size).toBe(1)
    expect(beforeIdle(range, instance)).toContain(41)

    const callbacks = [...idle.values()]
    idle.clear()
    callbacks.forEach(callback => callback({ didTimeout: false, timeRemaining: () => 50 }))
    expect(buffer.extract.value).not.toBe(beforeIdle)
    expect(buffer.extract.value(range, instance)).toEqual(withoutRetention)
  })

  test('focus changes alone replace the extractor and pin a distant row', () => {
    const { buffer, focused, instance, range } = createBuffer()
    const beforeFocus = buffer.extract.value
    expect(beforeFocus(range, instance)).not.toContain(950)
    focused.value = '950'
    const withFocus = buffer.extract.value
    expect(withFocus).not.toBe(beforeFocus)
    expect(withFocus(range, instance)).toContain(950)
    focused.value = undefined
    expect(buffer.extract.value).not.toBe(withFocus)
    expect(buffer.extract.value(range, instance)).toEqual(beforeFocus(range, instance))
  })

  test.each(['reset', 'scope.stop'] as const)('%s cancels timers, idle and commit frames without nextTick revival', async (cleanup) => {
    const stop = ({ scope, buffer }: ReturnType<typeof createBuffer>) => cleanup === 'reset' ? buffer.reset() : scope.stop()
    const beforeCommit = createBuffer()
    beforeCommit.buffer.recordRows(['41'], ['42'])
    expect(vi.getTimerCount()).toBe(1)
    stop(beforeCommit)
    await nextTick()
    expect(vi.getTimerCount()).toBe(0)
    expect(frames.size).toBe(0)
    expect(idle.size).toBe(0)

    const afterCommit = createBuffer()
    afterCommit.buffer.recordRows(['41'], ['42'])
    await nextTick()
    expect(frames.size).toBe(1)
    vi.advanceTimersByTime(250)
    expect(idle.size).toBe(1)
    const idleId = [...idle.keys()][0]
    stop(afterCommit)
    expect(cancelIdle).toHaveBeenCalledWith(idleId)
    await nextTick()
    vi.advanceTimersByTime(2000)
    expect(vi.getTimerCount()).toBe(0)
    expect(frames.size).toBe(0)
    expect(idle.size).toBe(0)
    expect(afterCommit.buffer.extract.value(afterCommit.range, afterCommit.instance)).not.toContain(41)
  })
})
