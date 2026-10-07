import { expect, test } from './support/test'

test.use({ scenario: { topics: [], comments: [] } })

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`search facet transitions preserve focus with ${reducedMotion} motion`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion })
    await page.goto('/feedback/search')
    const stage = page.locator('.forum-search-filter-stage')
    const active = stage.locator('.forum-filter-picker:not([inert])')
    await active.getByRole('button', { name: '标签筛选', exact: true }).click()
    await expect(page.getByRole('heading', { name: '标签筛选', exact: true })).toBeVisible()
    await expect(active.getByRole('button', { name: '返回筛选条件' })).toBeFocused()
    await active.getByRole('button', { name: '返回筛选条件' }).click()
    await expect(active.getByRole('button', { name: '标签筛选', exact: true })).toBeFocused()
    await active.getByRole('button', { name: '作者筛选', exact: true }).click()
    await expect(active.locator('input')).toBeFocused()
    await active.locator('input').press('Escape')
    await expect(active.getByRole('button', { name: '作者筛选', exact: true })).toBeFocused()
    await active.getByRole('button', { name: '状态筛选', exact: true }).click()
    await expect(page.getByRole('heading', { name: '状态筛选', exact: true })).toBeVisible()
    await expect(active.getByRole('button', { name: '返回筛选条件' })).toBeFocused()
    await expect(stage.locator('[inert]')).toHaveCount(0)
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(active).toBeVisible()
  })
}
