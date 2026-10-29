import { expect, test } from './support/test'

for (const width of [390, 820]) {
  test(`mobile sidebar stays below login dialog and its backdrop at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.addInitScript(() => localStorage.setItem('forum-account-login-access', 'true'))
    await page.goto('feedback')
    await expect(page.locator('.topic-list')).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Menu', exact: true }).last().click()
    await expect(page.locator('.VPSidebar')).toHaveClass(/open/)
    await page.evaluate(() => {
      location.hash = 'account-login-alert'
    })
    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()
    await expect(page.locator('.VPSidebar')).toHaveClass(/open/)
    // Visibility alone passes even when the sidebar paints over the dialog.
    await expect.poll(() => dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return element.contains(document.elementFromPoint(rect.x + 24, rect.y + rect.height / 2))
    })).toBe(true)
    await expect.poll(() => page.evaluate(() =>
      document.elementFromPoint(20, 100)?.getAttribute('data-slot'),
    )).toBe('dialog-overlay')
    await dialog.locator('[data-slot="dialog-close"]').click()
    await expect(dialog).toHaveCount(0)
  })
}
