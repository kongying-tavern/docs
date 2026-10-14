import type { Page } from '@playwright/test'
import type { ForumScenario } from './support/forum-api'
import { writeFile } from 'node:fs/promises'
import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

const topics = Array.from({ length: 5000 }, (_, index) => issue({
  id: 990000 + index,
  number: `IB${index}`,
  title: `FEAT: Render buffer topic ${index}`,
  body: `${'用于验证完整卡片的提前渲染与回收。'.repeat(5 + index % 35)}\n![buffer image ${index}](https://example.com/buffer-${index}.svg){thumbhash:"1fsrB38I9wiIh4hwj3CI+AiIgIAICIgA",width:"640",height:"360"}`,
  comments: 0,
}))
test.use({ scenario: { topics, comments: [] }, trace: 'off', channel: 'chromium' })

async function openFeed(page: Page, scenario: ForumScenario): Promise<void> {
  scenario.handle = request => request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20'
    ? { data: topics, headers: { 'Total_count': '5000', 'Total_page': '1', 'Access-Control-Expose-Headers': 'Total_count, Total_page' } }
    : undefined
  await page.route(/https:\/\/[^/]*clarity\.ms\//, route => route.abort())
  await page.route('https://example.com/buffer-*.svg', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#4686a0"/></svg>',
  }))
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('feedback')
  await expect(page.locator('.topic-list')).toHaveAttribute('data-total-items', '5000', { timeout: 30_000 })
  await expect(page.locator('.topic-list')).toHaveAttribute('data-windowed', 'true')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-forum-topic="IB0"] h4')).toBeVisible()
  // Install any idle control after initial interaction preloads have been scheduled.
  await page.waitForTimeout(1000)
}

