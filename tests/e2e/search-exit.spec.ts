import { expect, test } from './support/test'

test.use({ scenario: { topics: [], comments: [] } })

for (const width of [390, 1280]) {
  test(`search exit returns to the list that opened it at width ${width}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/feedback/closed/bug?sort=updated')
    await page.getByRole('button', { name: '搜索反馈', exact: true }).click()
    await expect(page).toHaveURL(/\/feedback\/search/)
    await page.setViewportSize({ width, height: 844 })
    const exit = page.getByRole('button', { name: '退出搜索', exact: true })
    await expect(exit).toBeVisible()
    await exit.focus()
    await expect(exit).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/feedback\/closed\/bug\?sort=updated$/)
  })
}

for (const [url, fallback, label] of [
  ['/feedback/search?q=sample', '/feedback', '退出搜索'],
  ['/en/feedback/search?q=sample', '/en/feedback', 'Exit search'],
  ['/ja/feedback/search?q=sample', '/ja/feedback', '検索を終了'],
  ['/feedback/user/alice/search?q=sample', '/feedback/user/alice', '退出搜索'],
]) {
  test(`a direct search URL exits inside the forum: ${url}`, async ({ page }) => {
    await page.goto(url)
    await page.getByRole('button', { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${fallback}$`))
  })
}
