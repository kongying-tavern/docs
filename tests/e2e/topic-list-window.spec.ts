import { Buffer } from 'node:buffer'
import { writeFile } from 'node:fs/promises'
import { currentUser, issue, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

const topics = Array.from({ length: 1000 }, (_, index) => issue({
  id: 950000 + index,
  number: `IW${index}`,
  title: `FEAT: Window topic ${index}`,
  body: '用于验证长列表和动态高度。'.repeat(40),
  comments: 0,
}))
test.use({ scenario: { topics, comments: [] }, trace: 'off', channel: 'chromium', launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

test('natural pagination bounds mounted rows through 1000 items and preserves keyboard focus', async ({ page }, info) => {
  test.setTimeout(180_000)
  await page.route(/https:\/\/[^/]*clarity\.ms\//, route => route.abort())
  await page.goto('feedback')
  const list = page.locator('.topic-list')
  await expect(list).toHaveAttribute('data-total-items', '20', { timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  const timings: number[] = []
  for (let count = 40; count <= 1000; count += 20) {
    if (Number(await list.getAttribute('data-total-items')) >= count)
      continue
    const start = Date.now()
    const more = page.getByRole('button', { name: '加载更多', exact: true })
    await expect(more).toBeEnabled()
    await more.evaluate(button => (button as HTMLButtonElement).click())
    await expect(list).toHaveAttribute('data-total-items', String(count))
    timings.push(Date.now() - start)
  }
  await expect(list).toHaveAttribute('data-windowed', 'true')
  const skeleton = page.locator('.topic-scroll-placeholder [data-slot="skeleton"]').first()
  await expect(skeleton).toBeAttached()
  await expect(skeleton).toHaveCSS('animation-name', 'none')
  expect(await page.locator('.forum-topic-item').count()).toBeLessThan(40)
  const row = page.locator('.forum-topic-item').first()
  await row.focus()
  const id = await row.getAttribute('data-forum-topic')
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }))
  await expect(page.locator(`[data-forum-topic="${id}"]`)).toBeFocused()
  await page.locator('body').click({ position: { x: 1, y: 1 } })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(page.locator('[data-forum-topic="IW0"]')).toBeVisible()
  await expect(page.locator('.topic-entry-active')).toHaveCount(0)
  await page.waitForTimeout(1000)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('HeapProfiler.collectGarbage')
  let counters = await cdp.send('Memory.getDOMCounters')
  const initialCounters = counters
  // Production session recording processes removed nodes asynchronously during idle time.
  await expect.poll(async () => {
    await cdp.send('HeapProfiler.collectGarbage')
    counters = await cdp.send('Memory.getDOMCounters')
    return counters.nodes
  }, { timeout: 20_000, intervals: [1000] }).toBeLessThan(20_000).catch(() => {})
  const recordingLoaded = await page.evaluate(() => document.documentElement.dataset.clarityLoaded === 'true')
  await writeFile(info.outputPath('window-resources.json'), JSON.stringify({ timings, initialCounters, counters, recordingLoaded, mounted: await page.locator('.forum-topic-item').count() }))
  if (counters.nodes >= 20_000) {
    const chunks: string[] = []
    cdp.on('HeapProfiler.addHeapSnapshotChunk', ({ chunk }: { chunk: string }) => chunks.push(chunk))
    await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false })
    await writeFile(info.outputPath('window-retained.heapsnapshot'), chunks.join(''))
  }
  expect(counters.nodes).toBeLessThan(20_000)
})

test('windowed images and detail navigation retain the list position', async ({ page, scenario }) => {
  const observerErrors: string[] = []
  page.on('pageerror', (error) => {
    if (error.message.includes('ResizeObserver'))
      observerErrors.push(error.message)
  })
  const imageTopics = topics.slice(0, 120).map(topic => ({ ...topic, body: `${topic.body}\n![audit](https://example.com/list-audit.svg){width:"640",height:"360"}` }))
  scenario.topics!.splice(0, scenario.topics!.length, ...imageTopics)
  scenario.handle = request => request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20'
    ? { data: imageTopics, headers: { 'Total_count': '120', 'Total_page': '1', 'Access-Control-Expose-Headers': 'Total_count, Total_page' } }
    : undefined
  await page.route('https://example.com/list-audit.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="blue"/></svg>' }))
  await page.goto('feedback')
  await expect(page.locator('.topic-list')).toHaveAttribute('data-total-items', '120', { timeout: 30_000 })
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
  await page.waitForTimeout(1000)
  await page.evaluate(() => window.scrollTo({ top: 5000, behavior: 'instant' }))
  await page.waitForTimeout(500)
  const target = await page.locator('.forum-topic-item').evaluateAll(rows => rows.find((row) => {
    const rect = row.querySelector('h4 a')?.getBoundingClientRect()
    if (!rect)
      return false
    return rect.top > 70 && rect.bottom < window.innerHeight
  })?.getAttribute('data-forum-topic'))
  expect(target).toBeTruthy()
  const topic = page.locator(`[data-forum-topic="${target}"]`)
  const before = await topic.evaluate(row => row.getBoundingClientRect().top)
  await topic.locator('h4 a').click()
  await expect(page.locator('[data-forum-route-topic]')).toHaveAttribute('data-forum-route-topic', target!)
  await page.goBack()
  await expect(page.locator('.topic-list')).toHaveAttribute('data-total-items', '120')
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
  await expect.poll(async () => Math.abs(await topic.evaluate(row => row.getBoundingClientRect().top) - before)).toBeLessThan(12)
  await expect(page.locator('.topic-entry-active')).toHaveCount(0)
  expect(observerErrors).toEqual([])
})

