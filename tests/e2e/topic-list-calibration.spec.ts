import { writeFile } from 'node:fs/promises'
import process from 'node:process'
import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

// Calibration expectations describe the build being tested, not a production option.
const fullLimit = Number(process.env.FORUM_HYBRID_LIMIT || 80)
test.use({ channel: 'chromium', trace: 'off' })

for (const images of [false, true]) {
  test(`calibration: natural growth and resource budget (images: ${images})`, async ({ page, scenario }, info) => {
    test.setTimeout(180_000)
    const topics = Array.from({ length: 180 }, (_, index) => issue({
      id: 992000 + index,
      number: `IC${index}`,
      title: `FEAT: Calibration topic ${index}`,
      body: '用于比较常驻列表与动态窗口。'.repeat(10 + index % 30)
        + (images ? `\n![image](https://example.com/calibration-${index}.svg){thumbhash:"1fsrB38I9wiIh4hwj3CI+AiIgIAICIgA",width:"640",height:"360"}` : ''),
      comments: 0,
    }))
    scenario.handle = request => request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20'
      ? {
          data: topics.slice((Number(request.query.get('page')) - 1) * 20, Number(request.query.get('page')) * 20),
          headers: { 'Total_count': '180', 'Total_page': '9', 'Access-Control-Expose-Headers': 'Total_count, Total_page' },
        }
      : undefined
    await page.route(/https:\/\/[^/]*clarity\.ms\//, route => route.abort())
    await page.route('https://example.com/calibration-*.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"/>' }))
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await cdp.send('Performance.enable')
    await page.goto('feedback')
    const list = page.locator('.topic-list')
    await expect(list).toHaveAttribute('data-total-items', '20', { timeout: 30_000 })
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => {
      const original = window.fetch
      window.fetch = (...args) => original(...args).then((response) => {
        const url = new URL(response.url)
        if (url.pathname.endsWith('/Feedback/issues') && url.searchParams.get('per_page') === '20')
          Object.assign(window, { hybridResponseAt: performance.now() })
        return response
      })
    })
    const samples = []
    for (let count = 40; count <= 180; count += 20) {
      const commit = await page.getByRole('button', { name: '加载更多', exact: true }).evaluate(async (button, count) => {
        const state = window as unknown as { hybridResponseAt?: number }
        state.hybridResponseAt = undefined
        const started = performance.now()
        const list = document.querySelector('.topic-list')!
        await new Promise<void>((resolve) => {
          const observer = new MutationObserver(() => {
            if (list.getAttribute('data-total-items') === String(count)) {
              observer.disconnect()
              resolve()
            }
          })
          observer.observe(list, { attributes: true, attributeFilter: ['data-total-items'] })
          ;(button as HTMLButtonElement).click()
        })
        const published = performance.now()
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
        const painted = performance.now()
        return { responseCaptured: state.hybridResponseAt !== undefined, responseMs: (state.hybridResponseAt ?? published) - started, responseToCommitMs: published - (state.hybridResponseAt ?? published), responseToFrameMs: painted - (state.hybridResponseAt ?? published) }
      }, count)
      await expect(list).toHaveAttribute('data-windowed', String(count > fullLimit))
      expect(commit.responseCaptured, `response timer for ${count} rows`).toBe(true)
      await page.waitForTimeout(350)
      await cdp.send('HeapProfiler.collectGarbage')
      const { metrics } = await cdp.send('Performance.getMetrics')
      samples.push({ count, ...commit, mounted: await list.locator('li[data-topic-id]').count(), counters: await cdp.send('Memory.getDOMCounters'), heapBytes: metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value })
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await writeFile(info.outputPath(`threshold-${fullLimit}-${images ? 'images' : 'text'}.json`), JSON.stringify({ fullLimit, images, cpuRate: 4, samples }, null, 2))
    expect(samples.at(-1)?.mounted).toBeLessThan(49)
  })
}