test('measurement: buffered rich-row coverage, scroll churn and resources at CPU4', async ({ page, scenario }, info) => {
  test.setTimeout(180_000)
  await openFeed(page, scenario)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await cdp.send('Performance.enable')
  const measurement = await page.evaluate(async () => {
    const selector = '.topic-list > li[data-topic-id]'
    const longTasks: Array<{ start: number, duration: number }> = []
    const observer = new PerformanceObserver(list => longTasks.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration }))))
    observer.observe({ type: 'longtask', buffered: false })
    let added = 0
    let removed = 0
    const identities = new WeakSet<Node>()
    document.querySelectorAll(selector).forEach(row => identities.add(row))
    let mounted = 0
    let remounted = 0
    const seenIds = new Set([...document.querySelectorAll<HTMLElement>(selector)].map(row => row.dataset.topicId))
    const changes = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.matches('li[data-topic-id]'))
            continue
          added++
          if (!identities.has(node)) {
            identities.add(node)
            mounted++
            if (seenIds.has(node.dataset.topicId))
              remounted++
            seenIds.add(node.dataset.topicId)
          }
        }
        for (const node of record.removedNodes) {
          if (node instanceof HTMLElement && node.matches('li[data-topic-id]'))
            removed++
        }
      }
    })
    changes.observe(document.querySelector('.topic-list')!, { childList: true })
    const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    const rows = () => [...document.querySelectorAll<HTMLElement>(selector)].map((row) => {
      const rect = row.getBoundingClientRect()
      return { row, top: rect.top + scrollY, bottom: rect.bottom + scrollY, rich: !!row.querySelector('h4 a') && !!row.querySelector('.forum-image-source') }
    })
    // This measures DOM prepared by the preceding animation frame, rather than
    // counting rows only after scrolling has mounted the new window. Pixel paint
    // fallback itself is covered by the native scrollbar screencast journey.
    const coverage = (rendered: ReturnType<typeof rows>, nextY: number) => {
      const list = document.querySelector('.topic-list')!.getBoundingClientRect()
      const start = Math.max(nextY + 70, list.top + scrollY)
      const end = Math.min(nextY + innerHeight, list.bottom + scrollY)
      let covered = 0
      let previousEnd = start
      for (const item of rendered.filter(item => item.rich).toSorted((a, b) => a.top - b.top)) {
        const from = Math.max(start, item.top, previousEnd)
        const to = Math.min(end, item.bottom)
        if (to > from) {
          covered += to - from
          previousEnd = to
        }
      }
      return end > start ? covered / (end - start) : 1
    }
    const sample = (phase: string, nextY: number) => {
      const rendered = rows()
      const visible = rendered.filter(item => item.bottom > scrollY + 70 && item.top < scrollY + innerHeight)
      const images = visible.flatMap(item => [...item.row.querySelectorAll<HTMLImageElement>('.forum-image-source')])
      const hashes = images.map(image => image.parentElement?.querySelector<HTMLImageElement>('img[aria-hidden="true"][src^="data:image"]'))
      return {
        phase,
        time: performance.now(),
        y: scrollY,
        nextY,
        preparedCoverage: coverage(rendered, nextY),
        visibleCoverage: coverage(rendered, scrollY),
        rows: rendered.length,
        visibleRows: visible.length,
        completeCards: visible.filter(item => item.rich).length,
        images: images.length,
        thumbhashes: hashes.filter(Boolean).length,
        decodedThumbhashes: hashes.filter(hash => hash?.naturalWidth && hash.complete).length,
        readyImages: images.filter(image => getComputedStyle(image).visibility === 'visible' && image.naturalWidth > 0).length,
        missingImageVisuals: images.filter((image, index) => getComputedStyle(image).visibility !== 'visible' && !hashes[index]).length,
        added,
        removed,
        mounted,
        remounted,
      }
    }
    const samples: ReturnType<typeof sample>[] = []
    window.scrollTo({ top: 30_000, behavior: 'instant' })
    await frame()
    await frame()
    // Two directions and speeds expose both advance preparation and reversal churn.
    for (const [phase, step, count] of [
      ['gradual-down', 120, 24],
      ['gradual-up', -200, 16],
      ['fast-down', 1000, 14],
      ['fast-up', -1000, 14],
    ] as const) {
      for (let index = 0; index < count; index++) {
        const nextY = Math.max(0, scrollY + step)
        samples.push(sample(`${phase}-before`, nextY))
        window.scrollTo({ top: nextY, behavior: 'instant' })
        await frame()
        samples.push(sample(`${phase}-after`, nextY))
      }
      await frame()
      await frame()
    }
    for (const fraction of [0.8, 0.1, 0.95, 0.4]) {
      const nextY = (document.documentElement.scrollHeight - innerHeight) * fraction
      samples.push(sample('teleport-before', nextY))
      window.scrollTo({ top: nextY, behavior: 'instant' })
      await frame()
      samples.push(sample('teleport-frame1', nextY))
      await frame()
      samples.push(sample('teleport-frame2', nextY))
    }
    await frame()
    changes.disconnect()
    observer.disconnect()
    return { samples, longTasks, churn: { added, removed, mounted, remounted } }
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await page.waitForTimeout(1500)
  await cdp.send('HeapProfiler.collectGarbage')
  const counters = await cdp.send('Memory.getDOMCounters')
  const { metrics } = await cdp.send('Performance.getMetrics')
  const resources = {
    counters,
    heapUsed: metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value,
    mounted: await page.locator('.topic-list > li[data-topic-id]').count(),
  }
  await writeFile(info.outputPath('render-buffer-measurement.json'), JSON.stringify({ ...measurement, resources }, null, 2))
  // Metrics intentionally have no machine-dependent latency or heap pass limit.
  // The behavioral test below enforces the lifecycle and hard retention bound.
  expect(measurement.samples.length).toBeGreaterThan(0)
  for (const sample of measurement.samples) {
    expect(sample.rows, sample.phase).toBeLessThanOrEqual(49)
    expect(sample.missingImageVisuals, sample.phase).toBe(0)
    expect(sample.visibleCoverage, sample.phase).toBeGreaterThan(0.9)
    expect(sample.completeCards, sample.phase).toBeGreaterThan(0)
    if (sample.phase.startsWith('gradual-') && sample.phase.endsWith('-before'))
      expect(sample.preparedCoverage, sample.phase).toBeGreaterThan(0.9)
  }
})