test('5000 variable-height topics remain bounded on mobile and changing display preserves an anchor', async ({ page, scenario }) => {
  test.setTimeout(90_000)
  scenario.handle = request => request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20'
    ? {
        data: Array.from({ length: 5000 }, (_, index) => ({ ...topics[index % topics.length], id: 960000 + index, number: `IL${index}`, body: '动态行高正文。'.repeat(10 + index % 80) })),
        headers: { 'Total_count': '5000', 'Total_page': '1', 'Access-Control-Expose-Headers': 'Total_count, Total_page' },
      }
    : undefined
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('feedback')
  await expect(page.locator('.topic-list')).toHaveAttribute('data-total-items', '5000', { timeout: 30_000 })
  await expect(page.locator('.topic-list')).toHaveAttribute('data-windowed', 'true')
  await page.evaluate(() => window.scrollTo({ top: 30_000, behavior: 'instant' }))
  await page.waitForTimeout(300)
  expect(await page.locator('.forum-topic-item').count()).toBeLessThan(50)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const anchor = await page.locator('.topic-list > li[data-topic-id]').evaluateAll((rows) => {
    const row = rows.find(row => row.getBoundingClientRect().bottom > 0) as HTMLElement
    return { id: row.dataset.topicId, top: row.getBoundingClientRect().top }
  })
  // Change the shared preference without Playwright scrolling the toolbar into view.
  await page.evaluate(() => {
    localStorage.setItem('FORUM-TOPIC-VIEW-MODE', 'COMPACT')
    window.dispatchEvent(new StorageEvent('storage', { key: 'FORUM-TOPIC-VIEW-MODE', newValue: 'COMPACT', storageArea: localStorage }))
  })
  await expect(page.locator(`li[data-topic-id="${anchor.id}"]`)).toBeAttached()
  // Late ResizeObserver measurements must not displace an initially restored anchor.
  let stable = 0
  await expect.poll(async () => {
    const delta = Math.abs(await page.locator(`li[data-topic-id="${anchor.id}"]`).evaluate(row => row.getBoundingClientRect().top) - anchor.top)
    stable = delta < 12 ? stable + 1 : 0
    return stable
  }, { intervals: [100] }).toBeGreaterThanOrEqual(3)
})

