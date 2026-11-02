import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ scenario: {
  topics: Array.from({ length: 20 }, (_, index) => issue({
    id: 920000 + index,
    number: String(2000 + index),
    comments: 0,
  })),
  comments: [],
} })

test('topic hover reuses row geometry until content changes', async ({ page }) => {
  await page.goto('feedback')
  const rows = page.locator('.forum-topic-item')
  await expect(rows).toHaveCount(20, { timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  const row = rows.first()
  await row.hover({ position: { x: 4, y: 10 } })
  await expect(row).toHaveAttribute('data-fluid-hover-active', '')
  const indicator = page.locator('.topic-list').locator('..').locator(':scope > [aria-hidden="true"]').first()
  await expect(indicator).toHaveCSS('opacity', '1')

  await page.evaluate(async () => {
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop')!
    const list = document.querySelector('.topic-list')!
    list.setAttribute('data-hover-row-reads', '0')
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      ...descriptor,
      get() {
        if (this.matches('.forum-topic-item'))
          list.setAttribute('data-hover-row-reads', String(Number(list.getAttribute('data-hover-row-reads')) + 1))
        return descriptor.get!.call(this)
      },
    })
  })
  const box = (await row.boundingBox())!
  for (let step = 1; step <= 12; step++) {
    await page.mouse.move(box.x + 4, box.y + 10 + step)
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
  }
  const reads = Number(await page.locator('.topic-list').getAttribute('data-hover-row-reads'))
  await test.info().attach('hover-geometry-reads', { body: JSON.stringify({ moves: 12, rows: 20, reads }), contentType: 'application/json' })
  expect(reads, 'moving within a measured row must not remeasure the list').toBe(0)

  // A resized row must invalidate the cache, including the positions of later rows.
  await row.evaluate((element: HTMLElement) => element.style.minHeight = `${element.offsetHeight + 80}px`)
  await expect.poll(async () => Number(await page.locator('.topic-list').getAttribute('data-hover-row-reads'))).toBeGreaterThan(0)
  await expect.poll(async () => {
    const painted = await indicator.boundingBox()
    const target = await row.boundingBox()
    return Math.abs(painted!.height - target!.height)
  }).toBeLessThan(1)
  await rows.nth(1).hover({ position: { x: 4, y: 10 } })
  await expect(rows.nth(1)).toHaveAttribute('data-fluid-hover-active', '')

  // Scrolling content under a stationary pointer must still repick from the cache.
  await row.hover({ position: { x: 4, y: 10 } })
  const first = (await row.boundingBox())!
  const second = (await rows.nth(1).boundingBox())!
  await page.evaluate(distance => window.scrollBy({ top: distance, behavior: 'instant' }), second.y - first.y)
  await expect(rows.nth(1)).toHaveAttribute('data-fluid-hover-active', '')
  await expect.poll(async () => {
    const painted = await indicator.boundingBox()
    const target = await rows.nth(1).boundingBox()
    return Math.abs(painted!.y - target!.y)
  }).toBeLessThan(1)
  await page.mouse.move(0, 0)
  await expect(indicator).toHaveCSS('opacity', '0')
})