test('behavior: deferred reclamation retains row identity, reverses and remains bounded', async ({ page, scenario }, info) => {
  test.setTimeout(90_000)
  await openFeed(page, scenario)
  await page.evaluate(() => window.scrollTo({ top: 30_000, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.evaluate(() => {
    const requestIdle = window.requestIdleCallback.bind(window)
    const cancelIdle = window.cancelIdleCallback.bind(window)
    const pending = new Map<number, IdleRequestCallback>()
    let nextId = 1_000_000
    const originalY = scrollY
    const originalRow = [...document.querySelectorAll<HTMLElement>('.topic-list > li[data-topic-id]')]
      .find(row => row.getBoundingClientRect().bottom > 90 && row.getBoundingClientRect().top < innerHeight)!
    const control = {
      originalY,
      originalRow,
      originalId: originalRow.dataset.topicId,
      pending: () => pending.size,
      flush: () => {
        const batch = [...pending.values()]
        pending.clear()
        for (const callback of batch)
          callback({ didTimeout: false, timeRemaining: () => 50 })
        return batch.length
      },
      restore: () => {
        window.requestIdleCallback = requestIdle
        window.cancelIdleCallback = cancelIdle
        pending.clear()
      },
    }
    window.requestIdleCallback = (callback) => {
      const id = nextId++
      pending.set(id, callback)
      return id
    }
    window.cancelIdleCallback = (id) => {
      if (!pending.delete(id))
        cancelIdle(id)
    }
    Object.assign(window, { bufferIdleControl: control })
  })
  interface IdleControl {
    bufferIdleControl: { originalY: number, originalRow: HTMLElement, originalId: string, pending: () => number, flush: () => number, restore: () => void }
  }
  const inspect = () => page.evaluate(() => {
    const control = (window as unknown as IdleControl).bufferIdleControl
    const current = document.querySelector(`li[data-topic-id="${control.originalId}"]`)
    const rect = control.originalRow.getBoundingClientRect()
    return {
      retained: control.originalRow.isConnected,
      sameNode: current === control.originalRow,
      visible: control.originalRow.isConnected && rect.bottom > 70 && rect.top < innerHeight,
      pending: control.pending(),
      mounted: document.querySelectorAll('.topic-list > li[data-topic-id]').length,
    }
  })
  const snapshots: Array<{ phase: string } & Awaited<ReturnType<typeof inspect>>> = []
  try {
    // A nearby row leaves the render buffer while staying eligible for short
    // retention. Far-away rows are tested separately through repeated teleports.
    await page.evaluate(async () => {
      const control = (window as unknown as IdleControl).bufferIdleControl
      for (let step = 1; step <= 6; step++) {
        window.scrollTo({ top: control.originalY + innerHeight * 1.5 * step / 6, behavior: 'instant' })
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      }
    })
    await expect.poll(async () => (await inspect()).pending).toBeGreaterThan(0)
    snapshots.push({ phase: 'idle-held', ...await inspect() })
    expect(snapshots.at(-1)?.sameNode).toBe(true)
    expect(snapshots.at(-1)?.retained).toBe(true)
    await page.evaluate(() => window.scrollTo({ top: (window as unknown as IdleControl).bufferIdleControl.originalY, behavior: 'instant' }))
    await expect.poll(async () => (await inspect()).sameNode).toBe(true)
    await expect.poll(async () => (await inspect()).visible).toBe(true)
    snapshots.push({ phase: 'reversed', ...await inspect() })
    await page.evaluate(() => {
      const control = (window as unknown as IdleControl).bufferIdleControl
      window.scrollTo({ top: control.originalY + innerHeight * 1.5, behavior: 'instant' })
    })
    await page.waitForTimeout(350)
    await expect.poll(async () => (await inspect()).pending).toBeGreaterThan(0)
    const flushed = await page.evaluate(() => (window as unknown as IdleControl).bufferIdleControl.flush())
    expect(flushed).toBeGreaterThan(0)
    await expect.poll(async () => (await inspect()).retained).toBe(false)
    snapshots.push({ phase: 'idle-reclaimed', ...await inspect() })
    for (const fraction of [0.8, 0.1, 0.95, 0.3, 0.7, 0.05]) {
      await page.evaluate(async (fraction) => {
        window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * fraction, behavior: 'instant' })
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      }, fraction)
      const snapshot = { phase: `teleport-${fraction}`, ...await inspect() }
      snapshots.push(snapshot)
      expect(snapshot.mounted).toBeLessThanOrEqual(64)
      const visible = await page.locator('.topic-list > li[data-topic-id]').evaluateAll(rows => rows.filter((row) => {
        const rect = row.getBoundingClientRect()
        return rect.bottom > 70 && rect.top < innerHeight && row.querySelector('h4 a') && row.querySelector('.forum-image-source')
      }).length)
      expect(visible).toBeGreaterThan(0)
    }
  }
  finally {
    await writeFile(info.outputPath('render-buffer-reclamation.json'), JSON.stringify(snapshots, null, 2))
    await page.evaluate(() => (window as unknown as IdleControl).bufferIdleControl.restore())
  }
})