test('expanded body survives window remounts', async ({ page, scenario }) => {
  scenario.handle = request => request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20'
    ? { data: topics.slice(0, 120), headers: { 'Total_count': '120', 'Total_page': '1', 'Access-Control-Expose-Headers': 'Total_count, Total_page' } }
    : undefined
  await page.goto('feedback')
  await expect(page.locator('.topic-list')).toHaveAttribute('data-total-items', '120', { timeout: 30_000 })
  const row = page.locator('[data-forum-topic="IW0"]')
  await row.getByRole('button', { name: '显示更多', exact: true }).click()
  await expect(row.locator('.forum-topic-summary')).not.toHaveClass(/line-clamp-4/)
  await page.locator('body').click({ position: { x: 1, y: 1 } })
  await page.evaluate(() => window.scrollTo({ top: 30_000, behavior: 'instant' }))
  await expect(row).toHaveCount(0)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(row.locator('.forum-topic-summary')).not.toHaveClass(/line-clamp-4/)
  await expect(row.getByRole('button', { name: '显示更多', exact: true })).toHaveCount(0)
})

test('translation and the original-text selection survive window remounts', async ({ page, scenario }) => {
  scenario.handle = request => request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20'
    ? { data: topics.slice(0, 120), headers: { 'Total_count': '120', 'Total_page': '1', 'Access-Control-Expose-Headers': 'Total_count, Total_page' } }
    : undefined
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'LanguageDetector', { configurable: true, value: {
      availability: async () => 'available',
      create: async () => ({ inputQuota: 100_000, measureInputUsage: async () => 0, detect: async () => [{ detectedLanguage: 'zh', confidence: 1 }], destroy() {} }),
    } })
    Object.defineProperty(globalThis, 'Translator', { configurable: true, value: {
      availability: async () => 'available',
      create: async () => ({ inputQuota: 100_000, measureInputUsage: async () => 0, translate: async (text: string) => text.includes('Window topic') ? 'Translated feedback title' : 'Translated feedback body', destroy() {} }),
    } })
  })
  await page.goto('feedback')
  await expect(page.locator('.topic-list')).toHaveAttribute('data-total-items', '120', { timeout: 30_000 })
  const row = page.locator('[data-forum-topic="IW0"]')
  const toggle = row.locator('.forum-translation-status button[aria-pressed]')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await page.locator('body').click({ position: { x: 1, y: 1 } })
  await page.evaluate(() => window.scrollTo({ top: 15_000, behavior: 'instant' }))
  await expect(row).toHaveCount(0)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(row.locator('article')).toContainText('用于验证长列表和动态高度')
  await toggle.click()
  await expect(row.locator('article')).toContainText('Translated feedback body')
  await expect(row.locator('h4')).toContainText('Translated feedback title')
  await page.locator('body').click({ position: { x: 1, y: 1 } })
  await page.evaluate(() => window.scrollTo({ top: 15_000, behavior: 'instant' }))
  await expect(row).toHaveCount(0)
  await page.evaluate(() => {
    localStorage.setItem('forum-auto-translate-enabled', 'false')
    window.dispatchEvent(new StorageEvent('storage', { key: 'forum-auto-translate-enabled', newValue: 'false', storageArea: localStorage }))
    window.scrollTo({ top: 0, behavior: 'instant' })
  })
  await expect(row.locator('article')).toContainText('用于验证长列表和动态高度')
  await expect(toggle).toHaveCount(0)
})

