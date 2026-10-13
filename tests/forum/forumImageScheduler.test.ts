import { describe, expect, test, vi } from 'vitest'
import { createForumImageScheduler } from '../../src/forum/services/forumImageScheduler'

const flush = () => Promise.resolve()

describe('forum image admission', () => {
  test('waits for viewport images, then below, then old images', async () => {
    const scheduler = createForumImageScheduler(2)
    const started: string[] = []
    const old = scheduler.register(() => started.push('old'), () => {})
    const below = scheduler.register(() => started.push('below'), () => {})
    const visible = scheduler.register(() => started.push('visible'), () => {})
    old.update(2, 10)
    below.update(1, 100)
    visible.update(0, 0)
    await flush()
    expect(started).toEqual(['visible'])
    visible.complete()
    await flush()
    expect(started).toEqual(['visible', 'below'])
    below.complete()
    await flush()
    expect(started).toEqual(['visible', 'below', 'old'])
  })

  test('reclaims speculative slots when scrolling exposes a new image', async () => {
    const scheduler = createForumImageScheduler(1)
    const cancel = vi.fn()
    const first = scheduler.register(vi.fn(), cancel)
    first.update(1, 1)
    await flush()
    const start = vi.fn()
    const visible = scheduler.register(start, () => {})
    visible.update(0, 0)
    await flush()
    expect(cancel).toHaveBeenCalledOnce()
    expect(start).toHaveBeenCalledOnce()
    visible.complete()
    await flush()
    first.remove()
    await flush()
  })

  test('bounds concurrency and selects nearest images within a tier', async () => {
    const scheduler = createForumImageScheduler(2)
    const started: number[] = []
    const jobs = [30, 10, 20].map(distance => scheduler.register(() => started.push(distance), () => {}))
    jobs.forEach((job, index) => job.update(1, [30, 10, 20][index]!))
    await flush()
    expect(started).toEqual([10, 20])
    jobs[1]!.remove()
    await flush()
    expect(started).toEqual([10, 20, 30])
  })

  test('below images preempt old images and cancelled work resumes last', async () => {
    const scheduler = createForumImageScheduler(1)
    const started: string[] = []
    const cancel = vi.fn()
    const old = scheduler.register(() => started.push('old'), cancel)
    old.update(2, 0)
    await flush()
    const below = scheduler.register(() => started.push('below'), () => {})
    below.update(1, 100)
    await flush()
    expect(cancel).toHaveBeenCalledOnce()
    expect(started).toEqual(['old', 'below'])
    below.complete()
    await flush()
    expect(started).toEqual(['old', 'below', 'old'])
  })

  test('holds speculation until initial classification, and releases on removal', async () => {
    const scheduler = createForumImageScheduler()
    const start = vi.fn()
    const below = scheduler.register(start, () => {})
    const unknown = scheduler.register(() => {}, () => {})
    below.update(1, 0)
    await flush()
    expect(start).not.toHaveBeenCalled()
    unknown.remove()
    await flush()
    expect(start).toHaveBeenCalledOnce()
  })
})
