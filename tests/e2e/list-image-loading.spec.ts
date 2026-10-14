import type { Route } from '@playwright/test'
import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

const metadata = '{thumbhash:"1fsrB38I9wiIh4hwj3CI+AiIgIAICIgA",width:"640",height:"480"}'
const topics = Array.from({ length: 20 }, (_, index) => issue({ id: 980000 + index, number: `IM${index}`, body: `图片优先级测试。\n![image ${index}](https://example.com/priority-${index}.svg)${metadata}` }))
test.use({ scenario: { topics, comments: [] } })

test('thumbhash exists before viewport observation and an unrequested image never paints its alt', async ({ page }) => {
  await page.addInitScript(() => {
    const OriginalObserver = window.IntersectionObserver
    window.IntersectionObserver = class extends OriginalObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super((entries, observer) => callback(entries.filter(entry => !entry.target.querySelector('.forum-image-source')), observer), options)
      }
    }
  })
  await page.goto('feedback', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.topic-list')).toHaveAttribute('data-total-items', '20', { timeout: 30_000 })
  const source = page.locator('.forum-image-source').first()
  await expect(source).not.toHaveAttribute('src')
  await expect(source).toHaveCSS('visibility', 'hidden')
  const placeholder = source.locator('..').locator('img[aria-hidden="true"]')
  await expect(placeholder).toHaveAttribute('src', /^data:image/)
  await expect.poll(() => placeholder.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
})

test('the real image remains hidden until decode completes even without thumbhash', async ({ page, scenario }) => {
  scenario.topics!.splice(0, scenario.topics!.length, issue({
    id: 980100,
    number: 'IDECODE',
    body: '![Visible alt](https://example.com/decode.svg){width:"640",height:"480"}',
    comments: 0,
  }))
  await page.addInitScript(() => {
    let release!: () => void
    const pending = new Promise<void>(resolve => release = resolve)
    Object.assign(window, { releaseImageDecode: release })
    const decode = HTMLImageElement.prototype.decode
    HTMLImageElement.prototype.decode = async function () {
      if (this.classList.contains('forum-image-source'))
        await pending
      return decode.call(this)
    }
  })
  await page.route('https://example.com/decode.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"/>' }))
  await page.goto('feedback')
  const image = page.locator('.forum-image-source')
  await expect.poll(() => image.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(640)
  await expect(image).toHaveCSS('visibility', 'hidden')
  await expect(page.getByRole('img', { name: 'Visible alt', exact: true })).toBeVisible()
  await page.evaluate(() => (window as unknown as { releaseImageDecode: () => void }).releaseImageDecode())
  await expect(image).toHaveCSS('visibility', 'visible')
})

test('visible images finish before below-list speculation, with immediate placeholders', async ({ page }) => {
  const pending: Route[] = []
  await page.route('https://example.com/priority-*.svg', route => pending.push(route))
  // Deliberately held image responses must not block navigation's load event.
  await page.goto('feedback', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.topic-list')).toHaveAttribute('data-total-items', '20', { timeout: 30_000 })
  await expect.poll(() => pending.length).toBeGreaterThan(0)
  await expect(page.locator('img[aria-hidden="true"][src^="data:image"]')).not.toHaveCount(0)
  await page.waitForTimeout(200)
  const initial = pending.splice(0)
  expect(initial.length).toBeLessThanOrEqual(4)
  for (const route of initial) {
    const url = route.request().url()
    const image = page.locator(`img.forum-image-source[src="${url}"]`)
    await expect(image).toHaveAttribute('fetchpriority', 'high')
    await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"/>' })
  }
  await expect.poll(() => pending.length).toBeGreaterThan(0)
  await page.waitForTimeout(200)
  expect(pending.length).toBeLessThanOrEqual(4)
  expect(pending.length).toBeLessThan(topics.length - initial.length)
  for (const route of pending.splice(0)) {
    const image = page.locator(`img.forum-image-source[src="${route.request().url()}"]`)
    expect(await image.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(await page.evaluate(() => innerHeight))
    await route.abort()
  }
})

test('failed images hide their alt while loading the existing error image', async ({ page, scenario }) => {
  scenario.topics!.splice(0, scenario.topics!.length, issue({
    id: 980101,
    number: 'IIMAGEERROR',
    body: `![Failed image](https://example.com/fail.svg)${metadata}`,
    comments: 0,
  }))
  let release!: () => void
  const pending = new Promise<void>(resolve => release = resolve)
  await page.route('https://example.com/fail.svg', route => route.abort())
  await page.route('**/images/noImage.png', async (route) => {
    await pending
    await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"/>' })
  })
  await page.goto('feedback', { waitUntil: 'domcontentloaded' })
  const image = page.locator('.forum-image-source')
  try {
    await expect(image).toHaveAttribute('src', /\/images\/noImage\.png$/)
    await expect(image).toHaveCSS('visibility', 'hidden')
  }
  finally {
    release()
  }
  await expect(image).toHaveCSS('visibility', 'visible')
  await expect.poll(() => image.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(32)
})