test('rapid jumps keep readable rows across a long image list', async ({ page, scenario }, info) => {
  test.setTimeout(180_000)
  await page.route(/https:\/\/[^/]*clarity\.ms\//, route => route.abort())
  scenario.handle = request => request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20'
    ? { data: Array.from({ length: 5000 }, (_, index) => ({ ...topics[index % topics.length], id: 970000 + index, number: `IF${index}`, body: `${'可阅读的反馈正文。'.repeat(5 + index % 40)}\n![picture](https://example.com/rapid.svg){thumbhash:"1fsrB38I9wiIh4hwj3CI+AiIgIAICIgA",width:"640",height:"360"}` })), headers: { 'Total_count': '5000', 'Total_page': '1', 'Access-Control-Expose-Headers': 'Total_count, Total_page' } }
    : undefined
  await page.route('https://example.com/rapid.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"/>' }))
  await page.goto('feedback')
  await expect(page.locator('.topic-list')).toHaveAttribute('data-total-items', '5000', { timeout: 30_000 })
  await page.waitForTimeout(1000)
  const frames = await page.evaluate(async () => {
    const samples: Array<{ position: number, readable: number, mounted: number, completeCards: number }> = []
    for (const position of [0.2, 0.8, 0.4, 0.95, 0.05, 0.7, 0.3]) {
      window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * position, behavior: 'instant' })
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      const rows = [...document.querySelectorAll('.forum-topic-item')]
      samples.push({ position, mounted: rows.length, completeCards: rows.filter((row) => {
        const rect = row.getBoundingClientRect()
        return rect.bottom > 70 && rect.top < innerHeight && row.querySelector('h4 a') && row.querySelector('.forum-image-source')
      }).length, readable: rows.filter((row) => {
        const rect = row.getBoundingClientRect()
        return rect.bottom > 70 && rect.top < innerHeight && (row.querySelector('article')?.textContent?.includes('可阅读') ?? false)
      }).length })
    }
    return samples
  })
  expect(frames.every(frame => frame.readable > 0), JSON.stringify(frames)).toBe(true)
  expect(frames.every(frame => frame.completeCards > 0), JSON.stringify(frames)).toBe(true)
  expect(frames.every(frame => frame.mounted < 60), JSON.stringify(frames)).toBe(true)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const scrollbar = await page.evaluate(() => ({ width: innerWidth - document.documentElement.clientWidth, x: (innerWidth + document.documentElement.clientWidth) / 2 }))
  expect(scrollbar.width).toBeGreaterThan(0)
  const scrollX = scrollbar.x
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(page.locator('[data-forum-topic="IF0"] h4')).toBeVisible()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: info.outputPath('before-scrollbar-drag.png') })
  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.start')
  await page.evaluate(() => {
    const samples: unknown[] = []
    Object.assign(window, { dragSamples: samples })
    const tick = () => {
      samples.push({ time: performance.now(), y: scrollY, rows: [...document.querySelectorAll('li[data-topic-id]')].filter(row => row.getBoundingClientRect().bottom > 70 && row.getBoundingClientRect().top < innerHeight).length })
      if (samples.length < 120)
        requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  const captures: Array<{ data: string, timestamp?: number }> = []
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    captures.push({ data, timestamp: metadata.timestamp })
    void cdp.send('Page.screencastFrameAck', { sessionId })
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: 1000, maxHeight: 750, everyNthFrame: 1 })
  // Queue the complete gesture: Windows native thumb tracking can hold a move's
  // protocol response until release, so awaiting each move would deadlock the test.
  const inputs = [cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: scrollX, y: 25, button: 'left', buttons: 1, clickCount: 1 })]
  for (const y of [100, 300, 600, 150, 500]) {
    await new Promise(resolve => setTimeout(resolve, 40))
    inputs.push(cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: scrollX, y, button: 'left', buttons: 1 }))
  }
  inputs.push(cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: scrollX, y: 500, button: 'left', buttons: 0, clickCount: 1 }))
  await Promise.all(inputs)
  await page.waitForTimeout(500)
  await cdp.send('Page.stopScreencast')
  const { profile } = await cdp.send('Profiler.stop')
  await writeFile(info.outputPath('drag-profile.json'), JSON.stringify(profile))
  await writeFile(info.outputPath('drag-main-thread.json'), JSON.stringify(await page.evaluate(() => (window as unknown as { dragSamples: unknown[] }).dragSamples)))
  expect(captures.length).toBeGreaterThan(2)
  for (const [index, capture] of captures.entries())
    await writeFile(info.outputPath(`drag-frame-${index}.jpg`), Buffer.from(capture.data, 'base64'))
  await writeFile(info.outputPath('drag-frames.json'), JSON.stringify(captures.map(({ timestamp }) => ({ timestamp }))))
  const paintedPixels = await page.evaluate(async (frames) => {
    const counts: number[] = []
    for (const { data } of frames) {
      const image = new Image()
      image.src = `data:image/jpeg;base64,${data}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')!
      context.drawImage(image, 0, 0)
      // Inspect list pixels, excluding persistent navigation and the sidebar.
      const pixels = context.getImageData(250, 65, 500, 435).data
      let count = 0
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index] < 248 || pixels[index + 1] < 248 || pixels[index + 2] < 248)
          count++
      }
      counts.push(count)
    }
    return counts
  }, captures)
  await writeFile(info.outputPath('drag-painted-pixels.json'), JSON.stringify(paintedPixels))
  expect(paintedPixels.every(count => count > 1000), JSON.stringify(paintedPixels)).toBe(true)
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(100_000)
  await expect.poll(() => page.locator('li[data-topic-id]').evaluateAll(rows => rows.filter((row) => {
    const rect = row.getBoundingClientRect()
    return rect.bottom > 70 && rect.top < innerHeight && row.querySelector('article')?.textContent?.includes('可阅读')
  }).length)).toBeGreaterThan(0)
  await page.screenshot({ path: info.outputPath('after-scrollbar-drag.png') })
  await cdp.send('Performance.enable')
  await cdp.send('HeapProfiler.collectGarbage')
  const metrics = await cdp.send('Performance.getMetrics')
  await writeFile(info.outputPath('rapid-list-resources.json'), JSON.stringify({ frames, counters: await cdp.send('Memory.getDOMCounters'), heapBytes: metrics.metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value }))
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
})

test('removing a deep row retains other measured heights in a long list', async ({ page, scenario }, info) => {
  test.setTimeout(90_000)
  const replacement = topics.slice(0, 120).map((topic, index) => issue({ ...topic, labels: [{ name: 'TYP-FEAT' }, { name: 'ST-ROADMAP' }], body: '动态高度正文。'.repeat(5 + index % 35) }))
  const items = scenario.topics!
  items.splice(0, items.length, ...replacement)
  scenario.user = currentUser
  scenario.handle = (request) => {
    if (request.method === 'GET' && (request.path.endsWith('/members') || request.path.endsWith('/collaborators')))
      return { data: [currentUser] }
    if (request.method === 'GET' && request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20') {
      const visibleItems = items.filter(topic => topic.state === 'open')
      return { data: visibleItems, headers: { 'Total_count': String(visibleItems.length), 'Total_page': '1', 'Access-Control-Expose-Headers': 'Total_count, Total_page' } }
    }
    if (request.method === 'PATCH') {
      const index = items.findIndex(topic => request.path.endsWith(`/issues/${topic.number}`))
      if (index < 0)
        return undefined
      const patch = JSON.parse(String(request.body))
      const updated = issue({ ...items[index], state: patch.state, labels: String(patch.labels ?? 'TYP-FEAT').split(',').map(name => ({ name })) })
      items.splice(index, 1, updated)
      return { data: updated }
    }
  }
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('feedback')
  const list = page.locator('.topic-list')
  await expect(list).toHaveAttribute('data-total-items', '120', { timeout: 30_000 })
  for (const top of [5000, 10_000, 15_000]) {
    await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), top)
    await page.waitForTimeout(200)
  }
  // Capture the rich window after its batched measurements settle.
  await page.waitForTimeout(300)
  const target = await page.locator('.forum-topic-item').evaluateAll(rows => rows.find((row) => {
    const rect = row.querySelector('h4 a')?.getBoundingClientRect()
    return rect && rect.top > 70 && rect.bottom < innerHeight
  })?.getAttribute('data-forum-topic'))
  expect(target).toBeTruthy()
  const row = page.locator(`[data-forum-topic="${target}"]`)
  const neighborId = items[items.findIndex(topic => topic.number === target) + 1]!.number
  const neighbor = page.locator(`[data-forum-topic="${neighborId}"]`)
  const neighborTop = await neighbor.evaluate(element => element.getBoundingClientRect().top)
  const beforeScrollY = await page.evaluate(() => window.scrollY)
  const removedHeight = await row.evaluate(element => element.closest('li')!.getBoundingClientRect().height)
  const height = await list.evaluate(element => element.getBoundingClientRect().height)
  const beforeRows = await page.locator('li[data-topic-id]').evaluateAll(rows => rows.map(row => ({ id: (row as HTMLElement).dataset.topicId, index: (row as HTMLElement).dataset.index, height: row.getBoundingClientRect().height, top: (row as HTMLElement).style.top })))
  await row.locator('h4 a').click()
  await expect(page.locator('[data-forum-route-topic]')).toHaveAttribute('data-forum-route-topic', target!)
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
  await page.locator('[data-forum-route-topic] .topic-btn-more').click()
  await page.getByRole('menuitem', { name: '隐藏反馈', exact: true }).click()
  await expect(list).toHaveAttribute('data-total-items', '119')
  await page.waitForTimeout(500)
  const afterHeight = await list.evaluate(element => element.getBoundingClientRect().height)
  const afterRows = await page.locator('li[data-topic-id]').evaluateAll(rows => rows.map(row => ({ id: (row as HTMLElement).dataset.topicId, index: (row as HTMLElement).dataset.index, height: row.getBoundingClientRect().height, top: (row as HTMLElement).style.top })))
  const afterScrollY = await page.evaluate(() => window.scrollY)
  const afterNeighborTop = await neighbor.evaluate(element => element.getBoundingClientRect().top)
  await writeFile(info.outputPath('deletion-heights.json'), JSON.stringify({ height, removedHeight, beforeRows, beforeScrollY, neighborTop, afterHeight, afterRows, afterScrollY, afterNeighborTop }))
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
  // Deletion can bring a previously estimated overscan row into the measured
  // window. Verify surviving identities directly instead of freezing total size.
  expect(afterHeight).toBeLessThan(height)
  const removedIndex = Number(beforeRows.find(item => item.id === target)!.index)
  const reference = beforeRows.find(previous => previous.id !== target && afterRows.some(current => current.id === previous.id))!
  const afterReference = afterRows.find(current => current.id === reference.id)!
  const referenceShift = Number.parseFloat(afterReference.top) - Number.parseFloat(reference.top)
  for (const current of afterRows) {
    const previous = beforeRows.find(item => item.id === current.id)
    if (!previous)
      continue
    expect(Math.abs(current.height - previous.height), current.id).toBeLessThan(1)
    // Newly measured rows above the window can shift the whole document prefix.
    // Compare surviving row spacing relative to a common identity; separately
    // verify the actual viewport position below, including scroll compensation.
    const deletionShift = (Number(previous.index) > removedIndex ? removedHeight : 0)
      - (Number(reference.index) > removedIndex ? removedHeight : 0)
    const expectedTop = Number.parseFloat(previous.top) + referenceShift - deletionShift
    expect(Math.abs(Number.parseFloat(current.top) - expectedTop), current.id).toBeLessThan(5)
  }
  await expect.poll(async () => Math.abs(await neighbor.evaluate(element => element.getBoundingClientRect().top) - (neighborTop - removedHeight))).toBeLessThan(40)
  await expect(page.locator(`[data-forum-topic="${target}"]`)).toHaveCount(0)
})
