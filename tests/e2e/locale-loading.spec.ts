import type { Page } from '@playwright/test'
import process from 'node:process'
import { loadTestMessages } from '../shared/support/i18n'
import { expect, test } from './support/test'

const preview = process.env.FORUM_E2E_PREVIEW === 'true'
const feedback = (locale: string) => (loadTestMessages(locale).docReaction as { feedbackMsg: string }).feedbackMsg

async function follow(page: Page, href: string) {
  await page.evaluate((target) => {
    const anchor = document.createElement('a')
    anchor.href = target
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  }, href)
}

test('production locale resources load on demand and history keeps translated UI', async ({ page }) => {
  test.skip(!preview, 'Validates built language chunks')
  const messages: string[] = []
  page.on('request', (request) => {
    if (/\/messages-[^/]+\.js/.test(request.url()))
      messages.push(request.url())
  })
  await page.goto('agreement')
  await expect(page.locator('#doc-feedback')).toContainText(feedback('zh'))
  expect(messages.some(url => url.includes('messages-zh.'))).toBe(true)
  expect(messages.some(url => /messages-(?:en|ja)\./.test(url))).toBe(false)
  await follow(page, '/docs/en/agreement')
  await expect(page.locator('#doc-feedback')).toContainText(feedback('en'))
  await follow(page, '/docs/ja/agreement')
  await expect(page.locator('#doc-feedback')).toContainText(feedback('ja'))
  await page.goBack()
  await expect(page.locator('#doc-feedback')).toContainText(feedback('en'))
  await page.goBack()
  await expect(page.locator('#doc-feedback')).toContainText(feedback('zh'))
  await page.goForward()
  await expect(page.locator('#doc-feedback')).toContainText(feedback('en'))
})

test('failed language request leaves URL and content intact and permits the same link retry', async ({ page }) => {
  test.skip(!preview, 'Validates built language chunks')
  let offline = true
  let failures = 0
  await page.route(/\/messages-en\.[^/]+\.js/, async (route) => {
    if (offline) {
      failures++
      await route.abort()
    }
    else {
      await route.continue()
    }
  })
  await page.goto('agreement')
  await expect(page.locator('#doc-feedback')).toContainText(feedback('zh'))
  await follow(page, '/docs/en/agreement')
  await expect.poll(() => failures).toBeGreaterThan(0)
  await expect(page.locator('.chunk-load-recovery')).toBeVisible()
  await expect(page).toHaveURL(/\/docs\/agreement$/)
  await expect(page.locator('#doc-feedback')).toContainText(feedback('zh'))
  offline = false
  await follow(page, '/docs/en/agreement')
  await expect(page.locator('#doc-feedback')).toContainText(feedback('en'))
  await expect(page).toHaveURL(/\/docs\/en\/agreement$/)
})

for (const locale of ['en', 'ja']) {
  test(`direct ${locale} document renders its interface before hydration`, async ({ page }) => {
    test.skip(!preview, 'Validates built language chunks')
    await page.goto(`${locale}/agreement`)
    await expect(page.locator('#doc-feedback')).toContainText(feedback(locale))
    await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${locale}`))
  })
}
