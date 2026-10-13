import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ viewport: { width: 390, height: 844 }, scenario: { topics: Array.from({ length: 20 }, (_, index) => issue({ id: 980000 + index, number: `ID${index}` })) } })

test('sidebar account and settings drawers release scrolling after repeated exits', async ({ page }) => {
  await page.goto('feedback')
  await expect(page.locator('.topic-list')).toHaveAttribute('data-total-items', '20', { timeout: 30_000 })
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByRole('button', { name: 'Menu', exact: true }).last().click()
    await page.locator('.forum-sidebar-account-trigger').click()
    const drawer = page.locator('.forum-sidebar-responsive-drawer')
    await expect(drawer).toBeVisible()
    await drawer.getByRole('button', { name: '设置', exact: true }).click()
    await expect(drawer.getByRole('heading', { name: '设置', exact: true }).last()).toBeVisible()
    await drawer.press('Escape')
    await expect(drawer).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('')
    await page.mouse.move(200, 450)
    const before = await page.evaluate(() => window.scrollY)
    await page.mouse.wheel(0, 300)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before)
  }
})
