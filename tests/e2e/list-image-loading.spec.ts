import type { Route } from '@playwright/test'
import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

const metadata = '{thumbhash:"1fsrB38I9wiIh4hwj3CI+AiIgIAICIgA",width:"640",height:"480"}'
const topics = Array.from({ length: 20 }, (_, index) => issue({ id: 980000 + index, number: `IM${index}`, body: `图片优先级测试。\n![image ${index}](https://example.com/priority-${index}.svg)${metadata}` }))
test.use({ scenario: { topics, comments: [] } })

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
