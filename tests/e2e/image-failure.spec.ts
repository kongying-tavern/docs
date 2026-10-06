import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ scenario: { topics: [issue({ body: '图片失败仍保留容器\n![broken](https://webp.assets.interknot.site/e2e-missing.webp)' })] } })

test('failed topic image retains its mounted fallback and readable content', async ({ page }) => {
  await page.route('https://webp.assets.interknot.site/e2e-missing.webp', route => route.abort())
  await page.goto('/feedback/topic/123')
  const fallback = page.locator('img[alt="broken"]')
  await fallback.scrollIntoViewIfNeeded()
  await expect(fallback).toHaveAttribute('src', /\/images\/noImage\.png$/)
  await expect(fallback).toBeVisible()
  await expect(page.locator('[data-forum-shared-topic="content"], #content')).toContainText('图片失败仍保留容器')
})
